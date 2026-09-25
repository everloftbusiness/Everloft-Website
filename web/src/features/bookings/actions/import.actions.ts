'use server';

import { revalidatePath } from 'next/cache';
import { getDashboardSession } from '@/lib/dashboard/session';
import { getBookingOptions, saveBooking, finalizeBooking, recordPayment } from '../services/bookings.service';
import { bookingSchema, paymentSchema } from '../schemas/booking.schema';
import type { ParsedImportRow } from '../utils/csv-parser';
import type { FinancialLine } from '../types/booking.types';
import {
  isExactBookingDuplicate,
  buildBatchDeduplicationKey,
  type ExistingBookingRecord,
  type IncomingBookingCandidate,
} from '../utils/duplicate-detector';

const MAX_IMPORT_ROWS = 500;

export async function importBookingsAction(
  rows: ParsedImportRow[],
  defaultPropertyId: string
) {
  // 1. Authorization Guard
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings') && session.role !== 'super_admin' && session.role !== 'finance_admin' && session.role !== 'operations_manager') {
    throw new Error('Forbidden: Insufficient permissions (manage_bookings required).');
  }

  // 2. Row Boundary Guard
  if (!rows || rows.length === 0) {
    throw new Error('No valid rows provided for import.');
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Import payload exceeds maximum limit of ${MAX_IMPORT_ROWS} rows per request (received ${rows.length} rows).`);
  }

  const properties = await getBookingOptions();
  let importedCount = 0;
  const errors: string[] = [];

  // Pre-determine target property ID for each row to build precise query filter
  const rowPropertyIds: string[] = [];
  for (const r of rows) {
    if (!r.isValid) continue;
    const matchedProp = properties.find(
      (p) => p.name.includes(r.roomLabel) || p.id === defaultPropertyId
    ) || properties[0];
    const targetPropertyId = matchedProp ? matchedProp.id : defaultPropertyId;
    rowPropertyIds.push(targetPropertyId);
  }

  // Deduplicate property IDs in batch
  const batchPropertyIds = Array.from(new Set(rowPropertyIds.filter(Boolean)));

  // 3. Scoped duplicate check query (restricted by date window AND batch property IDs)
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  const validCheckInDates = rows.filter((r) => r.isValid && r.checkInDate).map((r) => r.checkInDate);
  const minDate = validCheckInDates.length > 0 ? validCheckInDates.reduce((a, b) => (a < b ? a : b)) : null;
  const maxDate = validCheckInDates.length > 0 ? validCheckInDates.reduce((a, b) => (a > b ? a : b)) : null;

  const existingBookings: ExistingBookingRecord[] = [];

  if (batchPropertyIds.length > 0) {
    // Chunk property IDs in batches of 50 if necessary
    const CHUNK_SIZE = 50;
    for (let i = 0; i < batchPropertyIds.length; i += CHUNK_SIZE) {
      const chunk = batchPropertyIds.slice(i, i + CHUNK_SIZE);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (admin as any)
        .from('bookings')
        .select('id, property_id, guest_name, check_in_date, check_out_date, unit_label, guest_total, host_total, notes')
        .is('deleted_at', null)
        .in('property_id', chunk);

      if (minDate && maxDate) {
        query = query.gte('check_in_date', minDate).lte('check_in_date', maxDate);
      }

      const { data: chunkData } = await query;
      if (chunkData && Array.isArray(chunkData)) {
        for (const item of chunkData) {
          const accounts = new Set<string>();
          if (item.notes) {
            const match = item.notes.match(/(kgb|hdfc|sbi|icici|axis|bank|cash|paytm|everloft - kgb)/i);
            if (match) accounts.add(match[0].toLowerCase());
          }
          existingBookings.push({
            id: item.id,
            property_id: item.property_id,
            guest_name: item.guest_name,
            check_in_date: item.check_in_date,
            check_out_date: item.check_out_date,
            unit_label: item.unit_label,
            guest_total: item.guest_total !== undefined && item.guest_total !== null ? Number(item.guest_total) : null,
            host_total: item.host_total !== undefined && item.host_total !== null ? Number(item.host_total) : null,
            notes: item.notes,
            accounts,
          });
        }
      }
    }

    // Attempt to enrich with transaction accounts if available
    const bookingIds = existingBookings.map((b) => b.id).filter(Boolean);
    if (bookingIds.length > 0) {
      try {
        const { data: txData } = await (admin as any)
          .from('transactions')
          .select('related_entity_id, account_label')
          .is('deleted_at', null)
          .in('related_entity_id', bookingIds);

        if (txData && Array.isArray(txData)) {
          for (const tx of txData) {
            if (tx.related_entity_id && tx.account_label) {
              const b = existingBookings.find((eb) => eb.id === tx.related_entity_id);
              if (b) {
                if (!b.accounts) b.accounts = new Set();
                b.accounts.add(tx.account_label.trim().toLowerCase());
              }
            }
          }
        }
      } catch {
        // Non-blocking in case transactions table is mocked or unpopulated
      }
    }
  }

  const seenInBatchKeys = new Set<string>();

  // Unique Batch ID for this import session
  const batchId = crypto.randomUUID().slice(0, 8).toUpperCase();

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    if (!r.isValid) continue;

    try {
      const matchedProp = properties.find(
        (p) => p.name.includes(r.roomLabel) || p.id === defaultPropertyId
      ) || properties[0];

      const targetPropertyId = matchedProp ? matchedProp.id : defaultPropertyId;

      const candidate: IncomingBookingCandidate = {
        propertyId: targetPropertyId,
        guestName: r.guestName,
        checkInDate: r.checkInDate,
        unitLabel: r.roomLabel,
        guestTotal: r.guestTotal,
        hostTotal: r.hostTotal,
        amountCreditedBank: r.amountCreditedBank,
      };

      // 1. Check if exact duplicate exists in DB
      // (Only considered duplicate if name, price, check-in date, account number, etc. all match)
      const matchingDbBooking = existingBookings.find((eb) => isExactBookingDuplicate(candidate, eb));
      if (matchingDbBooking) {
        continue;
      }

      // 2. Check if identical duplicate within this import batch
      const batchKey = buildBatchDeduplicationKey(candidate);
      if (seenInBatchKeys.has(batchKey)) {
        continue;
      }
      seenInBatchKeys.add(batchKey);

      const isDirect =
        r.source.toLowerCase().includes('db') ||
        r.source.toLowerCase().includes('direct');

      const lines: FinancialLine[] = [];

      if (r.guestBase > 0) {
        lines.push({ side: 'guest', category: 'accommodation', label: 'Base Fare', amount: r.guestBase.toFixed(2) });
      }
      if (r.guestTaxes > 0) {
        lines.push({ side: 'guest', category: 'tax', label: 'Taxes & GST (18%)', amount: r.guestTaxes.toFixed(2) });
      }
      if (r.guestServiceCharge > 0) {
        lines.push({ side: 'guest', category: 'guest_service_fee', label: 'Services Charge', amount: r.guestServiceCharge.toFixed(2) });
      }
      if (lines.filter((l) => l.side === 'guest').length === 0) {
        lines.push({ side: 'guest', category: 'accommodation', label: 'Total Charge', amount: r.guestTotal.toFixed(2) });
      }

      if (r.hostBase > 0) {
        lines.push({ side: 'host', category: 'accommodation', label: 'Host Base Payout', amount: r.hostBase.toFixed(2) });
      }
      if (r.hostRateAdjustment !== 0) {
        lines.push({ side: 'host', category: 'rate_adjustment', label: 'Rate Adjustment', amount: r.hostRateAdjustment.toFixed(2) });
      }
      if (r.hostServiceFee > 0) {
        // Channel service fee deduction must be negative so sum(amount) in booking_register computes host_total correctly
        lines.push({ side: 'host', category: 'host_service_fee', label: 'Channel Service Fee', amount: (-Math.abs(r.hostServiceFee)).toFixed(2) });
      }
      if (r.hostTaxes > 0) {
        // TDS / Tax withholding deduction must be negative
        lines.push({ side: 'host', category: 'tax', label: 'Taxes & TDS Withholding', amount: (-Math.abs(r.hostTaxes)).toFixed(2) });
      }
      if (r.hostAdditionalIncome > 0) {
        lines.push({ side: 'host', category: 'additional_income', label: 'Additional Income', amount: r.hostAdditionalIncome.toFixed(2) });
      }

      // Reconcile host lines to ensure their net sum matches r.hostTotal exactly
      const currentHostSum = lines
        .filter((l) => l.side === 'host')
        .reduce((sum, l) => sum + parseFloat(l.amount), 0);

      if (lines.filter((l) => l.side === 'host').length === 0) {
        lines.push({ side: 'host', category: 'accommodation', label: 'Net Payout', amount: (r.hostTotal || 0).toFixed(2) });
      } else if (r.hostTotal > 0 && Math.abs(currentHostSum - r.hostTotal) >= 0.01) {
        const diff = Math.round((r.hostTotal - currentHostSum) * 100) / 100;
        lines.push({
          side: 'host',
          category: diff > 0 ? 'additional_income' : 'other',
          label: diff > 0 ? 'Payout Reconciliation Adjustment' : 'Channel Reconciliation Deduction',
          amount: diff.toFixed(2),
        });
      }

      // Ensure checkout is always strictly greater than check-in
      let checkOutDate = r.checkOutDate;
      if (!checkOutDate || checkOutDate <= r.checkInDate) {
        const [y, m, d] = r.checkInDate.split('-').map(Number);
        const nextDay = new Date(Date.UTC(y, m - 1, d + Math.max(1, r.nights || 1)));
        checkOutDate = nextDay.toISOString().slice(0, 10);
      }

      const isCancelled = r.isCancelled || r.source.toLowerCase().includes('cancel') || (r.note || '').toLowerCase().includes('cancel');
      const externalBookingRef = `IMP-${batchId}-${idx + 1}-${r.rawLineIndex}`;

      const bookingPayload = {
        request_id: crypto.randomUUID(),
        property_id: targetPropertyId,
        guest_id: '',
        guest_name: r.guestName,
        phone: r.contactPhone || '',
        email: '',
        country: 'India',
        unit_label: r.roomLabel || '',
        source: r.source || 'Direct',
        external_booking_ref: externalBookingRef,
        booking_date: r.checkInDate,
        check_in_date: r.checkInDate,
        check_out_date: checkOutDate,
        adults: 1,
        children: 0,
        currency: 'INR' as const,
        status: isCancelled ? ('cancelled' as const) : ('confirmed' as const),
        collection_mode: isDirect ? ('direct' as const) : ('platform' as const),
        notes: r.note ? `${r.note} (Imported)` : 'Imported from Google Sheet',
        lines: lines.map((l) => ({
          side: l.side,
          category: l.category as 'accommodation' | 'rate_adjustment' | 'cleaning' | 'guest_service_fee' | 'host_service_fee' | 'tax' | 'withholding' | 'additional_income' | 'discount' | 'other',
          label: l.label,
          amount: l.amount,
        })),
      };

      const validatedInput = bookingSchema.parse(bookingPayload);
      const bookingId = await saveBooking(validatedInput);
      await finalizeBooking(bookingId);

      const paymentAmount = isDirect ? r.guestTotal : r.hostTotal;
      if (r.amountCreditedBank && paymentAmount > 0) {
        const paymentPayload = {
          request_id: crypto.randomUUID(),
          booking_id: bookingId,
          payment_type: isDirect ? ('guest_collection' as const) : ('host_payout' as const),
          direction: 'inbound' as const,
          amount: paymentAmount.toFixed(2),
          account_label: r.amountCreditedBank,
          payment_method: 'Bank Transfer',
          reference: r.note || 'Bank Receipt Credit',
          settled_at: r.creditedDate || r.checkInDate,
        };
        const validatedPayment = paymentSchema.parse(paymentPayload);
        await recordPayment(validatedPayment);
      }

      importedCount++;
    } catch (err) {
      // Sanitized log without guest PII
      console.error(
        'Import error on line index:',
        r.rawLineIndex,
        err instanceof Error ? err.message : 'Validation/Save failed'
      );
      errors.push(`Row ${r.rawLineIndex}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  revalidatePath('/dashboard/bookings', 'layout');
  return { success: true, count: importedCount, errors };
}

