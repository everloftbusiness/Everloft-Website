-- ============================================================================
-- Migration: 20260924000001_security_grants_and_rate_limits.sql
-- Description: Explicit service_role & authenticated grants, user_permissions
--              security_invoker hardening, function search paths, execution
--              revocations on sensitive SECURITY DEFINER routines, and atomic
--              durable rate limiting table & RPC.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Explicit service_role Privileges
-- ----------------------------------------------------------------------------
-- Ensure service_role has necessary permissions for backend API operations.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO service_role;


-- ----------------------------------------------------------------------------
-- 2. Explicit authenticated Grants on Tables with RLS Policies
-- ----------------------------------------------------------------------------
-- Grant authenticated role permissions matching intentional RLS policies.
-- Master / Lookup tables (SELECT for authenticated, manage_properties for write)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.property_types,
  public.property_status,
  public.property_categories,
  public.room_types,
  public.amenity_master,
  public.utility_types,
  public.tags
TO authenticated;

-- Scoped Property Child Tables (read governed by can_view_property, write by manage_properties)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.properties,
  public.property_amenities,
  public.property_rooms,
  public.property_photos,
  public.property_videos,
  public.property_documents,
  public.property_rules,
  public.property_policies,
  public.nearby_attractions,
  public.property_tags,
  public.property_pricing,
  public.property_pricing_overrides,
  public.property_taxes,
  public.property_insurance,
  public.property_availability_blocks,
  public.property_utility_accounts,
  public.property_integrations,
  public.property_owners,
  public.property_investors,
  public.property_managers,
  public.beds,
  public.property_sleeping_arrangements,
  public.property_seo,
  public.property_settings
TO authenticated;

