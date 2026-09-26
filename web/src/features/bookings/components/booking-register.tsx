'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  Plus,
  Eye,
  X,
  ChevronRight,
  Sparkles,
  Building2,
  TrendingUp,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  ArrowUpDown,
  Filter,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CURRENCIES,
  STATUSES,
  SORT_FIELDS,
  type BookingRow,
  type PropertyOption,
  type RegisterFilters,
  type FinancialLine,
  type PaymentRow
} from '../types/booking.types';
import { money } from '../utils/money';
import { getBookingDetailsAction, deleteBookingAction, deleteAllBookingsAction } from '../actions/booking.actions';
import { CsvImportModal } from './csv-import-modal';
import { GoogleSheetSyncModal } from './google-sheet-sync-modal';
import { FormattedDateTime } from '@/components/ui/formatted-date-time';

type GroupType = 'stay' | 'guest' | 'host' | 'settlement';

const columns: {
  key: typeof SORT_FIELDS[number] | 'notes';
  label: string;
  financial?: boolean;
  group: GroupType;
}[] = [
  // 1. Reservation Details (Stay Particulars)
  { key: 'reservation_code', label: 'Booking', group: 'stay' },
  { key: 'check_in_date', label: 'Date', group: 'stay' },
  { key: 'guest_name', label: 'Guest Name', group: 'stay' },
  { key: 'unit_label', label: 'Room / Unit', group: 'stay' },
  { key: 'source', label: 'Site', group: 'stay' },
  { key: 'property_name', label: 'Property', group: 'stay' },
  { key: 'check_out_date', label: 'Check-out', group: 'stay' },
  { key: 'status', label: 'Stay status', group: 'stay' },
  { key: 'financial_status', label: 'Breakdown', group: 'stay' },

  // 2. 🟢 Guest Paid Ledger
  { key: 'guest_base_fare', label: 'Base Fair', financial: true, group: 'guest' },
  { key: 'nights', label: 'Days', group: 'guest' },
  { key: 'guest_taxes', label: 'Taxes / %', financial: true, group: 'guest' },
  { key: 'guest_service_charge', label: 'Services Chg', financial: true, group: 'guest' },
  { key: 'guest_total', label: 'Total Amount', financial: true, group: 'guest' },
  { key: 'guest_received', label: 'Direct Collections', financial: true, group: 'guest' },
  { key: 'guest_balance', label: 'Remaining Balance', financial: true, group: 'guest' },

  // 3. 🟣 Host Payout Ledger
  { key: 'host_base_fare', label: 'Base Fair 2', financial: true, group: 'host' },
  { key: 'host_rate_adjustment', label: 'Rate Adj.', financial: true, group: 'host' },
  { key: 'host_service_fee', label: 'Service Fee', financial: true, group: 'host' },
  { key: 'host_taxes', label: 'Tax / TDS', financial: true, group: 'host' },
  { key: 'host_additional_income', label: "Add'l Income", financial: true, group: 'host' },
  { key: 'host_total', label: 'Total Payout', financial: true, group: 'host' },
  { key: 'host_received', label: 'Payout Received', financial: true, group: 'host' },
  { key: 'payout_balance', label: 'Payout Difference', financial: true, group: 'host' },
  { key: 'collection_mode', label: 'Collection Mode', group: 'host' },
  { key: 'deposit_held', label: 'Deposit Held', financial: true, group: 'host' },

  // 4. Settlement & Operations
  { key: 'phone', label: 'Contact', group: 'settlement' },
  { key: 'amount_credited_bank', label: 'Amount Credited', group: 'settlement' },
  { key: 'column_1', label: 'Column 1', group: 'settlement' },
  { key: 'notes' as any, label: 'Note', group: 'settlement' },
  { key: 'external_booking_ref', label: 'Platform Ref', group: 'settlement' },
  { key: 'email', label: 'Email', group: 'settlement' },
  { key: 'country', label: 'Country', group: 'settlement' },
  { key: 'currency', label: 'Currency', group: 'stay' },
  { key: 'adults', label: 'Adults', group: 'stay' },
  { key: 'children', label: 'Children', group: 'stay' },
  { key: 'booking_date', label: 'Booking date', group: 'stay' },
  { key: 'created_at', label: 'Created', group: 'settlement' },
];

