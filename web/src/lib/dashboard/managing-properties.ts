// Ported from dashboard.presenter.js loadManagingProperties()/renderManagingProperties() —
// the one genuinely live (Google Sheets) flow in the legacy dashboard.
import { fetchSheetData, getField, formatInr, type SheetRow } from "@/lib/dashboard/sheets";

const CHECKIN_KEYS = ["Checkin_Date", "CheckIn_Date", "CheckinDate", "CheckIn", "ArrivalDate"];
const CHECKOUT_KEYS = ["Checkout_Date", "CheckOut_Date", "CheckoutDate", "CheckOut", "DepartureDate"];
const ASSET_ID_KEYS = ["Asset_ID", "AssetId", "ID"];
const BOOKING_ASSET_KEYS = ["Asset_ID", "AssetId", "Property_ID"];
const PROPERTY_NAME_KEYS = ["Property_Name", "PropertyName", "Asset", "AssetName", "Name"];

export type ManagingPropertyRow = {
  assetId: string;
  property: string;
  city: string;
  status: string;
  statusDone: boolean;
  occupancy: number;
  revenue: string;
  nextCheckin: string;
};

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function revenueMonthKey(row: SheetRow): string | null {
  const month = Number(row["Month"]);
  const year = Number(row["Year"]);
  if (!month || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function calculateOccupancy(bookings: SheetRow[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const totalDays = daysInCurrentMonth();

  let occupiedDays = 0;
  for (const booking of bookings) {
    const checkinRaw = getField(booking, CHECKIN_KEYS);
    const checkoutRaw = getField(booking, CHECKOUT_KEYS);
    const checkin = new Date(checkinRaw);
    const checkout = new Date(checkoutRaw);
    if (Number.isNaN(checkin.getTime()) || Number.isNaN(checkout.getTime())) continue;

    const start = checkin < monthStart ? monthStart : checkin;
    const end = checkout > monthEnd ? monthEnd : checkout;
    const overlapMs = end.getTime() - start.getTime();
    if (overlapMs > 0) {
      occupiedDays += Math.ceil(overlapMs / (1000 * 60 * 60 * 24));
    }
  }

  if (!totalDays) return 0;
  return Math.min(100, Math.round((occupiedDays / totalDays) * 100));
}

function nextCheckin(bookings: SheetRow[]): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let soonest: Date | null = null;
  for (const booking of bookings) {
    const raw = getField(booking, CHECKIN_KEYS);
    const date = new Date(raw);
    if (Number.isNaN(date.getTime()) || date < now) continue;
    if (!soonest || date < soonest) soonest = date;
  }

  if (!soonest) return "—";
  return soonest.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export async function getManagingProperties(): Promise<{ rows: ManagingPropertyRow[]; error: string | null }> {
  let assets: SheetRow[];
  let bookings: SheetRow[];
  let revenue: SheetRow[];

  try {
    [assets, bookings, revenue] = await Promise.all([
      fetchSheetData("Assets"),
      fetchSheetData("Bookings"),
      fetchSheetData("Revenue"),
    ]);
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : "Unable to load property data." };
  }

  const validAssets = assets.filter((row) => getField(row, ASSET_ID_KEYS));
  const monthKey = currentMonthKey();

  const rows: ManagingPropertyRow[] = validAssets.map((asset) => {
    const assetId = getField(asset, ASSET_ID_KEYS);
    const assetBookings = bookings.filter((b) => getField(b, BOOKING_ASSET_KEYS) === assetId);
    const assetRevenueThisMonth = revenue
      .filter((r) => getField(r, BOOKING_ASSET_KEYS) === assetId && revenueMonthKey(r) === monthKey)
      .reduce((sum, r) => sum + Number(getField(r, ["Net_Amount", "NetAmount", "Net"], "0")), 0);

    const rawStatus = getField(asset, ["Status"], "Unknown");

    return {
      assetId,
      property: getField(asset, PROPERTY_NAME_KEYS, "Unnamed Property"),
      city: getField(asset, ["City"], "-"),
      status: rawStatus,
      statusDone: rawStatus.toLowerCase().includes("active"),
      occupancy: calculateOccupancy(assetBookings),
      revenue: formatInr(assetRevenueThisMonth),
      nextCheckin: nextCheckin(assetBookings),
    };
  });

  rows.sort((a, b) => a.property.localeCompare(b.property));
  return { rows, error: null };
}
