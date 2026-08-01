// Ported from screens/dashboard/code/screen/dashboard.presenter.js `buildPayload` and friends.
// This mirrors the legacy dashboard's demo/illustrative financial model — it is not live data
// (only the Super Admin "Managing Properties" flow reads real Google Sheets; see sheets.ts).
import type { AssetKey, RangeKey } from "@/lib/dashboard/role-profiles";
import { formatCurrency } from "@/lib/format";

type RangeDefinition = {
  periods: string[];
  revenue: number[];
  occupancy: number[];
  adr: number[];
  reportLabel: string;
  nextCycle: string;
  historyPeriods: string[];
  comparisonTarget: string;
  baselineNote: string;
};

const RANGE_DEFINITIONS: Record<RangeKey, RangeDefinition> = {
  monthly: {
    periods: ["Week 1", "Week 2", "Week 3", "Week 4"],
    revenue: [168000, 184000, 207000, 241000],
    occupancy: [68, 72, 79, 86],
    adr: [6800, 7100, 7400, 7900],
    reportLabel: "March 2026 cycle",
    nextCycle: "05 Apr 2026",
    historyPeriods: ["Jan 2026", "Feb 2026", "Mar 2026"],
    comparisonTarget: "previous week",
    baselineNote: "Weekly revenue across the current monthly cycle.",
  },
  quarterly: {
    periods: ["Month 1", "Month 2", "Month 3"],
    revenue: [612000, 684000, 742000],
    occupancy: [71, 76, 81],
    adr: [7000, 7350, 7650],
    reportLabel: "Q1 2026 cycle",
    nextCycle: "10 Apr 2026",
    historyPeriods: ["Q3 2025", "Q4 2025", "Q1 2026"],
    comparisonTarget: "previous month",
    baselineNote: "Monthly revenue across the current quarterly cycle.",
  },
  yearly: {
    periods: ["Q1", "Q2", "Q3", "Q4"],
    revenue: [1980000, 2240000, 2510000, 2870000],
    occupancy: [70, 75, 80, 84],
    adr: [7100, 7400, 7700, 8100],
    reportLabel: "FY 2025-26",
    nextCycle: "15 Apr 2026",
    historyPeriods: ["FY 2023-24", "FY 2024-25", "FY 2025-26"],
    comparisonTarget: "previous quarter",
    baselineNote: "Quarterly revenue across the current fiscal year.",
  },
};

type AssetProfile = {
  label: string;
  revenueFactor: number;
  occDelta: number;
  adrDelta: number;
  assetCount: number;
  assetNote: string;
  expenseRatio: number;
  underDevelopment: boolean;
};

