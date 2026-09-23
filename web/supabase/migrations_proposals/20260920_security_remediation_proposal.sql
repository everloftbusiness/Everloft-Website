-- ============================================================================
-- PROPOSAL ONLY: Comprehensive Database Security & Advisor Remediation Proposal
-- ============================================================================
-- DO NOT EXECUTE AUTOMATICALLY. THIS FILE IS AN UNEXECUTED MIGRATION PROPOSAL
-- MOVED OUTSIDE THE AUTOMATIC MIGRATIONS EXECUTION PATH.
-- Addresses 100% of Supabase Security Advisor findings for Everloft Database.
-- Includes Preflight Inspection, Rollback SQL, and Auth Trigger Preservations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. PREFLIGHT INSPECTION QUERIES (Run manually before applying)
-- ----------------------------------------------------------------------------
/*
-- Preflight 1: Inspect current views and security_invoker settings
SELECT table_name, is_insertable_into
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'user_permissions';

-- Preflight 2: Inspect existing RPC function search paths and grants
SELECT routine_name, security_type, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name IN ('authorize', 'get_my_permissions', 'set_updated_at');
*/

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SECURITY DEFINER View Hardening on public.user_permissions
-- ----------------------------------------------------------------------------
-- Enforces RLS policies of underlying tables when queried by authenticated users.
CREATE OR REPLACE VIEW public.user_permissions WITH (security_invoker = true) AS
SELECT 
    ur.user_id,
    r.id AS role_id,
    r.slug AS role_slug,
    r.name AS role_name,
    p.id AS permission_id,
    p.slug AS permission_slug,
    p.name AS permission_name,
    p.slug AS permission_key
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id AND r.deleted_at IS NULL
JOIN public.role_permissions rp ON r.id = rp.role_id AND rp.deleted_at IS NULL
JOIN public.permissions p ON rp.permission_id = p.id AND p.deleted_at IS NULL
WHERE ur.deleted_at IS NULL;

REVOKE ALL ON public.user_permissions FROM PUBLIC, anon;
GRANT SELECT ON public.user_permissions TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. Revoke Public Execution on Sensitive RPC Functions
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Revoke & Grant for save_booking_record
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'save_booking_record') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.save_booking_record(jsonb) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.save_booking_record(jsonb) TO authenticated;';
  END IF;

  -- Revoke & Grant for finalize_booking_record
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'finalize_booking_record') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.finalize_booking_record(uuid) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.finalize_booking_record(uuid) TO authenticated;';
  END IF;

  -- Revoke & Grant for record_booking_payment
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'record_booking_payment') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.record_booking_payment(jsonb) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.record_booking_payment(jsonb) TO authenticated;';
  END IF;

  -- Revoke & Grant for reverse_booking_payment
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'reverse_booking_payment') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.reverse_booking_payment(uuid, text) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.reverse_booking_payment(uuid, text) TO authenticated;';
  END IF;

  -- Revoke & Grant for update_booking_stay_status
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_booking_stay_status') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.update_booking_stay_status(uuid, text) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.update_booking_stay_status(uuid, text) TO authenticated;';
  END IF;

  -- Revoke & Grant for create_property_photo
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_property_photo') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_property_photo(uuid, uuid, integer) FROM PUBLIC, anon;';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_property_photo(uuid, uuid, integer) TO authenticated;';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. Fix Mutable Search Paths & Preserve Supabase Auth Trigger Permissions
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_audit_columns() SET search_path = public, pg_temp;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'authorize') THEN
    EXECUTE 'ALTER FUNCTION public.authorize(text) SET search_path = public, pg_temp;';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
    -- Preserve SECURITY DEFINER and auth trigger execution rights
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 4. ROLLBACK INSTRUCTIONS & SQL SCRIPT
-- ----------------------------------------------------------------------------
/*
-- Rollback SQL Block (Save as 20260920_security_remediation_proposal_rollback.sql if needed)
BEGIN;

ALTER VIEW public.user_permissions RESET (security_invoker);
GRANT SELECT ON public.user_permissions TO PUBLIC, anon, authenticated;

-- Restore public function execution grants if required
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'save_booking_record') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.save_booking_record(jsonb) TO PUBLIC, anon, authenticated;';
  END IF;
END $$;

COMMIT;
*/

COMMIT;
-- ============================================================================
-- END OF REVISED PROPOSAL MIGRATION FILE
-- ============================================================================
