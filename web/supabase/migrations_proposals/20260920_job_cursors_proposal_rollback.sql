-- =============================================================================
-- Migration Rollback Proposal: 20260920_job_cursors_proposal_rollback.sql
-- Status: PROPOSAL ONLY
-- Description: Rollback script for 20260920_job_cursors_proposal.sql
-- =============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.claim_job_cursor(text, int);
DROP FUNCTION IF EXISTS public.release_job_cursor(text, text);
DROP TABLE IF EXISTS public.job_cursors CASCADE;

COMMIT;