const ASSET_PROFILES: Record<AssetKey, AssetProfile> = {
  all: {
    label: "All Properties",
    revenueFactor: 1,
    occDelta: 0,
    adrDelta: 0,
    assetCount: 3,
    assetNote: "Aggregated across Marari Cove, Kadavanthra Suites, and Wayanad Ridge.",
    expenseRatio: 0.24,
    underDevelopment: false,
  },
  marari: {
    label: "Marari Cove",
    revenueFactor: 0.46,
    occDelta: 6,
    adrDelta: 400,
    assetCount: 1,
    assetNote: "Beachside villa, Alappuzha — highest-performing asset.",
    expenseRatio: 0.22,
    underDevelopment: false,
  },
  kadavanthra: {
    label: "Kadavanthra Suites",
    revenueFactor: 0.34,
    occDelta: -3,
    adrDelta: -200,
    assetCount: 1,
    assetNote: "City-centre serviced suites, Kochi.",
    expenseRatio: 0.26,
    underDevelopment: false,
  },
  wayanad: {
    label: "Wayanad Ridge",
    revenueFactor: 0.2,
    occDelta: -9,
    adrDelta: -600,
    assetCount: 1,
    assetNote: "Hill-view retreat — onboarding in progress.",
    expenseRatio: 0.29,
    underDevelopment: true,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type DashboardPayload = {
  rangeKey: RangeKey;
  assetKey: AssetKey;
  assetLabel: string;
  assetNote: string;
  underDevelopment: boolean;
  periods: string[];
  summary: {
    revenue: number[];
    occupancy: number[];
    adr: number[];
    latestRevenue: number;
    latestOccupancy: number;
    latestAdr: number;
    nights: number;
    percentDelta: number;
    total: string;
    occupancyLabel: string;
    adrLabel: string;
    nightsLabel: string;
  };
  overview: {
    latestReport: string;
    nextCycle: string;
    activeAssets: number;
    occupancyStatus: string;
  };
  revenueStack: {
    generated: string;
    expenses: string;
    maintenance: string;
    net: string;
    generatedValue: number;
    expensesValue: number;
    maintenanceValue: number;
    netValue: number;
  };
  payout: {
    status: string;
    nextCycle: string;
    historyRows: { period: string; gross: string; net: string; status: string }[];
  };
  drilldown: { channel: string; share: string; revenue: string }[];
  profile: { label: string };
};

export function buildPayload(rangeKey: RangeKey, assetKey: AssetKey): DashboardPayload {
  const range = RANGE_DEFINITIONS[rangeKey];
  const asset = ASSET_PROFILES[assetKey];

  const revenue = range.revenue.map((v) => Math.round(v * asset.revenueFactor));
  const occupancy = range.occupancy.map((v) => clamp(v + asset.occDelta, 45, 96));
  const adr = range.adr.map((v) => Math.max(1000, v + asset.adrDelta));

  const latestRevenue = revenue[revenue.length - 1];
  const previousRevenue = revenue.length > 1 ? revenue[revenue.length - 2] : latestRevenue;
  const latestOccupancy = occupancy[occupancy.length - 1];
  const latestAdr = adr[adr.length - 1];
  const nights = Math.round(latestRevenue / latestAdr);
  const percentDelta = previousRevenue > 0 ? Math.round(((latestRevenue - previousRevenue) / previousRevenue) * 1000) / 10 : 0;

  const generatedValue = latestRevenue;
  const expensesValue = Math.round(generatedValue * asset.expenseRatio);
  const maintenanceValue = Math.round(generatedValue * 0.07);
  const netValue = generatedValue - expensesValue - maintenanceValue;

  const historyRows = range.historyPeriods.map((period, i) => {
    const factor = 0.85 + i * 0.08;
    const gross = Math.round(latestRevenue * factor);
    const net = Math.round(gross * 0.67);
    return {
      period,
      gross: formatCurrency(gross),
      net: formatCurrency(net),
      status: i === range.historyPeriods.length - 1 ? "Processing" : "Paid",
    };
  });

  const drilldown = [
    { channel: "Direct Booking", share: "34%", revenue: formatCurrency(Math.round(generatedValue * 0.34)) },
    { channel: "Airbnb", share: "41%", revenue: formatCurrency(Math.round(generatedValue * 0.41)) },
    { channel: "Booking Platforms", share: "25%", revenue: formatCurrency(Math.round(generatedValue * 0.25)) },
  ];

  return {
    rangeKey,
    assetKey,
    assetLabel: asset.label,
    assetNote: asset.assetNote,
    underDevelopment: asset.underDevelopment,
    periods: range.periods,
    summary: {
      revenue,
      occupancy,
      adr,
      latestRevenue,
      latestOccupancy,
      latestAdr,
      nights,
      percentDelta,
      total: formatCurrency(latestRevenue),
      occupancyLabel: `${latestOccupancy}%`,
      adrLabel: formatCurrency(latestAdr),
      nightsLabel: `${nights} nights`,
    },
    overview: {
      latestReport: range.reportLabel,
      nextCycle: range.nextCycle,
      activeAssets: asset.assetCount,
      occupancyStatus: latestOccupancy >= 70 ? "Healthy" : "Below target",
    },
    revenueStack: {
      generated: formatCurrency(generatedValue),
      expenses: `- ${formatCurrency(expensesValue)}`,
      maintenance: `- ${formatCurrency(maintenanceValue)}`,
      net: formatCurrency(netValue),
      generatedValue,
      expensesValue: -expensesValue,
      maintenanceValue: -maintenanceValue,
      netValue,
    },
    payout: {
      status: netValue > 0 ? "Processed" : "Scheduled",
      nextCycle: range.nextCycle,
      historyRows,
    },
    drilldown,
    profile: { label: asset.label },
  };
}
