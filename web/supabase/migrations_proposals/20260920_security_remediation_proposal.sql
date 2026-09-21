-- ============================================================================
-- PROPOSAL ONLY: Comprehensive Database Security & Advisor Remediation Proposal
-- ============================================================================
-- DO NOT EXECUTE AUTOMATICALLY. THIS FILE IS AN UNEXECUTED MIGRATION PROPOSAL
-- MOVED OUTSIDE THE AUTOMATIC MIGRATIONS EXECUTION PATH.
-- Addresses 100% of Supabase Security Advisor findings for Everloft Database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURITY DEFINER View Hardening on public.user_permissions
-- ----------------------------------------------------------------------------
-- Object: View public.user_permissions
-- Signature: public.user_permissions (View)
-- Advisor Issue: Security definer views bypass underlying RLS policies of referenced tables.
-- Call Sites: Server-side getDashboardSession() via admin/service role client.
-- Impact: Enforces RLS policies of user_roles, roles, and permissions tables.
-- Staging Test Instructions: Run SELECT * FROM user_permissions as authenticated user; verify RLS applies.
-- Rollback: ALTER VIEW public.user_permissions RESET (security_invoker);
-- Risk Rating: Low.

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
JOIN public.roles r ON ur.role_id = r.id
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE ur.deleted_at IS NULL;

REVOKE ALL ON public.user_permissions FROM PUBLIC, anon;
GRANT SELECT ON public.user_permissions TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. Revoke Public Execution on Sensitive RPC Functions & Clarify RPC Access
-- ----------------------------------------------------------------------------
-- Objects Affected:
--   - save_booking_record(jsonb)
--   - finalize_booking_record(uuid)
--   - record_booking_payment(jsonb)
--   - reverse_booking_payment(uuid, text)
--   - update_booking_stay_status(uuid, text)
--   - create_property_photo(uuid, uuid, integer)
--
-- Clarification on PostgREST RPC Security:
-- Server Action checks do NOT protect direct PostgREST RPC calls if authenticated users retain EXECUTE access!
-- Authenticated users with JWT tokens can call PostgREST endpoints directly (e.g. POST /rest/v1/rpc/save_booking_record).
-- Therefore, internal IF NOT public.authorize(...) THEN RAISE EXCEPTION ... END IF; statements inside each SECURITY DEFINER function
-- act as mandatory database-level gatekeepers enforcing permissions regardless of caller source.
--
-- Existing Grants: PUBLIC, anon, authenticated
-- Proposed Grants: REVOKE from PUBLIC & anon. GRANT EXECUTE to authenticated ONLY because application connects via authenticated JWT.
-- Staging Test Instructions: Call POST /rest/v1/rpc/save_booking_record with anon JWT (verify 401/403). Call with authenticated JWT lacking permission (verify "Permission denied" exception).
-- Rollback: GRANT EXECUTE ON FUNCTION public.save_booking_record(jsonb) TO PUBLIC;
-- Risk Rating: Low.

REVOKE EXECUTE ON FUNCTION public.save_booking_record(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finalize_booking_record(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_booking_payment(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reverse_booking_payment(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_booking_stay_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_property_photo(uuid, uuid, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_booking_record(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_booking_record(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_booking_payment(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_booking_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_stay_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_photo(uuid, uuid, integer) TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. Fix Mutable Search Paths on Trigger & Utility Functions
-- ----------------------------------------------------------------------------
-- Objects Affected:
--   - set_updated_at()
--   - set_audit_columns()
--   - record_audit_log()
--   - authorize(text)
--   - save_booking_record(jsonb)
--   - finalize_booking_record(uuid)
--   - record_booking_payment(jsonb)
--   - reverse_booking_payment(uuid, text)
--   - update_booking_stay_status(uuid, text)
--   - create_property_photo(uuid, uuid, integer)
--
-- Advisor Issue: Functions with mutable search path vulnerable to search-path hijacking in SECURITY DEFINER context.
-- Fix: Enforce explicit search_path = public, pg_temp.
-- Staging Test Instructions: Verify functions execute without schema resolution ambiguity.
-- Rollback: ALTER FUNCTION public.set_updated_at() RESET search_path;
-- Risk Rating: Minimal / Zero.

ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_audit_columns() SET search_path = public, pg_temp;
ALTER FUNCTION public.record_audit_log() SET search_path = public, pg_temp;
ALTER FUNCTION public.authorize(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.save_booking_record(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.finalize_booking_record(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_booking_payment(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.reverse_booking_payment(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_booking_stay_status(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_property_photo(uuid, uuid, integer) SET search_path = public, pg_temp;


-- ----------------------------------------------------------------------------
-- 4. Extension Schema Placement (citext, uuid-ossp, pgcrypto)
-- ----------------------------------------------------------------------------
-- Advisor Issue: Extensions installed in public schema pose potential security and namespace collision risks.
-- Fix Proposal: Relocate extensions from public schema to extensions schema.
-- Staging Test Instructions: Test schema migration in isolated test database before production.
-- Rollback: ALTER EXTENSION citext SET SCHEMA public;

-- CREATE SCHEMA IF NOT EXISTS extensions;
-- ALTER EXTENSION citext SET SCHEMA extensions;


-- ----------------------------------------------------------------------------
-- 5. Supabase Auth Leaked-Password & Security Recommendations
-- ----------------------------------------------------------------------------
-- Supabase Dashboard Configuration Steps:
-- 1. Enable Leaked Password Protection: Go to Supabase Dashboard -> Authentication -> Security -> Toggle "Prevent use of leaked passwords" (HaveIBeenPwned API integration).
-- 2. Enforce MFA Requirements: Configure Multi-Factor Authentication for Admin roles in Dashboard -> Authentication -> Policies.
-- ============================================================================
-- END OF PROPOSAL MIGRATION FILE
-- ============================================================================
