// Ported from js/property-details.js — the super-admin-only single-property analytics view.
import { fetchSheetData, getField, formatInr, formatSheetDate, toNumber } from "@/lib/dashboard/sheets";

const ASSET_ID_KEYS = ["Asset_ID", "AssetId", "ID"];
const PROPERTY_ASSET_KEYS = ["Asset_ID", "AssetId", "Property_ID"];

export type PropertyDetail = {
  assetId: string;
  name: string;
  city: string;
  address: string;
  status: string;
  totalRooms: string;
  revenue: {
    currentMonth: string;
    total: string;
    trackedMonths: number;
    latestMonth: string;
    chart: { month: string; net: number }[];
  };
  bookings: {
    guestName: string;
    checkin: string;
    checkout: string;
    source: string;
    amount: string;
    status: string;
    statusDone: boolean;
  }[];
};

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export async function getPropertyDetail(assetId: string): Promise<PropertyDetail | null> {
  const [assets, bookings, revenue] = await Promise.all([
    fetchSheetData("Assets"),
    fetchSheetData("Bookings"),
    fetchSheetData("Revenue"),
  ]);

  const asset = assets.find((row) => getField(row, ASSET_ID_KEYS) === assetId);
  if (!asset) return null;

  const assetBookings = bookings
    .filter((b) => getField(b, PROPERTY_ASSET_KEYS) === assetId)
    .map((b) => ({
      guestName: getField(b, ["Guest_Name", "GuestName"], "Guest"),
      checkin: getField(b, ["Checkin_Date", "CheckIn_Date"]),
      checkout: getField(b, ["Checkout_Date", "CheckOut_Date"]),
      source: getField(b, ["Booking_Source", "BookingSource"], "-"),
      amountValue: toNumber(getField(b, ["Amount"], "0")),
      rawStatus: getField(b, ["Status"], "-"),
    }))
    .sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime());

  const assetRevenue = revenue.filter((r) => getField(r, PROPERTY_ASSET_KEYS) === assetId);
  const grouped: Record<string, number> = {};
  for (const row of assetRevenue) {
    const month = Number(row["Month"]);
    const year = Number(row["Year"]);
    if (!month || !year) continue;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    grouped[key] = (grouped[key] ?? 0) + toNumber(getField(row, ["Net_Amount", "NetAmount", "Net"], "0"));
  }

  const labels = Object.keys(grouped).sort();
  const chart = labels.map((key) => ({ month: monthLabel(key), net: grouped[key] }));
  const totalRevenue = labels.reduce((sum, key) => sum + grouped[key], 0);
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return {
    assetId,
    name: getField(asset, ["Property_Name", "PropertyName"], "Unnamed Property"),
    city: getField(asset, ["City"], "-"),
    address: getField(asset, ["Address"], "-"),
    status: getField(asset, ["Status"], "Unknown"),
    totalRooms: getField(asset, ["Total_Rooms", "TotalRooms"], "-"),
    revenue: {
      currentMonth: formatInr(grouped[currentMonthKey] ?? 0),
      total: formatInr(totalRevenue),
      trackedMonths: labels.length,
      latestMonth: labels.length ? monthLabel(labels[labels.length - 1]) : "No revenue data",
      chart,
    },
    bookings: assetBookings.map((b) => ({
      guestName: b.guestName,
      checkin: formatSheetDate(b.checkin),
      checkout: formatSheetDate(b.checkout),
      source: b.source,
      amount: formatInr(b.amountValue),
      status: b.rawStatus,
      statusDone: /active|confirm|complete/i.test(b.rawStatus),
    })),
  };
}
