-- =============================================================================
-- Migration Rollback Proposal: 20260920_rbac_permission_rpc_proposal_rollback.sql
-- Status: PROPOSAL ONLY (DO NOT EXECUTE IN PRODUCTION/STAGING WITHOUT TESTING)
-- Description: Rollback script for 20260920_rbac_permission_rpc_proposal.sql
--
-- SECURITY WARNING:
-- Restoring pre-migration privileges grants EXECUTE on public.authorize(text) to PUBLIC.
-- This restores the pre-existing security exposure where anonymous users can execute authorize().
-- =============================================================================

BEGIN;

-- 1. Drop get_my_permissions RPC
DROP FUNCTION IF EXISTS public.get_my_permissions();

-- 2. Restore exact original authorize() function definition
CREATE OR REPLACE FUNCTION public.authorize(permission_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND permission_key = authorize.permission_key
  );
$$;

-- 3. Restore exact pre-migration routine execution privileges
-- The original migration (20260730000004_user_roles.sql) did not revoke PUBLIC execution privileges.
-- PostgreSQL default grants EXECUTE to PUBLIC on created functions.
GRANT EXECUTE ON FUNCTION public.authorize(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.authorize(text) TO authenticated;

COMMIT;
