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

const mockSaveBooking = vi.fn().mockResolvedValue('booking-new-id');
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
    { property_id: VALID_PROP_ID_1, guest_name: 'Existing Guest', check_in_date: '2026-10-01' },
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

import { importBookingsAction } from './import.actions';
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
});
