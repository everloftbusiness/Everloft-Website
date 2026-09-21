import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const mockGetDashboardSession = vi.fn();
vi.mock('@/lib/dashboard/session', () => ({
  getDashboardSession: () => mockGetDashboardSession(),
}));

const mockDeleteBooking = vi.fn().mockResolvedValue(undefined);
const mockDeleteAllBookings = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/bookings.service', () => ({
  deleteBooking: (id: string) => mockDeleteBooking(id),
  deleteAllBookings: () => mockDeleteAllBookings(),
}));

import { deleteBookingAction, deleteAllBookingsAction } from './booking.actions';

describe('Harden Booking Deletion Server Actions Policy & Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. rejects deleteBookingAction if user is not authenticated', async () => {
    mockGetDashboardSession.mockResolvedValue(null);

    await expect(deleteBookingAction('11111111-2222-4333-8444-555555555555')).rejects.toThrow(
      'Unauthorized: Authentication required.'
    );
  });

  it('2. rejects deleteBookingAction if user lacks manage_bookings permission', async () => {
    mockGetDashboardSession.mockResolvedValue({
      userId: 'user-1',
      role: 'guest',
      permissions: ['view_dashboard'],
    });

    await expect(deleteBookingAction('11111111-2222-4333-8444-555555555555')).rejects.toThrow(
      'Forbidden: Insufficient permissions (manage_bookings required).'
    );
  });

  it('3. allows deleteBookingAction for authorized super_admin', async () => {
    mockGetDashboardSession.mockResolvedValue({
      userId: 'admin-1',
      role: 'super_admin',
      permissions: ['manage_bookings'],
    });

    await deleteBookingAction('11111111-2222-4333-8444-555555555555');
    expect(mockDeleteBooking).toHaveBeenCalledWith('11111111-2222-4333-8444-555555555555');
  });

  it('4. rejects deleteAllBookingsAction without exact confirmation string "DELETE_ALL_BOOKINGS"', async () => {
    mockGetDashboardSession.mockResolvedValue({
      userId: 'admin-1',
      role: 'super_admin',
      permissions: ['manage_bookings'],
    });

    await expect(deleteAllBookingsAction('yes_delete')).rejects.toThrow(
      "Invalid confirmation: Explicit confirmation 'DELETE_ALL_BOOKINGS' is required."
    );
    expect(mockDeleteAllBookings).not.toHaveBeenCalled();
  });

  it('5. explicitly bars operations_manager from executing deleteAllBookingsAction even with correct confirmation', async () => {
    mockGetDashboardSession.mockResolvedValue({
      userId: 'ops-1',
      role: 'operations_manager',
      permissions: ['manage_bookings'],
    });

    await expect(deleteAllBookingsAction('DELETE_ALL_BOOKINGS')).rejects.toThrow(
      'Forbidden: Operations Manager is not permitted to delete all bookings.'
    );
    expect(mockDeleteAllBookings).not.toHaveBeenCalled();
  });

  it('6. permits deleteAllBookingsAction for finance_admin with valid confirmation', async () => {
    mockGetDashboardSession.mockResolvedValue({
      userId: 'fin-1',
      role: 'finance_admin',
      permissions: ['manage_bookings'],
    });

    await deleteAllBookingsAction('DELETE_ALL_BOOKINGS');
    expect(mockDeleteAllBookings).toHaveBeenCalled();
  });
});
