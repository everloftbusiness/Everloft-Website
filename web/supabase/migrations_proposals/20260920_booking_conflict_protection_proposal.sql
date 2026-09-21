-- ============================================================================
-- PROPOSAL ONLY: Atomic Booking-Conflict Protection Migration Proposal
-- ============================================================================
-- DO NOT EXECUTE AUTOMATICALLY. THIS FILE IS AN UNEXECUTED MIGRATION PROPOSAL.
-- Implements atomic transaction-level overlap prevention in save_booking_record RPC.
-- ============================================================================

-- Scoping & Conflict Policy Rules:
-- 1. Overlap condition: (existing.check_in_date < requested.check_out_date AND existing.check_out_date > requested.check_in_date)
-- 2. Adjacent stays (e.g. check-out on Oct 5 and check-in on Oct 5) are allowed (Oct 5 < Oct 5 evaluates to FALSE).
-- 3. Excludes cancelled stays (status NOT IN ('cancelled', 'rejected')) and deleted bookings (deleted_at IS NULL).
-- 4. Excludes the current booking record being edited (id <> bid).
-- 5. Scope: If unit_label is specified, conflict checks match (property_id = req.property_id AND unit_label = req.unit_label).
--    If unit_label is NULL/empty, conflict applies property-wide (property_id = req.property_id).
-- 6. Concurrency Locking: Uses pg_advisory_xact_lock(hashtextextended(payload->>'property_id', 0)) to serialize concurrent booking transactions per property.

CREATE OR REPLACE FUNCTION public.save_booking_record(payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  bid uuid;
  gid uuid;
  entry jsonb;
  curr text;
  precision_digits integer;
  existing public.bookings;
  req_prop_id uuid;
  req_check_in date;
  req_check_out date;
  req_unit text;
  req_status text;
  has_conflict boolean;
BEGIN
  -- 1. Internal RBAC Gatekeeper
  IF NOT public.authorize('manage_booking_register') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  bid := nullif(payload->>'id','')::uuid;
  req_prop_id := (payload->>'property_id')::uuid;
  req_check_in := (payload->>'check_in_date')::date;
  req_check_out := (payload->>'check_out_date')::date;
  req_unit := nullif(trim(payload->>'unit_label'),'');
  req_status := coalesce(payload->>'status', 'confirmed');
  curr := payload->>'currency';
  precision_digits := CASE curr WHEN 'JPY' THEN 0 WHEN 'KWD' THEN 3 ELSE 2 END;

  -- 2. Transaction Concurrency Advisory Lock (Serializes overlapping checks for target property)
  PERFORM pg_advisory_xact_lock(hashtextextended(req_prop_id::text, 0));

  -- 3. Atomic Overlapping Booking Conflict Check
  -- Only non-cancelled active bookings can create conflicts
  IF req_status NOT IN ('cancelled', 'rejected') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.property_id = req_prop_id
        AND b.deleted_at IS NULL
        AND b.status NOT IN ('cancelled', 'rejected')
        AND (bid IS NULL OR b.id <> bid)
        AND (req_unit IS NULL OR b.unit_label IS NULL OR b.unit_label = req_unit)
        AND (b.check_in_date < req_check_out AND b.check_out_date > req_check_in)
    ) INTO has_conflict;

    IF has_conflict THEN
      RAISE EXCEPTION 'Booking conflict: Selected dates overlap with an existing reservation.';
    END IF;
  END IF;

  -- 4. Existing Booking Update or Retry-Safe Creation
  IF bid IS NOT NULL THEN
    SELECT * INTO existing FROM public.bookings WHERE id = bid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
    IF existing.financial_status <> 'draft' THEN RAISE EXCEPTION 'Finalized booking is locked'; END IF;
    IF nullif(payload->>'updated_at','')::timestamptz IS DISTINCT FROM existing.updated_at THEN
      RAISE EXCEPTION 'This booking changed. Reload before saving.';
    END IF;
    IF EXISTS(SELECT 1 FROM public.booking_payments WHERE booking_id = bid) THEN
      RAISE EXCEPTION 'Booking has payments';
    END IF;
    gid := existing.primary_guest_id;
  ELSE
    -- Retry-safe creation, serialized on request_id
    PERFORM pg_advisory_xact_lock(hashtextextended(payload->>'request_id', 0));
    SELECT id INTO bid FROM public.bookings WHERE request_id = (payload->>'request_id')::uuid;
    IF bid IS NOT NULL THEN RETURN bid; END IF;

    gid := nullif(payload->>'guest_id','')::uuid;
    IF gid IS NULL THEN
      INSERT INTO public.guest_profiles(full_name, email, phone, country)
      VALUES(trim(payload->>'guest_name'), nullif(trim(payload->>'email'),''), nullif(trim(payload->>'phone'),''), nullif(trim(payload->>'country'),''))
      RETURNING id INTO gid;
    ELSIF NOT EXISTS(SELECT 1 FROM public.guest_profiles WHERE id = gid AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Guest not found';
    END IF;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM public.properties WHERE id = req_prop_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF payload->'lines' IS NULL OR jsonb_typeof(payload->'lines') <> 'array' THEN
    RAISE EXCEPTION 'Provide guest and host breakdowns';
  END IF;
  IF jsonb_array_length(payload->'lines') NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Provide guest and host breakdowns';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'lines') l WHERE l->>'side'='guest') OR
     NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'lines') l WHERE l->>'side'='host') THEN
    RAISE EXCEPTION 'Both financial sides are required';
  END IF;

  -- 5. Insert or Update Booking Record
  IF bid IS NULL THEN
    INSERT INTO public.bookings(request_id, property_id, primary_guest_id, unit_label, source, external_booking_ref, booking_date, check_in_date, check_out_date, adults, children, currency, status, notes)
    VALUES((payload->>'request_id')::uuid, req_prop_id, gid, req_unit, trim(payload->>'source'), nullif(trim(payload->>'external_booking_ref'),''), (payload->>'booking_date')::date, req_check_in, req_check_out, (payload->>'adults')::int, (payload->>'children')::int, curr, req_status, coalesce(payload->>'notes',''))
    RETURNING id INTO bid;
  ELSE
    UPDATE public.bookings
    SET property_id = req_prop_id,
        unit_label = req_unit,
        source = trim(payload->>'source'),
        external_booking_ref = nullif(trim(payload->>'external_booking_ref'),''),
        booking_date = (payload->>'booking_date')::date,
        check_in_date = req_check_in,
        check_out_date = req_check_out,
        adults = (payload->>'adults')::int,
        children = (payload->>'children')::int,
        currency = curr,
        status = req_status,
        notes = coalesce(payload->>'notes','')
    WHERE id = bid;

    DELETE FROM public.booking_financial_lines WHERE booking_id = bid;
  END IF;

  FOR entry IN SELECT * FROM jsonb_array_elements(payload->'lines') LOOP
    IF (entry->>'amount')::numeric <> round((entry->>'amount')::numeric, precision_digits) THEN
      RAISE EXCEPTION 'Invalid currency precision';
    END IF;
    INSERT INTO public.booking_financial_lines(booking_id, side, category, label, amount)
    VALUES(bid, entry->>'side', entry->>'category', trim(entry->>'label'), (entry->>'amount')::numeric);
  END LOOP;

  IF EXISTS(SELECT 1 FROM public.booking_financial_lines WHERE booking_id = bid GROUP BY side HAVING sum(amount) < 0) THEN
    RAISE EXCEPTION 'Financial totals cannot be negative';
  END IF;

  RETURN bid;
END $$;