-- RBAC and User Profile Tables (governed by profile and rbac RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.roles,
  public.permissions,
  public.role_permissions,
  public.user_roles,
  public.activity_logs,
  public.notifications,
  public.files
TO authenticated;

-- Bookings and payments (if tables exist in live schema)
-- Authenticated role is restricted to SELECT only; writes are performed through restricted SECURITY DEFINER RPCs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.bookings TO authenticated;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_payments') THEN
    EXECUTE 'GRANT SELECT ON TABLE public.booking_payments TO authenticated;';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. public.user_permissions View Security Hardening
-- ----------------------------------------------------------------------------
-- Change view to security_invoker = true so underlying table RLS applies.
CREATE OR REPLACE VIEW public.user_permissions
WITH (security_invoker = true) AS
SELECT
  ur.user_id,
  p.key AS permission_key
FROM public.user_roles ur
JOIN public.roles r
  ON r.id = ur.role_id
 AND r.deleted_at IS NULL
JOIN public.role_permissions rp
  ON rp.role_id = r.id
 AND rp.deleted_at IS NULL
JOIN public.permissions p
  ON p.id = rp.permission_id
 AND p.deleted_at IS NULL
WHERE ur.deleted_at IS NULL;

-- Revoke all access from PUBLIC and anon; grant only to authenticated and service_role
REVOKE ALL ON public.user_permissions FROM PUBLIC, anon;
GRANT SELECT ON public.user_permissions TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 4. Fix Mutable Function Search Paths
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_audit_columns() SET search_path = public, pg_temp;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'authorize') THEN
    EXECUTE 'ALTER FUNCTION public.authorize(text) SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'has_role') THEN
    EXECUTE 'ALTER FUNCTION public.has_role(text) SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'can_view_property') THEN
    EXECUTE 'ALTER FUNCTION public.can_view_property(uuid) SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_auth_user') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_auth_user() SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_auth_user_login') THEN
    EXECUTE 'ALTER FUNCTION public.handle_auth_user_login() SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'record_audit_log') THEN
    EXECUTE 'ALTER FUNCTION public.record_audit_log() SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'refresh_sleeping_arrangement') THEN
    EXECUTE 'ALTER FUNCTION public.refresh_sleeping_arrangement() SET search_path = public, pg_temp;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_temp;';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 5. Revoke Public Execution on Sensitive SECURITY DEFINER Functions
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- authorize(text)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'authorize') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.authorize(text) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.authorize(text) TO authenticated, service_role;';
  END IF;

  -- has_role(text)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'has_role') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.has_role(text) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated, service_role;';
  END IF;

  -- can_view_property(uuid)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'can_view_property') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.can_view_property(uuid) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.can_view_property(uuid) TO authenticated, service_role;';
  END IF;

  -- handle_new_auth_user & handle_auth_user_login (Auth Triggers)
  -- Must be callable by postgres / supabase_auth_admin, but NEVER by public/anon
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_auth_user') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_auth_user_login') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_auth_user_login() FROM PUBLIC, anon;';
  END IF;

  -- record_audit_log & refresh_sleeping_arrangement (Table Triggers)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'record_audit_log') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.record_audit_log() FROM PUBLIC, anon;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'refresh_sleeping_arrangement') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.refresh_sleeping_arrangement() FROM PUBLIC, anon;';
  END IF;

  -- create_property_photo
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_property_photo') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.create_property_photo(uuid, uuid, integer) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_property_photo(uuid, uuid, integer) TO authenticated, service_role;';
  END IF;

  -- save_booking_record / finalize / payment RPCs
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'save_booking_record') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.save_booking_record(jsonb) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.save_booking_record(jsonb) TO authenticated, service_role;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'finalize_booking_record') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.finalize_booking_record(uuid) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.finalize_booking_record(uuid) TO authenticated, service_role;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'record_booking_payment') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.record_booking_payment(jsonb) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.record_booking_payment(jsonb) TO authenticated, service_role;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'reverse_booking_payment') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.reverse_booking_payment(uuid, text) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.reverse_booking_payment(uuid, text) TO authenticated, service_role;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_booking_stay_status') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_booking_stay_status(uuid, text) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.update_booking_stay_status(uuid, text) TO authenticated, service_role;';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 6. Atomic Durable Rate Limiting Table & RPC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Note: UNIQUE(key) already creates a unique index; explicit rate_limits_key_idx is omitted.
CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON public.rate_limits (reset_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Block all direct access from public, anon, and authenticated
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;
-- Only service_role can access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rate_limits TO service_role;

-- Atomic Postgres RPC for checking and incrementing rate limits
-- Eliminates SELECT-then-UPDATE concurrent race conditions.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_reset_at timestamptz;
  v_allowed boolean;
  v_remaining integer;
BEGIN
  -- Validate inputs
  IF p_key IS NULL OR length(trim(p_key)) = 0 OR length(p_key) > 255 THEN
    RAISE EXCEPTION 'Invalid rate limit key: must be non-empty and <= 255 characters';
  END IF;

  IF p_max_requests IS NULL OR p_max_requests < 1 OR p_max_requests > 100000 THEN
    RAISE EXCEPTION 'Invalid max requests: must be between 1 and 100000';
  END IF;

  IF p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 2592000 THEN
    RAISE EXCEPTION 'Invalid window seconds: must be between 1 and 2592000';
  END IF;

  -- 1. Periodic probabilistic prune of expired records older than 24 hours (1 in 100 chance)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE reset_at < (v_now - INTERVAL '24 hours');
  END IF;

  -- 2. Atomic Upsert with window evaluation
  INSERT INTO public.rate_limits (key, count, reset_at, updated_at)
  VALUES (
    p_key,
    1,
    v_now + (p_window_seconds || ' seconds')::interval,
    v_now
  )
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN rate_limits.reset_at <= v_now THEN 1
      ELSE rate_limits.count + 1
    END,
    reset_at = CASE
      WHEN rate_limits.reset_at <= v_now THEN v_now + (p_window_seconds || ' seconds')::interval
      ELSE rate_limits.reset_at
    END,
    updated_at = v_now
  RETURNING rate_limits.count, rate_limits.reset_at
  INTO v_count, v_reset_at;

  v_allowed := (v_count <= p_max_requests);
  v_remaining := GREATEST(0, p_max_requests - v_count);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'count', v_count,
    'reset_at', v_reset_at,
    'reset_time', (EXTRACT(EPOCH FROM v_reset_at) * 1000)::bigint
  );
END;
$$;

-- Restrict RPC execution strictly to service_role
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

COMMIT;

-- ----------------------------------------------------------------------------
-- ROLLBACK SCRIPT REFERENCE (Save as rollback migration if needed)
-- ----------------------------------------------------------------------------
/*
BEGIN;
ALTER VIEW public.user_permissions RESET (security_invoker);
GRANT SELECT ON public.user_permissions TO PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.check_rate_limit(text, integer, integer);
DROP TABLE IF EXISTS public.rate_limits;
COMMIT;
*/
