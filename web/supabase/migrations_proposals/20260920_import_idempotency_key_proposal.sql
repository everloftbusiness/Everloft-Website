-- ============================================================================
-- PROPOSAL ONLY: Database Unique Index & Idempotency Key Proposal for Imports
-- ============================================================================
-- DO NOT EXECUTE AUTOMATICALLY. THIS FILE IS AN UNEXECUTED MIGRATION PROPOSAL.
-- Enforces DB-level uniqueness and race-safe idempotency for booking imports.
-- ============================================================================

-- Issue: In-memory pre-checks cannot guarantee idempotency against concurrent import requests.
-- Fix: Create a unique index on (property_id, primary_guest_id, check_in_date) for active bookings.

CREATE UNIQUE INDEX IF NOT EXISTS bookings_import_idempotency_idx
ON public.bookings(property_id, primary_guest_id, check_in_date)
WHERE deleted_at IS NULL;