export const SHEET_LEDGER_COLUMNS = [
  'reservation_code',
  'check_in_date',
  'guest_name',
  'source',
  'guest_base_fare',
  'nights',
  'guest_taxes',
  'guest_service_charge',
  'guest_total',
  'host_base_fare',
  'host_rate_adjustment',
  'host_service_fee',
  'host_taxes',
  'host_additional_income',
  'host_total',
  'phone',
  'amount_credited_bank',
  'column_1',
  'notes',
];

export const COMPACT_PMS_COLUMNS = [
  'reservation_code',
  'guest_name',
  'unit_label',
  'check_in_date',
  'check_out_date',
  'source',
  'financial_status',
  'guest_total',
  'host_total',
  'host_received',
  'payout_balance',
];

const defaults = SHEET_LEDGER_COLUMNS;


export function BookingRegister({
  rows,
  total,
  page,
  filters,
  properties,
}: {
  rows: BookingRow[];
  total: number;
  page: number;
  filters: RegisterFilters;
  properties: PropertyOption[];
}) {
  const router = useRouter();
  const [visible, setVisible] = useState<string[]>(defaults);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Quick Row Preview Drawer State
  const [drawerRow, setDrawerRow] = useState<BookingRow | null>(null);
  const [drawerDetails, setDrawerDetails] = useState<{
    lines: FinancialLine[];
    payments: PaymentRow[];
  } | null>(null);
  const [isPendingDrawer, startTransitionDrawer] = useTransition();

  // Delete Booking Modal State
  const [bookingToDelete, setBookingToDelete] = useState<BookingRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Delete All Bookings State
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [isDeletingAll, startDeleteAllTransition] = useTransition();

  function openDrawer(row: BookingRow) {
    setDrawerRow(row);
    setDrawerDetails(null);
    startTransitionDrawer(async () => {
      try {
        const details = await getBookingDetailsAction(row.id);
        if (details) {
          setDrawerDetails({
            lines: details.lines.map((l) => ({ ...l, amount: String(l.amount) })),
            payments: details.payments,
          });
        }
      } catch (err) {
        console.error('Failed to fetch drawer booking details:', err);
      }
    });
  }

  function handleDeleteBooking() {
    if (!bookingToDelete) return;
    startDeleteTransition(async () => {
      try {
        await deleteBookingAction(bookingToDelete.id);
        toast.success(`Booking ${bookingToDelete.reservation_code} permanently deleted`);
        setBookingToDelete(null);
        if (drawerRow?.id === bookingToDelete.id) {
          setDrawerRow(null);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete booking');
      }
    });
  }

  function handleDeleteAllBookings() {
    startDeleteAllTransition(async () => {
      try {
        await deleteAllBookingsAction('DELETE_ALL_BOOKINGS');
        toast.success('All bookings permanently deleted');
        setConfirmDeleteAllOpen(false);
        setDrawerRow(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete all bookings');
      }
    });
  }

  function url(patch: Record<string, string>) {
    const params = new URLSearchParams();
    Object.entries({ ...filters, ...patch }).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/dashboard/bookings?${params}`;
  }

  function filter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(
      url({
        ...(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>),
        page: '1',
      })
    );
  }

  const control =
    'h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus:ring-1 focus:ring-ring';

  const shown = columns.filter((c) => visible.includes(c.key));

  // Compute Group Spans for Dual-Tier Header
  const stayCols = shown.filter((c) => c.group === 'stay');
  const guestCols = shown.filter((c) => c.group === 'guest');
  const hostCols = shown.filter((c) => c.group === 'host');
  const settlementCols = shown.filter((c) => c.group === 'settlement');

  // Compute Aggregate Totals for Summary Metrics
  const activeCurrency = filters.currency || rows[0]?.currency || 'INR';
  const totalGuestCharges = rows.reduce((sum, r) => sum + (r.guest_total || 0), 0);
  const totalExpectedHost = rows.reduce((sum, r) => sum + (r.host_total || 0), 0);
  const totalCreditedBank = rows.reduce(
    (sum, r) => sum + (r.host_received || 0) + (r.guest_received || 0),
    0
  );
  const totalOutstanding = rows.reduce(
    (sum, r) => sum + (r.payout_balance || 0) + (r.guest_balance || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Finance & OTA Ledger
            </span>
            <span className="text-xs text-muted-foreground">• Dual-Ledger Hospitality Accounting</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bookings & Settlements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} booking{total === 1 ? '' : 's'} registered · Tracks guest tax/charges, expected payouts, and bank credits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GoogleSheetSyncModal properties={properties} />
          <CsvImportModal properties={properties} />
          <a
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/10 shadow-2xs"
            href={url({}).replace('/dashboard/bookings?', '/dashboard/bookings/export?')}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Export Excel (.xlsx)
          </a>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 font-semibold text-xs shadow-2xs"
            onClick={() => setConfirmDeleteAllOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Delete All
          </Button>
          <Button asChild variant="blue-accent" size="sm" className="shadow-xs">
            <Link href={`/dashboard/bookings/new${filters.property ? `?property=${filters.property}` : ''}`}>
              <Plus className="mr-1 h-4 w-4" /> Add booking
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Top Financial KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-blue-500/5 p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Guest Charges</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {money(totalGuestCharges, activeCurrency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Recorded guest charge total</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-purple-500/5 p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Expected Host Payout</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {money(totalExpectedHost, activeCurrency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Net OTA / platform payout</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/5 p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Bank Receipts Credited</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {money(totalCreditedBank, activeCurrency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Total settled in bank accounts</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {money(totalOutstanding, activeCurrency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pending payout & guest balance</p>
        </div>
      </div>

      {/* 3. Preset Filter Chips & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={!filters.financial && !filters.outstanding && !filters.q ? 'blue-accent' : 'outline'}
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => router.push('/dashboard/bookings')}
          >
            All Bookings
          </Button>
          <Button
            variant={filters.financial === 'draft' ? 'blue-accent' : 'outline'}
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => router.push(url({ financial: 'draft', outstanding: '', page: '1' }))}
          >
            <Clock className="mr-1 h-3 w-3" /> Drafts to Review
          </Button>
          <Button
            variant={filters.outstanding === 'yes' ? 'blue-accent' : 'outline'}
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => router.push(url({ financial: 'finalized', outstanding: 'yes', page: '1' }))}
          >
            <ShieldCheck className="mr-1 h-3 w-3" /> Outstanding Balances
          </Button>
          <Button
            variant={filters.q === 'DB' ? 'blue-accent' : 'outline'}
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => router.push(url({ q: 'DB', page: '1' }))}
          >
            Direct (DB)
          </Button>
          <Button
            variant={filters.q === 'Airbnb' ? 'blue-accent' : 'outline'}
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => router.push(url({ q: 'Airbnb', page: '1' }))}
          >
            Airbnb
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          >
            <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            {filterPanelOpen ? 'Hide Filters' : 'Filter & Search'}
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="h-8 rounded-lg text-xs"
            onClick={() => setColumnsOpen(!columnsOpen)}
          >
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5 text-muted-foreground" /> Columns
          </Button>
        </div>
      </div>

      {/* 4. Expandable Filter Form */}
      {filterPanelOpen && (
        <form
          onSubmit={filter}
          className="grid gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
          key={JSON.stringify(filters)}
        >
          <label className="grid gap-1 text-xs font-medium">
            Search
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Guest, phone, code or channel"
                className="pl-8 text-xs"
              />
            </div>
          </label>

          <label className="grid gap-1 text-xs font-medium">
            Property
            <select className={control} name="property" defaultValue={filters.property ?? ''}>
              <option value="">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-medium">
            Stay status
            <select className={control} name="status" defaultValue={filters.status ?? ''}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-medium">
            Financial breakdown
            <select className={control} name="financial" defaultValue={filters.financial ?? ''}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
            </select>
          </label>

          <label className="grid gap-1 text-xs font-medium">
            Check-in from
            <Input type="date" name="from" defaultValue={filters.from} className="text-xs" />
          </label>

          <label className="grid gap-1 text-xs font-medium">
            Check-in through
            <Input type="date" name="to" defaultValue={filters.to} className="text-xs" />
          </label>

          <label className="grid gap-1 text-xs font-medium">
            Currency
            <select className={control} name="currency" defaultValue={filters.currency ?? ''}>
              <option value="">All currencies</option>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <Button type="submit" variant="blue-accent" size="sm" className="w-full text-xs">
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => router.push('/dashboard/bookings')}
            >
              Reset
            </Button>
          </div>
        </form>
      )}

      {/* 5. Column Visibility Panel with Smart Presets */}
      {columnsOpen && (
        <fieldset className="rounded-xl border border-border/60 bg-card p-4 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-foreground">
              Visible Columns & Ledger Views
            </legend>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Presets:</span>
              <button
                type="button"
                onClick={() => setVisible(SHEET_LEDGER_COLUMNS)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                  visible.length === SHEET_LEDGER_COLUMNS.length && SHEET_LEDGER_COLUMNS.every((k) => visible.includes(k))
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300 shadow-2xs'
                    : 'bg-muted/50 border-border hover:bg-muted text-foreground'
                }`}
              >
                📋 Google Sheet Ledger (18 Cols)
              </button>
              <button
                type="button"
                onClick={() => setVisible(COMPACT_PMS_COLUMNS)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                  visible.length === COMPACT_PMS_COLUMNS.length && COMPACT_PMS_COLUMNS.every((k) => visible.includes(k))
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'bg-muted/50 border-border hover:bg-muted text-foreground'
                }`}
              >
                ⚡ Standard PMS View
              </button>
              <button
                type="button"
                onClick={() => setVisible(columns.map((c) => c.key))}
                className="px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors"
              >
                🔍 Select All
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Reservation Details</p>
              <div className="space-y-1.5">
                {columns
                  .filter((c) => c.group === 'stay')
                  .map((c) => (
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer" key={c.key}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={visible.includes(c.key)}
                        onChange={(e) =>
                          setVisible((v) => (e.target.checked ? [...v, c.key] : v.filter((k) => k !== c.key)))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                🟢 Guest Paid Ledger
              </p>
              <div className="space-y-1.5">
                {columns
                  .filter((c) => c.group === 'guest')
                  .map((c) => (
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer" key={c.key}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        checked={visible.includes(c.key)}
                        onChange={(e) =>
                          setVisible((v) => (e.target.checked ? [...v, c.key] : v.filter((k) => k !== c.key)))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                🟣 Host Payout Ledger
              </p>
              <div className="space-y-1.5">
                {columns
                  .filter((c) => c.group === 'host')
                  .map((c) => (
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer" key={c.key}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={visible.includes(c.key)}
                        onChange={(e) =>
                          setVisible((v) => (e.target.checked ? [...v, c.key] : v.filter((k) => k !== c.key)))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
                Settlement & Operations
              </p>
              <div className="space-y-1.5">
                {columns
                  .filter((c) => c.group === 'settlement')
                  .map((c) => (
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer" key={c.key}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        checked={visible.includes(c.key)}
                        onChange={(e) =>
                          setVisible((v) => (e.target.checked ? [...v, c.key] : v.filter((k) => k !== c.key)))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </fieldset>
      )}

      {/* 6. Dual-Tier Grouped Table View */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-xs">
        <table className="w-full whitespace-nowrap text-left text-xs border-collapse">
          {/* Top Tier Section Header Row */}
          <thead className="sticky top-0 z-20 border-b bg-muted/95 backdrop-blur-xs text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <tr className="border-b divide-x divide-border/60">
              {stayCols.length > 0 && (
                <th
                  colSpan={stayCols.length}
                  className="px-3 py-2 text-center bg-muted/90 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-500" /> Reservation Details
                  </div>
                </th>
              )}
              {guestCols.length > 0 && (
                <th
                  colSpan={guestCols.length}
                  className="px-3 py-2 text-center bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-[11px] font-extrabold tracking-wide uppercase border-x border-emerald-500/30"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> 🟢 Guest Paid
                  </div>
                </th>
              )}
              {hostCols.length > 0 && (
                <th
                  colSpan={hostCols.length}
                  className="px-3 py-2 text-center bg-purple-500/15 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold tracking-wide uppercase border-x border-purple-500/30"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> 🟣 Host Payout
                  </div>
                </th>
              )}
              {settlementCols.length > 0 && (
                <th
                  colSpan={settlementCols.length}
                  className="px-3 py-2 text-center bg-muted/90 text-[10px] font-bold tracking-wider text-muted-foreground uppercase border-x"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-sky-500" /> Settlement & Notes
                  </div>
                </th>
              )}
            </tr>

            {/* Individual Sub-Column Headers */}
            <tr className="border-t bg-muted/40 text-foreground font-medium divide-x divide-border/40">
              {shown.map((c) => {
                const isStickyCode = c.key === 'reservation_code';
                const isStickyGuest = c.key === 'guest_name';
                const isGuestCol = c.group === 'guest';
                const isHostCol = c.group === 'host';

                const thBg = isStickyCode
                  ? 'sticky left-0 z-30 bg-muted/95 backdrop-blur-xs'
                  : isStickyGuest
                  ? 'sticky left-24 z-30 bg-muted/95 backdrop-blur-xs shadow-xs'
                  : isGuestCol
                  ? 'bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                  : isHostCol
                  ? 'bg-purple-500/5 text-purple-800 dark:text-purple-200'
                  : '';

                return (
                  <th
                    key={c.key}
                    className={`px-3 py-2.5 ${thBg} ${c.financial ? 'text-right font-semibold' : c.key === 'nights' ? 'text-center font-semibold' : 'text-left'}`}
                    aria-sort={
                      filters.sort === c.key
                        ? filters.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <Link
                      className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                      href={url({
                        sort: c.key,
                        direction: filters.sort === c.key && filters.direction === 'asc' ? 'desc' : 'asc',
                        page: '1',
                      })}
                    >
                      {c.label}
                      {filters.sort === c.key ? (
                        filters.direction === 'asc' ? (
                          ' ↑'
                        ) : (
                          ' ↓'
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {rows.map((r) => (
              <tr key={r.id} className="group hover:bg-muted/40 transition-colors divide-x divide-border/30">
                {shown.map((c) => {
                  // 1. Reservation Code (Sticky Left 0)
                  if (c.key === 'reservation_code') {
                    return (
                      <td className="px-3 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400 sticky left-0 z-10 bg-card group-hover:bg-muted/50 transition-colors" key={c.key}>
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Quick preview drawer"
                            onClick={() => openDrawer(r)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Delete booking"
                            onClick={() => setBookingToDelete(r)}
                            className="rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <Link className="hover:underline font-mono" href={`/dashboard/bookings/${r.id}`}>
                            {r.reservation_code}
                          </Link>
                        </div>
                      </td>
                    );
                  }

                  // 2. Date
                  if (c.key === 'check_in_date') {
                    return (
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap text-muted-foreground" key={c.key}>
                        {r.check_in_date}
                      </td>
                    );
                  }

                  // 3. Guest Name (Sticky Left 24)
                  if (c.key === 'guest_name') {
                    return (
                      <td className="px-3 py-2.5 font-medium text-foreground sticky left-24 z-10 bg-card group-hover:bg-muted/50 transition-colors shadow-xs" key={c.key}>
                        <div className="flex flex-col">
                          <Link className="hover:text-blue-600 hover:underline font-semibold whitespace-nowrap" href={`/dashboard/bookings/${r.id}`}>
                            {r.guest_name}
                          </Link>
                          {r.unit_label && r.unit_label !== 'Whole Villa' && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                              Room {r.unit_label}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // 4. Room / Unit Label
                  if (c.key === 'unit_label') {
                    return (
                      <td className="px-3 py-2.5" key={c.key}>
                        {r.unit_label ? (
                          <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            Room {r.unit_label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  }

                  // 5. Site / Source Channel
                  if (c.key === 'source') {
                    const src = (r.source || '').toLowerCase();
                    const isAirbnb = src.includes('airbnb');
                    const isDirect = src.includes('db') || src.includes('direct');
                    const isBookingCom = src.includes('booking');

                    return (
                      <td className="px-3 py-2.5 whitespace-nowrap" key={c.key}>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                            isAirbnb
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                              : isDirect
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : isBookingCom
                              ? 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {r.source}
                        </span>
                      </td>
                    );
                  }

                  // 6. Number of Days / Nights
                  if (c.key === 'nights') {
                    return (
                      <td className="px-2 py-2.5 text-center font-mono font-medium text-foreground bg-emerald-500/[0.02]" key={c.key}>
                        {r.nights}
                      </td>
                    );
                  }

                  // 7. Granular Guest Paid: Base Fair, Taxes, Service Charge
                  if (c.key === 'guest_base_fare' || c.key === 'guest_taxes' || c.key === 'guest_service_charge') {
                    const val = r[c.key as keyof BookingRow];
                    const numVal = val !== undefined && val !== null ? Number(val) : null;
                    return (
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground bg-emerald-500/[0.02] whitespace-nowrap" key={c.key}>
                        {numVal ? money(numVal, r.currency) : '—'}
                      </td>
                    );
                  }

                  // 8. Guest Total Amount
                  if (c.key === 'guest_total') {
                    return (
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground bg-emerald-500/10 whitespace-nowrap" key={c.key}>
                        {money(r.guest_total, r.currency)}
                      </td>
                    );
                  }

                  // 9. Host Base Fair 2
                  if (c.key === 'host_base_fare') {
                    const val = r.host_base_fare;
                    return (
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground bg-purple-500/[0.02] whitespace-nowrap" key={c.key}>
                        {val ? money(val, r.currency) : '—'}
                      </td>
                    );
                  }

                  // 10. Host Rate Adjustment
                  if (c.key === 'host_rate_adjustment') {
                    const val = r.host_rate_adjustment;
                    return (
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground bg-purple-500/[0.02] whitespace-nowrap" key={c.key}>
                        {r.host_rate_adjustment_raw || (val ? money(val, r.currency) : '—')}
                      </td>
                    );
                  }

                  // 11. Host Service Fee
                  if (c.key === 'host_service_fee') {
                    const val = r.host_service_fee;
                    return (
                      <td className="px-3 py-2.5 text-right font-mono bg-purple-500/[0.02] text-rose-600 dark:text-rose-400 whitespace-nowrap" key={c.key}>
                        {val ? `-${money(val, r.currency)}` : '—'}
                      </td>
                    );
                  }

                  // 12. Host Taxes / TDS
                  if (c.key === 'host_taxes') {
                    const val = r.host_taxes;
                    return (
                      <td className="px-3 py-2.5 text-right font-mono bg-purple-500/[0.02] text-rose-600 dark:text-rose-400 whitespace-nowrap" key={c.key}>
                        {val ? `-${money(val, r.currency)}` : '—'}
                      </td>
                    );
                  }

                  // 13. Host Additional Income
                  if (c.key === 'host_additional_income') {
                    const val = r.host_additional_income;
                    return (
                      <td className="px-3 py-2.5 text-right font-mono bg-purple-500/[0.02] text-emerald-600 dark:text-emerald-400 whitespace-nowrap" key={c.key}>
                        {val ? `+${money(val, r.currency)}` : '—'}
                      </td>
                    );
                  }

                  // 14. Host Total Payout
                  if (c.key === 'host_total') {
                    return (
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-purple-800 dark:text-purple-200 bg-purple-500/10 whitespace-nowrap" key={c.key}>
                        {money(r.host_total, r.currency)}
                      </td>
                    );
                  }

                  // 15. Amount Credited (Bank)
                  if (c.key === 'amount_credited_bank') {
                    return (
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap" key={c.key}>
                        {r.amount_credited_bank ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            {r.amount_credited_bank}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  }

                  // 16. Column 1
                  if (c.key === 'column_1') {
                    return (
                      <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap" key={c.key}>
                        {r.column_1 || '—'}
                      </td>
                    );
                  }

                  // 17. Contact Phone
                  if (c.key === 'phone') {
                    return (
                      <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap" key={c.key}>
                        {r.phone || '—'}
                      </td>
                    );
                  }

                  // 18. Notes
                  if (c.key === 'notes') {
                    const noteText = r.notes ? r.notes.replace(/\s*\(Imported\)/gi, '') : '';
                    return (
                      <td className="px-3 py-2.5 text-muted-foreground min-w-[120px] max-w-[200px] truncate" title={r.notes || ''} key={c.key}>
                        {noteText || '—'}
                      </td>
                    );
                  }

                  // 19. Financial Status
                  if (c.key === 'financial_status') {
                    const isDraft = r.financial_status === 'draft';
                    return (
                      <td className="px-3 py-2.5" key={c.key}>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            isDraft
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isDraft ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          {r.financial_status}
                        </span>
                      </td>
                    );
                  }

                  // 20. Stay Status
                  if (c.key === 'status') {
                    return (
                      <td className="px-3 py-2.5 capitalize text-muted-foreground" key={c.key}>
                        {r.status.replaceAll('_', ' ')}
                      </td>
                    );
                  }

                  // 21. Collection Mode
                  if (c.key === 'collection_mode') {
                    return (
                      <td className="px-3 py-2.5" key={c.key}>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                            r.collection_mode === 'direct'
                              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
                              : 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
                          }`}
                        >
                          {r.collection_mode === 'direct' ? 'Direct Collection' : 'Platform Collection'}
                        </span>
                      </td>
                    );
                  }

                  // 22. Created At
                  if (c.key === 'created_at') {
                    return (
                      <td className="px-3 py-2.5 text-muted-foreground" key={c.key}>
                        <FormattedDateTime date={r.created_at} />
                      </td>
                    );
                  }

                  // 23. Other Financial Columns (payout_balance, guest_received, etc.)
                  if (c.financial) {
                    const val = r[c.key as keyof BookingRow];
                    const numVal = val === null || val === undefined ? null : Number(val);
                    const isBalanceCol = c.key === 'payout_balance' || c.key === 'guest_balance';
                    const hasBalance = numVal !== null && numVal > 0;

                    return (
                      <td
                        className={`px-3 py-2.5 text-right tabular-nums font-mono ${
                          isBalanceCol && hasBalance
                            ? 'font-semibold text-amber-600 dark:text-amber-400'
                            : 'text-foreground'
                        }`}
                        key={c.key}
                      >
                        {numVal === null ? '—' : money(numVal, r.currency)}
                      </td>
                    );
                  }

                  return (
                    <td className="px-3 py-2.5 text-muted-foreground" key={c.key}>
                      {String(r[c.key as keyof BookingRow] ?? '—').replaceAll('_', ' ')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>


        {!rows.length && (
          <div className="p-12 text-center">
            <h2 className="font-medium text-foreground">No bookings match this view</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Adjust filters or add a new booking to populate your register.
            </p>
          </div>
        )}
      </div>

      {/* 7. Pagination Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page} of {Math.max(1, Math.ceil(total / 25))} ({total} total rows)
        </span>
        <div className="flex gap-3">
          {page > 1 && (
            <Link className="underline hover:text-foreground" href={url({ page: String(page - 1) })}>
              Previous
            </Link>
          )}
          {page * 25 < total && (
            <Link className="underline hover:text-foreground" href={url({ page: String(page + 1) })}>
              Next
            </Link>
          )}
        </div>
      </div>

      {/* 8. Row Quick Preview Slide-Over Drawer */}
      {drawerRow && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-lg bg-card border-l border-border/80 shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {drawerRow.reservation_code}
                </span>
                <h2 className="mt-1 text-xl font-bold text-foreground">{drawerRow.guest_name}</h2>
                <p className="text-xs text-muted-foreground">
                  {drawerRow.property_name} {drawerRow.unit_label ? `· Room ${drawerRow.unit_label}` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setDrawerRow(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Stay Specs */}
            <div className="grid grid-cols-2 gap-2.5 rounded-lg border bg-muted/40 p-3 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground">Stay Dates:</span>
                <p className="font-semibold text-foreground">
                  {drawerRow.check_in_date} → {drawerRow.check_out_date} ({drawerRow.nights} days)
                </p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Site / Channel:</span>
                <p className="font-semibold text-foreground">
                  {drawerRow.source}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Contact:</span>
                <p className="font-mono text-foreground">{drawerRow.phone || drawerRow.email || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Amount Credited (Bank):</span>
                <p className="font-semibold text-purple-700 dark:text-purple-300">
                  {drawerRow.amount_credited_bank || '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Column 1:</span>
                <p className="font-mono text-foreground">{drawerRow.column_1 || drawerRow.external_booking_ref || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Note:</span>
                <p className="text-foreground truncate" title={drawerRow.notes || ''}>
                  {drawerRow.notes ? drawerRow.notes.replace(/\s*\(Imported\)/gi, '') : '—'}
                </p>
              </div>
            </div>

            {/* Financial Breakdown Preview */}
            {isPendingDrawer ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading itemized ledger lines...</div>
            ) : drawerDetails ? (
              <div className="space-y-4">
                {/* 🟢 Guest Paid Breakdown */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      🟢 Guest Paid Ledger
                    </h3>
                    <span className="font-mono font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                      {money(drawerRow.guest_total, drawerRow.currency)}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {drawerDetails.lines.filter((l) => l.side === 'guest').length === 0 ? (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Charge</span>
                        <span className="font-mono font-medium text-foreground">{money(drawerRow.guest_total, drawerRow.currency)}</span>
                      </div>
                    ) : (
                      drawerDetails.lines
                        .filter((l) => l.side === 'guest')
                        .map((l, idx) => (
                          <div className="flex justify-between text-muted-foreground" key={idx}>
                            <span>
                              {l.label} <span className="text-[10px] opacity-70">({l.category.replaceAll('_', ' ')})</span>
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {money(Number(l.amount), drawerRow.currency)}
                            </span>
                          </div>
                        ))
                    )}
                    {drawerRow.guest_received > 0 && (
                      <div className="flex justify-between text-xs border-t border-emerald-500/20 pt-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                        <span>Direct Collections Received</span>
                        <span className="font-mono">{money(drawerRow.guest_received, drawerRow.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🟣 Host Payout Breakdown */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                      🟣 Host Payout Ledger
                    </h3>
                    <span className="font-mono font-extrabold text-sm text-purple-900 dark:text-purple-200">
                      {money(drawerRow.host_total, drawerRow.currency)}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {drawerDetails.lines.filter((l) => l.side === 'host').length === 0 ? (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Net Host Payout</span>
                        <span className="font-mono font-medium text-foreground">{money(drawerRow.host_total, drawerRow.currency)}</span>
                      </div>
                    ) : (
                      drawerDetails.lines
                        .filter((l) => l.side === 'host')
                        .map((l, idx) => {
                          const amt = Number(l.amount);
                          const isDeduction = amt < 0 || l.category === 'host_service_fee' || (l.category === 'tax' && amt < 0);
                          return (
                            <div className="flex justify-between text-muted-foreground" key={idx}>
                              <span>
                                {l.label} <span className="text-[10px] opacity-70">({l.category.replaceAll('_', ' ')})</span>
                              </span>
                              <span className={`font-mono font-medium ${isDeduction ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                                {isDeduction ? `-${money(Math.abs(amt), drawerRow.currency)}` : money(amt, drawerRow.currency)}
                              </span>
                            </div>
                          );
                        })
                    )}
                    <div className="flex justify-between text-xs border-t border-purple-500/20 pt-2 font-medium">
                      <span className="text-muted-foreground">Payout Received in Bank:</span>
                      <span className="font-mono font-semibold text-foreground">{money(drawerRow.host_received, drawerRow.currency)}</span>
                    </div>
                    {drawerRow.payout_balance !== 0 && (
                      <div className="flex justify-between text-xs font-medium text-amber-600 dark:text-amber-400">
                        <span>Payout Difference / Shortfall:</span>
                        <span className="font-mono font-bold">{money(drawerRow.payout_balance, drawerRow.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Payments & Settlements Log */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-sky-500" /> Bank Credit & Settlement History
                  </h3>
                  {drawerDetails.payments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No bank transactions recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {drawerDetails.payments.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border bg-muted/40 p-2.5 text-xs space-y-1"
                        >
                          <div className="flex justify-between font-medium">
                            <span className="text-purple-700 dark:text-purple-300 font-semibold">
                              {p.account_label || 'Bank Account'} ({p.payment_method})
                            </span>
                            <span className="font-mono font-bold">{money(p.amount, p.currency)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Settled: {p.settled_at?.slice(0, 10) || '—'}</span>
                            <span>Ref: {p.gateway_reference || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}


            {/* Footer Action */}
            <div className="border-t pt-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs"
                onClick={() => setBookingToDelete(drawerRow)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
              <Button asChild variant="blue-accent" size="sm" className="w-full text-xs">
                <Link href={`/dashboard/bookings/${drawerRow.id}`}>
                  Open Full Record & Edit <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Delete Confirmation Modal Dialog */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Booking</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to delete booking{' '}
                  <span className="font-mono font-semibold text-foreground">{bookingToDelete.reservation_code}</span> for{' '}
                  <span className="font-semibold text-foreground">{bookingToDelete.guest_name}</span>?
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
              ⚠️ Permanent Deletion: This will permanently remove the booking record, guest charges, host payouts, and transactions from the database.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setBookingToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteBooking}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Permanent Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Bulk Delete All Bookings Confirmation Modal Dialog */}
      {confirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-rose-500/30 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete ALL Bookings?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This will <strong className="text-rose-600 dark:text-rose-400">permanently delete all booking records</strong>, guest charges, host payouts, and transactions from the database.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
              ⚠️ Warning: Useful for clearing dummy development data. This action CANNOT be undone.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeletingAll}
                onClick={() => setConfirmDeleteAllOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeletingAll}
                onClick={handleDeleteAllBookings}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeletingAll ? 'Deleting All...' : 'Yes, Delete All Bookings'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
