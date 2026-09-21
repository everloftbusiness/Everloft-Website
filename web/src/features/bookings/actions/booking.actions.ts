'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDashboardSession } from '@/lib/dashboard/session';
import { bookingSchema, paymentSchema } from '../schemas/booking.schema';
import {
  saveBooking,
  finalizeBooking,
  recordPayment,
  reversePayment,
  searchGuests,
  updateStayStatus,
  getBooking,
  deleteBooking,
  deleteAllBookings,
} from '../services/bookings.service';
import { STATUSES } from '../types/booking.types';

function refresh() {
  revalidatePath('/dashboard/bookings', 'layout');
}

async function requireBookingPermission(permission: 'manage_bookings' | 'view_dashboard' = 'manage_bookings') {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes(permission) && session.role !== 'super_admin' && session.role !== 'finance_admin' && session.role !== 'operations_manager') {
    throw new Error(`Forbidden: Insufficient permissions (${permission} required).`);
  }
  return session;
}

export async function saveBookingAction(input: unknown) {
  await requireBookingPermission('manage_bookings');
  const id = await saveBooking(bookingSchema.parse(input));
  refresh();
  return id;
}

export async function finalizeBookingAction(id: string) {
  await requireBookingPermission('manage_bookings');
  await finalizeBooking(z.string().uuid().parse(id));
  refresh();
}

export async function recordPaymentAction(input: unknown) {
  await requireBookingPermission('manage_bookings');
  await recordPayment(paymentSchema.parse(input));
  refresh();
}

export async function reversePaymentAction(id: string, reason: string) {
  await requireBookingPermission('manage_bookings');
  await reversePayment(z.string().uuid().parse(id), z.string().trim().min(5).max(1000).parse(reason));
  refresh();
}

export async function searchGuestsAction(search: string) {
  await requireBookingPermission('view_dashboard');
  return searchGuests(z.string().max(100).parse(search));
}

export async function updateStayStatusAction(id: string, status: string) {
  await requireBookingPermission('manage_bookings');
  await updateStayStatus(z.string().uuid().parse(id), z.enum(STATUSES).parse(status));
  refresh();
}

export async function getBookingDetailsAction(id: string) {
  await requireBookingPermission('view_dashboard');
  return getBooking(z.string().uuid().parse(id));
}

export async function deleteBookingAction(id: string) {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings')) {
    throw new Error('Forbidden: Insufficient permissions (manage_bookings required).');
  }
  if (!['super_admin', 'finance_admin', 'operations_manager'].includes(session.role)) {
    throw new Error('Forbidden: Role not authorized for booking deletion.');
  }
  await deleteBooking(z.string().uuid().parse(id));
  refresh();
}

export async function deleteAllBookingsAction(confirmation: string) {
  if (confirmation !== 'DELETE_ALL_BOOKINGS') {
    throw new Error("Invalid confirmation: Explicit confirmation 'DELETE_ALL_BOOKINGS' is required.");
  }
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings')) {
    throw new Error('Forbidden: Insufficient permissions (manage_bookings required).');
  }
  // Explicit RBAC Policy: operations_manager is barred from deleting all bookings
  if (!['super_admin', 'finance_admin'].includes(session.role)) {
    throw new Error('Forbidden: Operations Manager is not permitted to delete all bookings.');
  }
  await deleteAllBookings();
  refresh();
}
