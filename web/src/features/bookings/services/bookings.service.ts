import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getDashboardSession } from '@/lib/dashboard/session';
import { SORT_FIELDS, type BookingRow, type FinancialLine, type GuestOption, type PropertyOption, type RegisterFilters, type PaymentRow } from '../types/booking.types';
import type { BookingInput } from '../schemas/booking.schema';
type Table<T> = {
    Row: T;
    Insert: Partial<T>;
    Update: Partial<T>;
    Relationships: [
    ];
};
type RegisterDatabase = {
    public: {
        Tables: {
            properties: Table<PropertyOption & {
                deleted_at: string | null;
            }>;
            guest_profiles: Table<GuestOption & {
                deleted_at: string | null;
            }>;
            bookings: Table<{
                id: string;
                deleted_at: string | null;
            }>;
            booking_financial_lines: Table<FinancialLine & {
                id: string;
                booking_id: string;
                created_at: string;
            }>;
            transactions: Table<Omit<PaymentRow, 'payment_type'> & {
                id: string;
                related_entity_id: string;
                related_entity_type?: string;
            }>;
            booking_payments: Table<{
                id: string;
                booking_id: string;
                transaction_id: string;
                payment_type: string;
            }>;
        };
        Views: {
            booking_register: {
                Row: BookingRow;
                Relationships: [
                ];
            };
        };
        Functions: {
            update_booking_stay_status: {
                Args: {
                    booking_id: string;
                    new_status: string;
                };
                Returns: undefined;
            };
            save_booking_record: {
                Args: {
                    payload: unknown;
                };
                Returns: string;
            };
            finalize_booking_record: {
                Args: {
                    booking_id: string;
                };
                Returns: undefined;
            };
            record_booking_payment: {
                Args: {
                    payload: unknown;
                };
                Returns: string;
            };
            reverse_booking_payment: {
                Args: {
                    transaction_id: string;
                    reason: string;
                };
                Returns: undefined;
            };
        };
    };
};
async function client() { return await createClient() as unknown as SupabaseClient<RegisterDatabase>; }
export async function requireRegisterAccess() {
    const session = await getDashboardSession();
    if (!session?.permissions.includes('manage_booking_register'))
        throw new Error('Booking register access is restricted to authorized finance staff.');
    return session;
}
function fail(error: {
    message: string;
    code?: string;
} | null) { if (error) {
    if (error.code === '23505')
        throw new Error('This reservation reference already exists for the property and channel.');
    throw new Error(error.message);
} }
export async function getBookingOptions() {
    await requireRegisterAccess();
    const db = await client();
    const { data, error } = await db.from('properties').select('id,name').is('deleted_at', null).order('name').limit(1000);
    fail(error);
    return data ?? [];
}
export async function searchGuests(search: string) {
    await requireRegisterAccess();
    const db = await client();
    const term = search.replace(/[%_,().]/g, ' ').trim().slice(0, 100);
    if (term.length < 2)
        return [];
    const { data, error } = await db.from('guest_profiles').select('id,full_name,email,phone').is('deleted_at', null).or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`).order('full_name').limit(20);
    fail(error);
    return data ?? [];
}
const DB_VIEW_COLUMNS: readonly string[] = [
    'check_in_date', 'check_out_date', 'booking_date', 'reservation_code',
    'guest_name', 'property_name', 'unit_label', 'source', 'external_booking_ref',
    'nights', 'adults', 'children', 'currency', 'status', 'financial_status',
    'guest_total', 'host_total', 'guest_received', 'host_received', 'deposit_held',
    'payout_balance', 'email', 'phone', 'country', 'created_at', 'collection_mode', 'guest_balance'
];

export async function listBookings(filters: RegisterFilters, exportRows = false) {
    await requireRegisterAccess();
    const db = await client();
    const page = Math.max(1, Math.min(100000, Number.parseInt(filters.page ?? '1') || 1));
    const size = exportRows ? 1000 : 25;
    let query = db.from('booking_register').select('*', { count: 'exact' });
    if (filters.property && /^[0-9a-f-]{36}$/i.test(filters.property))
        query = query.eq('property_id', filters.property);
    if (filters.status)
        query = query.eq('status', filters.status);
    if (filters.financial)
        query = query.eq('financial_status', filters.financial);
    if (filters.currency)
        query = query.eq('currency', filters.currency);
    if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from))
        query = query.gte('check_in_date', filters.from);
    if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to))
        query = query.lte('check_in_date', filters.to);
    if (filters.outstanding === 'yes')
        query = query.or('payout_balance.gt.0,guest_balance.gt.0').eq('financial_status', 'finalized');
    const term = (filters.q ?? '').replace(/[%_,().]/g, ' ').trim().slice(0, 100);
    if (term)
        query = query.or(`guest_name.ilike.%${term}%,reservation_code.ilike.%${term}%,phone.ilike.%${term}%,external_booking_ref.ilike.%${term}%,source.ilike.%${term}%`);
    
    const requestedSort = filters.sort;
    const canSortDb = requestedSort && DB_VIEW_COLUMNS.includes(requestedSort);
    const dbSort = canSortDb ? requestedSort : 'check_in_date';
    query = query.order(dbSort, { ascending: filters.direction === 'asc', nullsFirst: false }).order('id');
    
    const { data, error, count } = await query.range(exportRows ? 0 : (page - 1) * size, exportRows ? size - 1 : page * size - 1);
    fail(error);
    
    const rows = (data ?? []) as BookingRow[];
    const bookingIds = rows.map((r) => r.id).filter(Boolean);

    if (bookingIds.length > 0) {
        try {
            const [linesRes, txRes] = await Promise.all([
                db.from('booking_financial_lines').select('booking_id, side, category, label, amount').in('booking_id', bookingIds),
                db.from('transactions').select('related_entity_id, amount, account_label, status, direction').in('related_entity_id', bookingIds).eq('status', 'completed'),
            ]);

            const linesByBooking = new Map<string, Array<{ side: string; category: string; label: string; amount: number }>>();
            if (linesRes.data) {
                for (const l of linesRes.data) {
                    const list = linesByBooking.get(l.booking_id) || [];
                    list.push({ side: l.side, category: l.category, label: l.label, amount: Number(l.amount) || 0 });
                    linesByBooking.set(l.booking_id, list);
                }
            }

            const txByBooking = new Map<string, Array<{ amount: number; account_label: string }>>();
            if (txRes.data) {
                for (const t of txRes.data) {
                    const list = txByBooking.get(t.related_entity_id) || [];
                    list.push({ amount: Number(t.amount) || 0, account_label: t.account_label });
                    txByBooking.set(t.related_entity_id, list);
                }
            }

            for (const r of rows) {
                const lines = linesByBooking.get(r.id) || [];
                const txs = txByBooking.get(r.id) || [];

                // Guest lines extraction
                const guestBase = lines.filter((l) => l.side === 'guest' && l.category === 'accommodation').reduce((s, l) => s + l.amount, 0);
                const guestTax = lines.filter((l) => l.side === 'guest' && l.category === 'tax').reduce((s, l) => s + l.amount, 0);
                const guestFee = lines.filter((l) => l.side === 'guest' && l.category === 'guest_service_fee').reduce((s, l) => s + l.amount, 0);

                // Host lines extraction
                const hostBase = lines.filter((l) => l.side === 'host' && l.category === 'accommodation').reduce((s, l) => s + l.amount, 0);
                const hostRateAdj = lines.filter((l) => l.side === 'host' && l.category === 'rate_adjustment').reduce((s, l) => s + l.amount, 0);
                const hostFee = lines.filter((l) => l.side === 'host' && l.category === 'host_service_fee').reduce((s, l) => s + Math.abs(l.amount), 0);
                const hostTax = lines.filter((l) => l.side === 'host' && l.category === 'tax').reduce((s, l) => s + Math.abs(l.amount), 0);
                const hostAddl = lines.filter((l) => l.side === 'host' && l.category === 'additional_income').reduce((s, l) => s + l.amount, 0);

                r.guest_base_fare = guestBase > 0 ? guestBase : undefined;
                r.guest_taxes = guestTax > 0 ? guestTax : undefined;
                r.guest_service_charge = guestFee > 0 ? guestFee : undefined;

                r.host_base_fare = hostBase > 0 ? hostBase : undefined;
                r.host_rate_adjustment = hostRateAdj !== 0 ? hostRateAdj : undefined;
                r.host_service_fee = hostFee > 0 ? hostFee : undefined;
                r.host_taxes = hostTax > 0 ? hostTax : undefined;
                r.host_additional_income = hostAddl > 0 ? hostAddl : undefined;

                // Bank account extraction
                if (txs.length > 0 && txs[0].account_label) {
                    r.amount_credited_bank = txs[0].account_label;
                } else if (r.notes) {
                    const match = r.notes.match(/(everloft\s*-\s*kgb|kgb|hdfc|sbi|icici|axis|bank|cash|paytm)/i);
                    if (match) {
                        r.amount_credited_bank = match[0].toUpperCase();
                    }
                }

                // Column 1 extraction
                if (r.external_booking_ref && !r.external_booking_ref.startsWith('IMP-')) {
                    r.column_1 = r.external_booking_ref;
                }
            }

            // In-memory sort if requested column is an enriched column
            if (requestedSort && !canSortDb) {
                const sortKey = requestedSort as keyof BookingRow;
                const isAsc = filters.direction === 'asc';
                rows.sort((a, b) => {
                    const valA = a[sortKey] ?? 0;
                    const valB = b[sortKey] ?? 0;
                    if (valA < valB) return isAsc ? -1 : 1;
                    if (valA > valB) return isAsc ? 1 : -1;
                    return 0;
                });
            }
        } catch (enrichErr) {
            console.error('Non-blocking booking row enrichment error:', enrichErr);
        }
    }

    return { rows, total: count ?? 0, page };
}
export async function getBooking(id: string) {
    await requireRegisterAccess();
    const db = await client();
    const { data: booking, error } = await db.from('booking_register').select('*').eq('id', id).maybeSingle();
    fail(error);
    if (!booking)
        return null;
    const [lines, payments, links] = await Promise.all([
        db.from('booking_financial_lines').select('*').eq('booking_id', id).order('created_at'),
        db.from('transactions').select('*').eq('related_entity_id', id).order('created_at', { ascending: false }),
        db.from('booking_payments').select('*').eq('booking_id', id),
    ]);
    fail(lines.error);
    fail(payments.error);
    fail(links.error);

    const parsedLines = (lines.data ?? []).map(l => ({ ...l, amount: String(l.amount) }));
    const parsedPayments = (payments.data ?? []).map(p => ({ ...p, payment_type: links.data?.find(l => l.transaction_id === p.id)?.payment_type ?? '' }));

    // Enrich booking row with granular fields
    const b = booking as BookingRow;
    const numLines = parsedLines.map(l => ({ ...l, amountNum: Number(l.amount) || 0 }));
    b.guest_base_fare = numLines.filter(l => l.side === 'guest' && l.category === 'accommodation').reduce((s, l) => s + l.amountNum, 0) || undefined;
    b.guest_taxes = numLines.filter(l => l.side === 'guest' && l.category === 'tax').reduce((s, l) => s + l.amountNum, 0) || undefined;
    b.guest_service_charge = numLines.filter(l => l.side === 'guest' && l.category === 'guest_service_fee').reduce((s, l) => s + l.amountNum, 0) || undefined;

    b.host_base_fare = numLines.filter(l => l.side === 'host' && l.category === 'accommodation').reduce((s, l) => s + l.amountNum, 0) || undefined;
    b.host_rate_adjustment = numLines.filter(l => l.side === 'host' && l.category === 'rate_adjustment').reduce((s, l) => s + l.amountNum, 0) || undefined;
    b.host_service_fee = numLines.filter(l => l.side === 'host' && l.category === 'host_service_fee').reduce((s, l) => s + Math.abs(l.amountNum), 0) || undefined;
    b.host_taxes = numLines.filter(l => l.side === 'host' && l.category === 'tax').reduce((s, l) => s + Math.abs(l.amountNum), 0) || undefined;
    b.host_additional_income = numLines.filter(l => l.side === 'host' && l.category === 'additional_income').reduce((s, l) => s + l.amountNum, 0) || undefined;

    if (parsedPayments.length > 0 && parsedPayments[0].account_label) {
        b.amount_credited_bank = parsedPayments[0].account_label;
    } else if (b.notes) {
        const match = b.notes.match(/(everloft\s*-\s*kgb|kgb|hdfc|sbi|icici|axis|bank|cash|paytm)/i);
        if (match) b.amount_credited_bank = match[0].toUpperCase();
    }
    if (b.external_booking_ref && !b.external_booking_ref.startsWith('IMP-')) {
        b.column_1 = b.external_booking_ref;
    }

    return { booking: b, lines: parsedLines, payments: parsedPayments };
}

export async function saveBooking(input: BookingInput) { await requireRegisterAccess(); const db = await client(); const { data, error } = await db.rpc('save_booking_record', { payload: input }); fail(error); return data!; }
export async function finalizeBooking(id: string) { await requireRegisterAccess(); const db = await client(); const { error } = await db.rpc('finalize_booking_record', { booking_id: id }); fail(error); }
export async function recordPayment(payload: unknown) { await requireRegisterAccess(); const db = await client(); const { error } = await db.rpc('record_booking_payment', { payload }); fail(error); }
export async function reversePayment(id: string, reason: string) { await requireRegisterAccess(); const db = await client(); const { error } = await db.rpc('reverse_booking_payment', { transaction_id: id, reason }); fail(error); }
export async function updateStayStatus(id: string, status: string) { await requireRegisterAccess(); const db = await client(); const { error } = await db.rpc('update_booking_stay_status', { booking_id: id, new_status: status }); fail(error); }
import { createAdminClient } from '@/lib/supabase/admin';

export async function deleteBooking(id: string) {
    await requireRegisterAccess();
    const admin = createAdminClient() as unknown as SupabaseClient<RegisterDatabase>;
    const nowIso = new Date().toISOString();

    const { data: payments, error: fetchPayErr } = await admin.from('booking_payments').select('transaction_id').eq('booking_id', id);
    fail(fetchPayErr);

    if (payments && payments.length > 0) {
        const txIds = (payments as { transaction_id: string }[]).map((p) => p.transaction_id);
        const { error: delPayErr } = await admin.from('booking_payments').delete().eq('booking_id', id);
        fail(delPayErr);

        // Soft delete associated transactions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: txSoftErr } = await (admin.from('transactions') as any).update({ deleted_at: nowIso }).in('id', txIds);
        fail(txSoftErr);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: txRelErr } = await (admin.from('transactions') as any).update({ deleted_at: nowIso }).eq('related_entity_id', id);
    fail(txRelErr);

    const { error: lineErr } = await admin.from('booking_financial_lines').delete().eq('booking_id', id);
    fail(lineErr);

    // Soft delete main booking record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: bookErr } = await (admin.from('bookings') as any).update({ deleted_at: nowIso }).eq('id', id);
    fail(bookErr);
}

export async function deleteAllBookings() {
    await requireRegisterAccess();
    const admin = createAdminClient() as unknown as SupabaseClient<RegisterDatabase>;
    const nowIso = new Date().toISOString();

    const { error: payErr } = await admin.from('booking_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    fail(payErr);

    // Soft delete all transactions related to bookings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: txErr } = await (admin.from('transactions') as any).update({ deleted_at: nowIso }).eq('related_entity_type', 'booking');
    fail(txErr);

    const { error: lineErr } = await admin.from('booking_financial_lines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    fail(lineErr);

    // Soft delete all booking records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: bookErr } = await (admin.from('bookings') as any).update({ deleted_at: nowIso }).neq('id', '00000000-0000-0000-0000-000000000000');
    fail(bookErr);
}
