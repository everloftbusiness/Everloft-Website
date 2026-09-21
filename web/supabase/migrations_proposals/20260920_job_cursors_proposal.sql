-- =============================================================================
-- Migration Proposal: 20260920_job_cursors_proposal.sql
-- Status: PROPOSAL ONLY (DO NOT EXECUTE IN PRODUCTION/STAGING WITHOUT APPROVAL)
-- Description: Hardened job_cursors table and atomic locking RPCs for distributed cron execution.
-- =============================================================================
--
-- REVISION SUMMARY:
-- 1. Table Access Restrictions: Infrastructure cursor table is NOT writable by normal users.
--    REVOKE ALL ON public.job_cursors FROM PUBLIC, anon, and authenticated.
--    GRANT SELECT, INSERT, UPDATE strictly to service_role.
-- 2. No authenticated policies: RLS enabled with zero policies for authenticated/anon users.
-- 3. Atomic Claim Operation (claim_job_cursor): Acquires lock ONLY when locked_until IS NULL
--    OR locked_until < now(). Returns true if lock acquired, false if active.
-- 4. Atomic Release Operation (release_job_cursor): Updates cursor position and releases lock (locked_until = NULL).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.job_cursors (
  job_name TEXT PRIMARY KEY,
  cursor_value TEXT NOT NULL DEFAULT '',
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.job_cursors ENABLE ROW LEVEL SECURITY;

-- 1. Revoke all privileges from untrusted roles
REVOKE ALL ON public.job_cursors FROM PUBLIC, anon, authenticated;

-- 2. Grant minimal required privileges strictly to service_role (used by cron routes)
GRANT SELECT, INSERT, UPDATE ON public.job_cursors TO service_role;

-- -----------------------------------------------------------------------------
-- 3. Atomic Claim RPC (claim_job_cursor)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_job_cursor(
  p_job_name text,
  p_lock_seconds int DEFAULT 300
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows_affected int;
BEGIN
  INSERT INTO public.job_cursors (job_name, cursor_value, locked_until, updated_at)
  VALUES (p_job_name, '', now() + (p_lock_seconds || ' seconds')::interval, now())
  ON CONFLICT (job_name) DO UPDATE
  SET locked_until = now() + (p_lock_seconds || ' seconds')::interval,
      updated_at = now()
  WHERE public.job_cursors.locked_until IS NULL
     OR public.job_cursors.locked_until < now();

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Atomic Release/Update RPC (release_job_cursor)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_job_cursor(
  p_job_name text,
  p_new_cursor text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.job_cursors
  SET cursor_value = p_new_cursor,
      locked_until = NULL,
      updated_at = now()
  WHERE job_name = p_job_name;

  RETURN FOUND;
END;
$$;

-- 5. RPC Privileges: Restrict execution strictly to service_role
REVOKE ALL ON FUNCTION public.claim_job_cursor(text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_job_cursor(text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_job_cursor(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_job_cursor(text, text) TO service_role;

-- -----------------------------------------------------------------------------
-- Verification Test Cases & Concurrency Scenarios Documentation
-- -----------------------------------------------------------------------------
/*
TEST CASE 1: Overlap Prevention (Active Lock)
- Scenario: Job A claims 'ical_sync' for 300s. While active (locked_until > now()), Job B calls claim_job_cursor('ical_sync', 300).
- Expected: Job B receives `false`. Zero update performed on job_cursors. Single execution guaranteed.

TEST CASE 2: Expired Lock Acquisition
- Scenario: Job A claimed 'ical_sync' but locked_until has passed (now() > locked_until). Job B calls claim_job_cursor('ical_sync', 300).
- Expected: Job B receives `true`. locked_until updated to now() + 300s. Lock acquired safely.

TEST CASE 3: Failure Recovery (Crashed Process)
- Scenario: Job A claims 'ical_sync', starts processing, but crashes before calling release_job_cursor().
- Expected: After 300s TTL expires, next scheduled run (Job B) claims lock successfully via expired-lock logic. System recovers automatically without manual DB intervention.

TEST CASE 4: Concurrent Claim Safety
- Scenario: 2 identical cron instances trigger simultaneously and invoke claim_job_cursor('ical_sync', 300) at exact same millisecond.
- Expected: PostgreSQL row-level lock on PRIMARY KEY (job_name) forces sequential evaluation. Instance 1 acquires lock (returns true); Instance 2 WHERE clause fails (locked_until is no longer null/expired) and returns false. Exactly one job runs.

TEST CASE 5: Authenticated User Access Block
- Scenario: Client app logged in as authenticated user attempts `SELECT * FROM public.job_cursors` or `SELECT public.claim_job_cursor(...)`.
- Expected: Query rejected with 'permission denied' (SQL State 42501). Infrastructure cursors remain completely shielded.
*/

COMMIT;
