import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isPublicBookingEnabled } from '@/app/api/bookings/route';
import { deleteBookingAction, saveBookingAction } from './booking.actions';

vi.mock('@/lib/dashboard/session', () => ({
  getDashboardSession: vi.fn().mockResolvedValue(null),
}));

describe('Booking API Hardening & Production Safety Controls', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('disables public booking by default in Production environment', () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    delete process.env.ENABLE_PUBLIC_BOOKING;

    expect(isPublicBookingEnabled()).toBe(false);
  });

  it('allows public booking in Production ONLY when ENABLE_PUBLIC_BOOKING=true', () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.ENABLE_PUBLIC_BOOKING = 'true';

    expect(isPublicBookingEnabled()).toBe(true);
  });

  it('allows public booking by default in development/test environment', () => {
    (process.env as Record<string, string>).NODE_ENV = 'test';
    delete process.env.ENABLE_PUBLIC_BOOKING;

    expect(isPublicBookingEnabled()).toBe(true);
  });

  it('rejects unauthorized calls to protected booking deletion server actions', async () => {
    await expect(deleteBookingAction('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
      'Unauthorized: Authentication required.'
    );
  });

  it('rejects unauthorized calls to save booking server action', async () => {
    await expect(saveBookingAction({})).rejects.toThrow('Unauthorized: Authentication required.');
  });
});
