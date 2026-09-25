import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const mockGetDashboardSession = vi.fn().mockResolvedValue({
  userId: 'user-1',
  role: 'super_admin',
  permissions: ['manage_bookings'],
});

vi.mock('@/lib/dashboard/session', () => ({
  getDashboardSession: () => mockGetDashboardSession(),
}));

const VALID_PROP_ID_1 = '00000000-0000-4000-8000-000000000001';
const VALID_PROP_ID_2 = '00000000-0000-4000-8000-000000000002';

const mockGetBookingOptions = vi.fn().mockResolvedValue([
  { id: VALID_PROP_ID_1, name: 'Villa Zephyr' },
  { id: VALID_PROP_ID_2, name: 'Loft Oasis' },
]);

const mockSaveBooking = vi.fn().mockResolvedValue('00000000-0000-4000-8000-000000000099');
const mockFinalizeBooking = vi.fn().mockResolvedValue(undefined);
const mockRecordPayment = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/bookings.service', () => ({
  getBookingOptions: () => mockGetBookingOptions(),
  saveBooking: (payload: unknown) => mockSaveBooking(payload),
  finalizeBooking: (id: string) => mockFinalizeBooking(id),
  recordPayment: (payload: unknown) => mockRecordPayment(payload),
}));

const mockDataResult = {
  data: [
    {
      id: 'existing-b1',
      property_id: VALID_PROP_ID_1,
      guest_name: 'Existing Guest',
      check_in_date: '2026-10-01',
      check_out_date: '2026-10-03',
      unit_label: 'Villa Zephyr',
      guest_total: 1180,
      host_total: 1000,
      notes: 'everloft - kgb',
    },
  ],
  error: null,
};

const mockInQuery = vi.fn().mockReturnValue({
  gte: () => ({
    lte: async () => mockDataResult,
  }),
});

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        is: () => ({
          in: (col: string, val: string[]) => mockInQuery(col, val),
        }),
      }),
    }),
  }),
}));

import { importBookingsAction, analyzeImportRowsAction } from './import.actions';
import type { ParsedImportRow } from '../utils/csv-parser';

describe('Scoped Import Bookings Action & Race Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleRow: ParsedImportRow = {
    isValid: true,
    rawLineIndex: 2,
    roomLabel: 'Villa Zephyr',
    guestName: 'New Guest',
    contactPhone: '+919876543210',
    checkInDate: '2026-10-10',
    checkOutDate: '2026-10-12',
    nights: 2,
    currency: 'INR',
    source: 'Direct',
    guestBase: 1000,
    guestTaxes: 180,
    guestServiceCharge: 0,
    guestTotal: 1180,
    hostBase: 1000,
    hostRateAdjustment: 0,
    hostServiceFee: 0,
    hostTaxes: 0,
    hostAdditionalIncome: 0,
    hostTotal: 1000,
    amountCreditedBank: '',
    creditedDate: '',
    note: '',
  };

  it('1. skips duplicate rows matching existing bookings returned by scoped DB query', async () => {
    const duplicateRow: ParsedImportRow = {
      ...sampleRow,
      guestName: 'Existing Guest',
      checkInDate: '2026-10-01',
    };

    const res = await importBookingsAction([duplicateRow, sampleRow], VALID_PROP_ID_1);

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(mockSaveBooking).toHaveBeenCalledTimes(1);
  });

  it('2. restricts duplicate lookup query by both date window and batch property IDs', async () => {
    await importBookingsAction([sampleRow], VALID_PROP_ID_1);

    expect(mockInQuery).toHaveBeenCalledWith('property_id', [VALID_PROP_ID_1]);
  });

  it('3. does NOT skip rows for the same guest on the same day when AMOUNT is different (additional transaction)', async () => {
    const additionalAmountRow: ParsedImportRow = {
      ...sampleRow,
      guestName: 'Existing Guest',
      checkInDate: '2026-10-01',
      guestTotal: 500, // Different amount than existing 1180
      hostTotal: 450, // Different amount than existing 1000
      guestBase: 400,
      guestTaxes: 100,
      hostBase: 450,
    };

    const res = await importBookingsAction([additionalAmountRow], VALID_PROP_ID_1);

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(mockSaveBooking).toHaveBeenCalledTimes(1);
  });

  it('4. does NOT skip rows for the same guest on the same day when ACCOUNT is different', async () => {
    const differentAccountRow: ParsedImportRow = {
      ...sampleRow,
      guestName: 'Existing Guest',
      checkInDate: '2026-10-01',
      amountCreditedBank: 'HDFC BANK', // Different bank account than existing 'everloft - kgb'
    };

    const res = await importBookingsAction([differentAccountRow], VALID_PROP_ID_1);

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(mockSaveBooking).toHaveBeenCalledTimes(1);
  });

  it('5. analyzeImportRowsAction flags different amount as new with "Additional transaction" reason', async () => {
    const additionalRow: ParsedImportRow = {
      ...sampleRow,
      rawLineIndex: 5,
      guestName: 'Existing Guest',
      checkInDate: '2026-10-01',
      guestTotal: 750,
      hostTotal: 650,
    };

    const analysis = await analyzeImportRowsAction([additionalRow], VALID_PROP_ID_1);

    expect(analysis.newCount).toBe(1);
    expect(analysis.duplicateCount).toBe(0);
    expect(analysis.analyzedRows[0].status).toBe('new');
    expect(analysis.analyzedRows[0].reason).toContain('Additional transaction');
  });
});
