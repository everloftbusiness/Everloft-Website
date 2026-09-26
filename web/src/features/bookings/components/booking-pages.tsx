import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBooking, getBookingOptions, listBookings } from '../services/bookings.service';
import { BookingRegister } from './booking-register';
import { BookingForm } from './booking-form';
import { BookingPayments } from './booking-payments';
import type { RegisterFilters } from '../types/booking.types';
import { money } from '../utils/money';
import {
  Building2,
  Receipt,
  Banknote,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  FileSpreadsheet,
} from 'lucide-react';

export async function RegisterPage({ filters }: {
    filters: RegisterFilters;
}) {
    const [data, properties] = await Promise.all([listBookings(filters), getBookingOptions()]);
    return <BookingRegister {...data} filters={filters} properties={properties}/>;
}

export async function NewBookingPage({ propertyId }: {
    propertyId?: string;
}) {
    const properties = await getBookingOptions();
    return (
        <div className="space-y-6">
            <div>
                <Link href="/dashboard/bookings" className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mb-1">
                    ← Back to Bookings & Settlements
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Add New Booking</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Record a guest stay, property unit assignment, and itemized dual-ledger financials.</p>
            </div>
            <BookingForm properties={properties} propertyId={propertyId}/>
        </div>
    );
}

export async function BookingDetailPage({ id, edit }: {
    id: string;
    edit?: boolean;
}) {
    if (!/^[0-9a-f-]{36}$/i.test(id))
        notFound();
    const data = await getBooking(id);
    if (!data)
        notFound();
    const { booking: b, lines, payments } = data;

    if (edit && b.financial_status === 'draft')
        return (
          <div className="space-y-5">
            <Link className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline" href={`/dashboard/bookings/${id}`}>
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back to booking details
            </Link>
            <h1 className="text-2xl font-bold">Edit Booking {b.reservation_code}</h1>
            <BookingForm properties={await getBookingOptions()} booking={b} initialLines={lines}/>
          </div>
        );

    const isDirect = b.source.toLowerCase().includes('direct') || b.source.toLowerCase().includes('db') || b.collection_mode === 'direct';
    const isAirbnb = b.source.toLowerCase().includes('airbnb');
    const isBookingCom = b.source.toLowerCase().includes('booking');
    const isDraft = b.financial_status === 'draft';
    const totalBankCredited = (b.host_received || 0) + (b.guest_received || 0);

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back to Bookings & Settlements
          </Link>

          {/* Top Title Bar */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {b.reservation_code}
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                    isAirbnb
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                      : isDirect
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : isBookingCom
                      ? 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {b.source}
                </span>
                {b.unit_label && (
                  <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    Room {b.unit_label}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                    isDraft
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isDraft ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {b.financial_status}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {b.guest_name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {b.property_name} · {b.check_in_date} → {b.check_out_date} ({b.nights} days)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isDraft && (
                <Link
                  className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted shadow-2xs transition-colors"
                  href={`/dashboard/bookings/${id}?edit=1`}
                >
                  Edit Draft
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4-Step Money Reconciliation Ribbon */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1: 🟢 Guest Paid Total */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-emerald-600" /> 🟢 Guest Paid Total
            </span>
            <p className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-100">
              {money(b.guest_total, b.currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Accommodation base, taxes & fees
            </p>
          </div>

          {/* Step 2: 🟣 Host Payout Total */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.03] p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-purple-600" /> 🟣 Net Host Payout
            </span>
            <p className="text-2xl font-extrabold font-mono text-purple-900 dark:text-purple-100">
              {money(b.host_total, b.currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Expected remittance after OTA fees
            </p>
          </div>

          {/* Step 3: 🏦 Bank Credited */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-sky-500" /> Bank Credited
            </span>
            <p className="text-2xl font-extrabold font-mono text-foreground">
              {money(totalBankCredited, b.currency)}
            </p>
            <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold truncate">
              {b.amount_credited_bank ? `Credited: ${b.amount_credited_bank}` : 'Direct/Channel settled'}
            </p>
          </div>

          {/* Step 4: ⚖️ Reconciliation Status */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Difference / Balance
            </span>
            <p className={`text-2xl font-extrabold font-mono ${b.payout_balance !== 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {money(b.payout_balance || b.guest_balance || 0, b.currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {b.payout_balance === 0 ? 'Fully reconciled in bank' : 'Outstanding difference'}
            </p>
          </div>
        </div>

        {/* Stay Particulars & Operations Card */}
        <section className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-500" /> Reservation Particulars & Operations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div>
              <p className="text-muted-foreground">Property</p>
              <p className="mt-1 font-semibold text-foreground">{b.property_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Room / Unit</p>
              <p className="mt-1 font-semibold text-foreground">{b.unit_label ? `Room ${b.unit_label}` : 'Whole Villa'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stay Dates & Days</p>
              <p className="mt-1 font-semibold text-foreground">
                {b.check_in_date} → {b.check_out_date} ({b.nights} days)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Guests</p>
              <p className="mt-1 font-semibold text-foreground">{b.adults} adults · {b.children} children</p>
            </div>
            <div>
              <p className="text-muted-foreground">Site / Channel</p>
              <p className="mt-1 font-semibold text-foreground">{b.source}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Column 1 / Bank Ref</p>
              <p className="mt-1 font-mono font-semibold text-foreground">{b.column_1 || b.external_booking_ref || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact Phone / Email</p>
              <p className="mt-1 font-mono font-semibold text-foreground">{b.phone || b.email || 'Not recorded'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount Credited (Bank)</p>
              <p className="mt-1 font-semibold text-purple-700 dark:text-purple-300">
                {b.amount_credited_bank || '—'}
              </p>
            </div>
          </div>
        </section>

        {/* Itemized Dual-Ledger Grid (Matching the Google Sheet Inspector) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 🟢 Guest Paid Ledger Card */}
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.02] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-emerald-600" /> 🟢 Guest Paid Ledger
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">What the guest was charged on site</p>
              </div>
              <span className="text-lg font-mono font-extrabold text-emerald-900 dark:text-emerald-100">
                {money(b.guest_total, b.currency)}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {lines.filter((l) => l.side === 'guest').length === 0 ? (
                <div className="flex justify-between border-b border-emerald-500/10 py-2">
                  <span className="text-muted-foreground">Total Charge</span>
                  <span className="font-mono font-semibold text-foreground">{money(b.guest_total, b.currency)}</span>
                </div>
              ) : (
                lines
                  .filter((l) => l.side === 'guest')
                  .map((l, i) => (
                    <div className="flex justify-between border-b border-emerald-500/10 py-2" key={i}>
                      <div>
                        <p className="font-medium text-foreground">{l.label}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{l.category.replaceAll('_', ' ')}</p>
                      </div>
                      <span className="font-mono font-semibold text-foreground">{money(l.amount, b.currency)}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex justify-between text-xs font-bold">
              <span>Total Guest Charges ({b.currency})</span>
              <span className="font-mono text-emerald-800 dark:text-emerald-200">{money(b.guest_total, b.currency)}</span>
            </div>
            {b.guest_received > 0 && (
              <div className="flex justify-between text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <span>Direct Collections Received</span>
                <span className="font-mono">{money(b.guest_received, b.currency)}</span>
              </div>
            )}
          </section>

          {/* 🟣 Host Payout Ledger Card */}
          <section className="rounded-xl border border-purple-500/30 bg-purple-500/[0.02] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-purple-600" /> 🟣 Host Payout Ledger
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Expected net remittance after channel deductions</p>
              </div>
              <span className="text-lg font-mono font-extrabold text-purple-900 dark:text-purple-100">
                {money(b.host_total, b.currency)}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {lines.filter((l) => l.side === 'host').length === 0 ? (
                <div className="flex justify-between border-b border-purple-500/10 py-2">
                  <span className="text-muted-foreground">Net Payout Expected</span>
                  <span className="font-mono font-semibold text-foreground">{money(b.host_total, b.currency)}</span>
                </div>
              ) : (
                lines
                  .filter((l) => l.side === 'host')
                  .map((l, i) => {
                    const amt = Number(l.amount);
                    const isDeduction = amt < 0 || l.category === 'host_service_fee' || (l.category === 'tax' && amt < 0);
                    return (
                      <div className="flex justify-between border-b border-purple-500/10 py-2" key={i}>
                        <div>
                          <p className="font-medium text-foreground">{l.label}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{l.category.replaceAll('_', ' ')}</p>
                        </div>
                        <span className={`font-mono font-semibold ${isDeduction ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                          {isDeduction ? `-${money(Math.abs(amt), b.currency)}` : money(amt, b.currency)}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2 border-t border-purple-500/20 flex justify-between text-xs font-bold">
              <span>Expected Host Payout ({b.currency})</span>
              <span className="font-mono text-purple-800 dark:text-purple-200">{money(b.host_total, b.currency)}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-foreground">
              <span>Payout Received in Bank</span>
              <span className="font-mono font-semibold">{money(b.host_received, b.currency)}</span>
            </div>
            {b.payout_balance !== 0 && (
              <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>Payout Difference / Shortfall</span>
                <span className="font-mono">{money(b.payout_balance, b.currency)}</span>
              </div>
            )}
          </section>
        </div>

        {/* Operational Notes */}
        {b.notes && (
          <section className="rounded-xl border border-border/60 bg-card p-5 shadow-xs space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Operational Notes</h2>
            <p className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border font-mono">
              {b.notes}
            </p>
          </section>
        )}

        {/* Bank Payments & Transactions Manager */}
        <BookingPayments booking={b} payments={payments} />

        {/* Audit Footer */}
        <p className="text-xs text-muted-foreground">
          Created {b.created_at.slice(0, 10)}
          {b.finalized_at ? ` · Breakdown finalized ${b.finalized_at.slice(0, 10)}` : ''}.
          This register tracks hospitality booking settlements and dual-ledger accounting.
        </p>
      </div>
    );
}

