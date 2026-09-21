-- =============================================================================
-- Migration Proposal: 20260920_rbac_permission_rpc_proposal.sql
-- Status: PROPOSAL ONLY (DO NOT EXECUTE IN PRODUCTION/STAGING WITHOUT TESTING)
-- Description: Non-recursive RBAC helper functions and restricted permission RPC.
-- =============================================================================
--
-- REVISION & ARCHITECTURAL SUMMARY:
-- 1. Direct Table Query in authorize(): public.authorize(permission_key) is redefined
--    as a SECURITY DEFINER function with SET search_path = '' querying base tables
--    (public.user_roles, public.roles, public.role_permissions, public.permissions)
--    directly instead of querying public.user_permissions. This prevents circular RLS recursion
--    when user_roles RLS policies evaluate authorize('manage_users').
-- 2. Zero-Argument RPC get_my_permissions(): Provides a secure SECURITY DEFINER RPC
--    returning permission key array for (SELECT auth.uid()) exclusively.
-- 3. Execution Privilege Revocation & Security Hardening:
--    - Original repository migration (20260730000004_user_roles.sql) created authorize()
--      without revoking PostgreSQL's default PUBLIC execution privilege.
--    - REVOKE EXECUTE from PUBLIC and anon. Grant EXECUTE only to authenticated.
-- 4. Application Migration Plan:
--    - Phase 1: Deploy authorize() direct query fix and get_my_permissions() RPC.
--    - Phase 2: Update application code to query get_my_permissions() RPC instead of SELECT * FROM user_permissions.
--    - Phase 3: Deprecate direct user_permissions view after staging validation.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Preflight ACL Query (inspect pre-migration routine privileges)
-- Run before migration to document baseline privileges:
-- -----------------------------------------------------------------------------
/*
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' AND routine_name IN ('authorize', 'get_my_permissions');
*/

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Non-Recursive Security Definer authorize() Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.authorize(permission_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
    JOIN public.role_permissions rp ON rp.role_id = r.id AND rp.deleted_at IS NULL
    JOIN public.permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.deleted_at IS NULL
      AND p.key = authorize.permission_key
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Zero-Argument Restricted get_my_permissions() RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE (permission_key text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT DISTINCT p.key AS permission_key
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
  JOIN public.role_permissions rp ON rp.role_id = r.id AND rp.deleted_at IS NULL
  JOIN public.permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
  WHERE ur.user_id = (SELECT auth.uid())
    AND ur.deleted_at IS NULL;
$$;

-- -----------------------------------------------------------------------------
-- 3. Execution Grants & Privilege Hardening
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.authorize(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_permissions() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.authorize(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_permissions() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Verification Test Cases (PostgREST / SQL RPC Test Suite)
-- -----------------------------------------------------------------------------
/*
TEST CASE 1: Anonymous Caller
- Call: SELECT public.authorize('manage_users');
- Expected: Error: "permission denied for function authorize" (SQL State 42501),
  NOT boolean false, because EXECUTE is revoked from PUBLIC and anon.

TEST CASE 2: Authenticated User with No Roles
- Setup: Auth user without user_roles rows.
- Call: SELECT public.authorize('manage_users');
- Expected: Returns false.

TEST CASE 3: Authenticated User with One Role (e.g. Operations Manager)
- Call: SELECT * FROM public.get_my_permissions();
- Expected: Returns list of assigned permission keys for that role.

TEST CASE 4: Administrator (Super Admin)
- Call: SELECT public.authorize('manage_roles');
- Expected: Returns true.

TEST CASE 5: Recursion Detection
- Call: SELECT * FROM public.user_roles WHERE user_id = auth.uid();
- Expected: Evaluates RLS policy user_roles_select_own_or_admin cleanly without recursion error.

TEST CASE 6: Attempt to Read Another User's Permissions
- Call: RPC get_my_permissions() takes zero arguments and filters strictly by auth.uid().
- Expected: Caller cannot supply target_user_id; cross-tenant permission leak impossible.
*/

COMMIT;
