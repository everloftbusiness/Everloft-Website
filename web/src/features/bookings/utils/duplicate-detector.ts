/**
 * Duplicate & Additional Transaction Detection Engine
 *
 * Business Rule:
 * A row is only considered an existing duplicate if EVERYTHING matches:
 * - Property ID
 * - Guest Name (case-insensitive, trimmed)
 * - Check-in Date
 * - Unit / Room (if specific distinct rooms)
 * - Price / Amount (host total or guest total matches)
 * - Account / Bank (if specified, bank account matches)
 *
 * If ANY of these differ (e.g. same guest, same day, but different AMOUNT,
 * different ACCOUNT, or different ROOM), it is considered an additional
 * transaction, add-on, or separate unit booking.
 */

export type ExistingBookingRecord = {
  id?: string;
  property_id: string;
  property_name?: string | null;
  guest_name: string | null;
  check_in_date: string;
  check_out_date?: string | null;
  unit_label?: string | null;
  guest_total?: number | null;
  host_total?: number | null;
  notes?: string | null;
  accounts?: Set<string>;
};

export type IncomingBookingCandidate = {
  propertyId: string;
  propertyName?: string | null;
  guestName: string;
  checkInDate: string;
  unitLabel?: string | null;
  guestTotal?: number | null;
  hostTotal?: number | null;
  amountCreditedBank?: string | null;
};

/**
 * Normalizes string for comparison (trimmed, lowercased, extra spaces collapsed)
 */
export function normalizeString(val: string | null | undefined): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks if a unit label represents a generic single-property tag rather than a specific room number
 */
export function isGenericUnitLabel(label: string): boolean {
  const norm = normalizeString(label);
  return (
    !norm ||
    norm === 'whole villa' ||
    norm === 'villa' ||
    norm === 'entire property' ||
    norm === 'entire villa' ||
    norm === 'pinnacle' ||
    norm === 'default' ||
    norm === '—' ||
    norm === '-'
  );
}

/**
 * Builds a deterministic hash key for detecting identical duplicate rows within the same batch/sheet
 */
export function buildBatchDeduplicationKey(row: IncomingBookingCandidate): string {
  const normProp = normalizeString(row.propertyName) || row.propertyId || '';
  const normGuest = normalizeString(row.guestName);
  const normDate = row.checkInDate || '';
  const normUnit = isGenericUnitLabel(row.unitLabel || '') ? '' : normalizeString(row.unitLabel);
  const normBank = normalizeString(row.amountCreditedBank);

  // Round amounts to 2 decimal places to prevent floating-point mismatch
  const gTotal = row.guestTotal !== undefined && row.guestTotal !== null ? Number(row.guestTotal).toFixed(2) : '0.00';
  const hTotal = row.hostTotal !== undefined && row.hostTotal !== null ? Number(row.hostTotal).toFixed(2) : '0.00';

  return `${normProp}|${normGuest}|${normDate}|${normUnit}|${gTotal}|${hTotal}|${normBank}`;
}

/**
 * Checks whether an incoming booking candidate is an EXACT duplicate of an existing database record.
 * Returns true ONLY if property, guest, date, room, price, and account all match.
 * If price, account, or room differ, returns false (meaning it's an additional transaction / booking).
 */
export function isExactBookingDuplicate(
  incoming: IncomingBookingCandidate,
  existing: ExistingBookingRecord
): boolean {
  // 1. Property ID or normalized Property Name must match
  const propMatches =
    existing.property_id === incoming.propertyId ||
    (Boolean(existing.property_name && incoming.propertyName) &&
      normalizeString(existing.property_name) === normalizeString(incoming.propertyName));

  if (!propMatches) {
    return false;
  }

  // 2. Check-in Date must match
  if (existing.check_in_date !== incoming.checkInDate) {
    return false;
  }

  // 3. Guest Name must match
  const incGuest = normalizeString(incoming.guestName);
  const existGuest = normalizeString(existing.guest_name);
  if (!incGuest || !existGuest || incGuest !== existGuest) {
    return false;
  }

  // 4. Room / Unit Label comparison
  // If both have specific distinct room labels (e.g. 'Room 101' vs 'Room 102'), they are different bookings!
  const incUnit = normalizeString(incoming.unitLabel);
  const existUnit = normalizeString(existing.unit_label);
  if (!isGenericUnitLabel(incUnit) && !isGenericUnitLabel(existUnit)) {
    if (incUnit !== existUnit) {
      return false; // Different room booked by same guest on same day
    }
  }

  // 5. Price / Amount comparison
  // "different aMOUNT ... consider"
  const hasExistAmounts =
    (existing.guest_total !== undefined && existing.guest_total !== null && Number(existing.guest_total) > 0) ||
    (existing.host_total !== undefined && existing.host_total !== null && Number(existing.host_total) > 0);

  if (hasExistAmounts) {
    const incHost = incoming.hostTotal !== undefined && incoming.hostTotal !== null ? Number(incoming.hostTotal) : 0;
    const incGuest = incoming.guestTotal !== undefined && incoming.guestTotal !== null ? Number(incoming.guestTotal) : 0;
    const existHost = existing.host_total !== undefined && existing.host_total !== null ? Number(existing.host_total) : 0;
    const existGuest = existing.guest_total !== undefined && existing.guest_total !== null ? Number(existing.guest_total) : 0;

    // Check if host total matches (tolerance 1.0 rupee for penny rounding differences)
    const hostMatches = incHost > 0 && existHost > 0 && Math.abs(incHost - existHost) < 1.0;
    // Check if guest total matches (tolerance 1.0 rupee for tax rounding)
    const guestMatches = incGuest > 0 && existGuest > 0 && Math.abs(incGuest - existGuest) < 1.0;

    // If neither matches, it is a different amount (e.g. add-on, extension, or separate booking)
    if (!hostMatches && !guestMatches) {
      return false;
    }
  }

  // 6. Bank Account comparison
  // "different account consider"
  const incBank = normalizeString(incoming.amountCreditedBank);
  if (incBank && existing.accounts && existing.accounts.size > 0) {
    // If incoming has an explicit bank and existing booking has recorded transaction accounts:
    // They must intersect. If incoming is 'HDFC BANK' and existing is only 'EVERLOFT - KGB', it is a different account!
    const matchesAccount = Array.from(existing.accounts).some((acc) => {
      const normAcc = normalizeString(acc);
      return normAcc === incBank || normAcc.includes(incBank) || incBank.includes(normAcc);
    });
    if (!matchesAccount) {
      return false; // Different bank account -> different transaction
    }
  }

  // All criteria match: it is a true duplicate
  return true;
}