export async function syncPinnacleSheetAction(defaultPropertyId: string) {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings') && session.role !== 'super_admin' && session.role !== 'finance_admin') {
    throw new Error('Forbidden: Insufficient permissions.');
  }

  const { fetchSheetData } = await import('@/lib/dashboard/sheets');
  const { parseGoogleSheetCsv } = await import('../utils/csv-parser');

  try {
    const rawRows = await fetchSheetData('Pinnacle Income', '1Q_fEZLHCENn-her2QOSkniZqkP-f6DBe');
    if (!rawRows || rawRows.length === 0) {
      return { success: false, message: 'No rows found in Pinnacle Income tab.' };
    }

    const keys = Object.keys(rawRows[0] || {});
    const csvLines = [
      keys.join(','),
      ...rawRows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
    ];
    const csvContent = csvLines.join('\n');

    const parsedRows = parseGoogleSheetCsv(csvContent);
    const validRows = parsedRows.filter((r) => r.isValid);

    if (validRows.length === 0) {
      return { success: false, message: 'Google Sheet accessible, but no valid booking rows found to sync.' };
    }

    const result = await importBookingsAction(validRows, defaultPropertyId);
    return {
      success: true,
      message: `Successfully synced ${result.count} rows live from Google Sheet 'Pinnacle Income'!`,
      count: result.count,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('sign-in') || msg.includes('Anyone with the link')) {
      return {
        success: false,
        requiresPermission: true,
        message: 'Google Sheet is currently restricted. Please update Google Drive permission to "Anyone with the link can view".',
      };
    }
    return { success: false, message: `Sync failed: ${msg}` };
  }
}

export type ImportRowAnalysis = {
  rawLineIndex: number;
  guestName: string;
  roomLabel: string;
  checkInDate: string;
  checkOutDate: string;
  propertyId: string;
  propertyName: string;
  status: 'new' | 'duplicate' | 'invalid';
  reason?: string;
  guestTotal: number;
  hostTotal: number;
};

export async function analyzeImportRowsAction(
  rows: ParsedImportRow[],
  defaultPropertyId: string
) {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings') && session.role !== 'super_admin' && session.role !== 'finance_admin' && session.role !== 'operations_manager') {
    throw new Error('Forbidden: Insufficient permissions.');
  }

  if (!rows || rows.length === 0) {
    return {
      success: true,
      total: 0,
      newCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      analyzedRows: [],
    };
  }

  const properties = await getBookingOptions();

  const rowPropertyMap = new Map<number, { id: string; name: string }>();
  const rowPropertyIds: string[] = [];

  rows.forEach((r) => {
    if (!r.isValid) return;
    const matchedProp = properties.find(
      (p) => p.name.includes(r.roomLabel) || p.id === defaultPropertyId
    ) || properties[0];
    const targetProp = matchedProp ? { id: matchedProp.id, name: matchedProp.name } : { id: defaultPropertyId, name: 'Default Property' };
    rowPropertyMap.set(r.rawLineIndex, targetProp);
    rowPropertyIds.push(targetProp.id);
  });

  const batchPropertyIds = Array.from(new Set(rowPropertyIds.filter(Boolean)));
  const validCheckInDates = rows.filter((r) => r.isValid && r.checkInDate).map((r) => r.checkInDate);
  const minDate = validCheckInDates.length > 0 ? validCheckInDates.reduce((a, b) => (a < b ? a : b)) : null;
  const maxDate = validCheckInDates.length > 0 ? validCheckInDates.reduce((a, b) => (a > b ? a : b)) : null;

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  const existingBookings: ExistingBookingRecord[] = [];

  if (batchPropertyIds.length > 0) {
    const CHUNK_SIZE = 50;
    for (let i = 0; i < batchPropertyIds.length; i += CHUNK_SIZE) {
      const chunk = batchPropertyIds.slice(i, i + CHUNK_SIZE);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (admin as any)
        .from('bookings')
        .select('id, property_id, guest_name, check_in_date, check_out_date, unit_label, guest_total, host_total, notes')
        .is('deleted_at', null)
        .in('property_id', chunk);

      if (minDate && maxDate) {
        query = query.gte('check_in_date', minDate).lte('check_in_date', maxDate);
      }

      const { data: chunkData } = await query;
      if (chunkData && Array.isArray(chunkData)) {
        for (const item of chunkData) {
          const accounts = new Set<string>();
          if (item.notes) {
            const match = item.notes.match(/(kgb|hdfc|sbi|icici|axis|bank|cash|paytm|everloft - kgb)/i);
            if (match) accounts.add(match[0].toLowerCase());
          }
          existingBookings.push({
            id: item.id,
            property_id: item.property_id,
            guest_name: item.guest_name,
            check_in_date: item.check_in_date,
            check_out_date: item.check_out_date,
            unit_label: item.unit_label,
            guest_total: item.guest_total !== undefined && item.guest_total !== null ? Number(item.guest_total) : null,
            host_total: item.host_total !== undefined && item.host_total !== null ? Number(item.host_total) : null,
            notes: item.notes,
            accounts,
          });
        }
      }
    }

    // Attempt to enrich with transaction accounts if available
    const bookingIds = existingBookings.map((b) => b.id).filter(Boolean);
    if (bookingIds.length > 0) {
      try {
        const { data: txData } = await (admin as any)
          .from('transactions')
          .select('related_entity_id, account_label')
          .is('deleted_at', null)
          .in('related_entity_id', bookingIds);

        if (txData && Array.isArray(txData)) {
          for (const tx of txData) {
            if (tx.related_entity_id && tx.account_label) {
              const b = existingBookings.find((eb) => eb.id === tx.related_entity_id);
              if (b) {
                if (!b.accounts) b.accounts = new Set();
                b.accounts.add(tx.account_label.trim().toLowerCase());
              }
            }
          }
        }
      } catch {
        // Non-blocking in case transactions table is mocked or unpopulated
      }
    }
  }

  const seenInBatchKeys = new Set<string>();
  const analyzedRows: ImportRowAnalysis[] = [];
  let newCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const r of rows) {
    const propInfo = rowPropertyMap.get(r.rawLineIndex) || { id: defaultPropertyId, name: 'Default Property' };

    if (!r.isValid) {
      invalidCount++;
      analyzedRows.push({
        rawLineIndex: r.rawLineIndex,
        guestName: r.guestName || 'Unknown Guest',
        roomLabel: r.roomLabel || '—',
        checkInDate: r.checkInDate || '—',
        checkOutDate: r.checkOutDate || '—',
        propertyId: propInfo.id,
        propertyName: propInfo.name,
        status: 'invalid',
        reason: r.validationError || 'Invalid formatting or missing mandatory fields',
        guestTotal: r.guestTotal || 0,
        hostTotal: r.hostTotal || 0,
      });
      continue;
    }

    const candidate: IncomingBookingCandidate = {
      propertyId: propInfo.id,
      guestName: r.guestName,
      checkInDate: r.checkInDate,
      unitLabel: r.roomLabel,
      guestTotal: r.guestTotal,
      hostTotal: r.hostTotal,
      amountCreditedBank: r.amountCreditedBank,
    };

    const matchingDbBooking = existingBookings.find((eb) => isExactBookingDuplicate(candidate, eb));
    const batchKey = buildBatchDeduplicationKey(candidate);
    const isBatchDuplicate = seenInBatchKeys.has(batchKey);

    if (matchingDbBooking || isBatchDuplicate) {
      duplicateCount++;
      const priceStr = r.hostTotal > 0 ? `₹${r.hostTotal.toLocaleString('en-IN')}` : `₹${r.guestTotal.toLocaleString('en-IN')}`;
      const accountStr = r.amountCreditedBank ? ` to ${r.amountCreditedBank}` : '';
      analyzedRows.push({
        rawLineIndex: r.rawLineIndex,
        guestName: r.guestName,
        roomLabel: r.roomLabel,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
        propertyId: propInfo.id,
        propertyName: propInfo.name,
        status: 'duplicate',
        reason: matchingDbBooking
          ? `Exact matching booking exists in database for ${r.guestName} on ${r.checkInDate} (${priceStr}${accountStr})`
          : `Identical row duplicate within this import file (${priceStr}${accountStr})`,
        guestTotal: r.guestTotal,
        hostTotal: r.hostTotal,
      });
    } else {
      seenInBatchKeys.add(batchKey);
      newCount++;

      // Check if there is already an existing booking for this guest on this date with different amount or account
      const hasOtherForSameGuest = existingBookings.some((eb) =>
        eb.property_id === candidate.propertyId &&
        eb.check_in_date === candidate.checkInDate &&
        (eb.guest_name || '').trim().toLowerCase() === (candidate.guestName || '').trim().toLowerCase()
      );

      let reason = 'Ready to create new booking';
      if (hasOtherForSameGuest) {
        reason = `Additional transaction / different amount or account for ${r.guestName}`;
      }

      analyzedRows.push({
        rawLineIndex: r.rawLineIndex,
        guestName: r.guestName,
        roomLabel: r.roomLabel,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
        propertyId: propInfo.id,
        propertyName: propInfo.name,
        status: 'new',
        reason,
        guestTotal: r.guestTotal,
        hostTotal: r.hostTotal,
      });
    }
  }

  return {
    success: true,
    total: rows.length,
    newCount,
    duplicateCount,
    invalidCount,
    analyzedRows,
  };
}
