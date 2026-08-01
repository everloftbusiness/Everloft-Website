import { Suspense } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { DashboardHero, DashboardSection, KpiGrid, DataTable, AlertsStrip } from "@/components/dashboard/dashboard-ui";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { PerformanceCharts } from "@/components/dashboard/performance-charts";
import { ManagingPropertiesTable } from "@/components/dashboard/managing-properties-table";
import { Button } from "@/components/ui/button";
import { ROLE_PROFILES, hasPermission, type AssetKey, type RangeKey } from "@/lib/dashboard/role-profiles";
import { buildPayload } from "@/lib/dashboard/mock-engine";
import { buildWorkspace, getInvestorDashboardData, getOwnerDashboardData } from "@/lib/dashboard/workspaces";
import type { RoleKey } from "@/lib/dashboard-roles";

const ASSET_CARDS = [
  { key: "marari", name: "Marari Cove", location: "Alappuzha, Kerala", type: "Beachside Villa" },
  { key: "kadavanthra", name: "Kadavanthra Suites", location: "Kochi, Kerala", type: "City Suites" },
  { key: "wayanad", name: "Wayanad Ridge", location: "Wayanad, Kerala", type: "Hill Retreat" },
];

export function GenericDashboard({
  role,
  userName,
  asset,
  range,
}: {
  role: RoleKey;
  userName: string;
  asset: AssetKey;
  range: RangeKey;
}) {
  const profile = ROLE_PROFILES[role];
  const resolvedAsset = profile.allowedAssets.includes(asset) ? asset : profile.defaultAsset;
  const resolvedRange = profile.allowedRanges.includes(range) ? range : profile.defaultRange;

  const payload = buildPayload(resolvedRange, resolvedAsset);
  const workspace = buildWorkspace(role, payload);

  const canViewProperty = hasPermission(role, "view_property");
  const canViewFinancials = hasPermission(role, "view_financials");

  const overview = canViewFinancials
    ? [
        { label: "Latest Report", value: payload.overview.latestReport, note: `Next cycle ${payload.overview.nextCycle}` },
        { label: "Active Assets", value: String(payload.overview.activeAssets), note: payload.assetNote },
        { label: "Occupancy", value: payload.summary.occupancyLabel, note: payload.overview.occupancyStatus },
        { label: "Revenue", value: payload.summary.total, note: resolvedRange },
      ]
    : [
        { label: workspace.restrictedOverview.report, value: workspace.restrictedOverview.value, note: workspace.restrictedOverview.note },
        { label: "Access Scope", value: profile.label, note: workspace.restrictedOverview.reportNote },
      ];

  return (
    <>
      <DashboardHero eyebrow={profile.heroEyebrow} userName={userName} description={profile.heroDescription} />

      {canViewProperty && (
        <div className="-mt-4 mb-8 flex justify-end">
          <Button asChild variant="gold">
            <Link href="/dashboard/properties">
              <Building2 className="h-4 w-4" />
              Manage Properties
            </Link>
          </Button>
        </div>
      )}

      <AlertsStrip alerts={workspace.alerts} />

      {(profile.allowedAssets.length > 1 || profile.allowedRanges.length > 1) && (
        <GlobalFilters
          allowedAssets={profile.allowedAssets}
          allowedRanges={profile.allowedRanges}
          asset={resolvedAsset}
          range={resolvedRange}
        />
      )}

      <DashboardSection title="Overview">
        <KpiGrid items={overview} />
      </DashboardSection>

      <DashboardSection title={workspace.title}>
        <p className="mb-5 text-sm text-muted-foreground">{workspace.note}</p>
        <KpiGrid items={workspace.cards} />
        <div className="mt-6">
          <DataTable headers={workspace.headers} rows={workspace.rows} />
        </div>
      </DashboardSection>

      {canViewProperty && (
        <DashboardSection title="Asset Portfolio">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ASSET_CARDS.filter((a) => resolvedAsset === "all" || a.key === resolvedAsset).map((a) => (
              <div key={a.key} className="rounded-xl border border-border p-5">
                <p className="text-sm font-bold text-primary">{a.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.location}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.type}</p>
              </div>
            ))}
          </div>
        </DashboardSection>
      )}

      {canViewProperty && (
        <DashboardSection title="Managing Properties">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading properties...</p>}>
            <ManagingPropertiesTable />
          </Suspense>
        </DashboardSection>
      )}

      {canViewFinancials && (
        <DashboardSection title="Performance Overview">
          <PerformanceCharts periods={payload.periods} revenue={payload.summary.revenue} occupancy={payload.summary.occupancy} />
        </DashboardSection>
      )}

      {canViewFinancials && (
        <DashboardSection title="Revenue Breakdown">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Generated</p>
              <p className="mt-2 text-xl font-bold text-primary">{payload.revenueStack.generated}</p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Expenses + Maintenance</p>
              <p className="mt-2 text-xl font-bold text-destructive">
                {payload.revenueStack.expenses} / {payload.revenueStack.maintenance}
              </p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Net</p>
              <p className="mt-2 text-xl font-bold text-primary">{payload.revenueStack.net}</p>
            </div>
          </div>
          <div className="mt-6">
            <DataTable
              headers={["Channel", "Share", "Revenue"]}
              rows={payload.drilldown.map((d) => [d.channel, d.share, d.revenue])}
            />
          </div>
        </DashboardSection>
      )}

      {canViewFinancials && (
        <DashboardSection title="Payout / Distribution History">
          <p className="mb-4 text-sm text-muted-foreground">
            Status: <span className="font-semibold text-primary">{payload.payout.status}</span> — next cycle{" "}
            {payload.payout.nextCycle}
          </p>
          <DataTable
            headers={["Period", "Gross", "Net", "Status"]}
            rows={payload.payout.historyRows.map((r) => [r.period, r.gross, r.net, r.status])}
          />
        </DashboardSection>
      )}

      {role === "investor" && <InvestorExtras payload={payload} />}
      {role === "property_owner" && <OwnerExtras payload={payload} />}
    </>
  );
}

function InvestorExtras({ payload }: { payload: ReturnType<typeof buildPayload> }) {
  const data = getInvestorDashboardData(payload);
  return (
    <>
      <DashboardSection title="Portfolio Overview">
        <KpiGrid
          items={[
            { label: "Total Properties", value: String(data.portfolio.totalProperties), note: "Invested" },
            { label: "Total Invested", value: data.portfolio.totalInvested, note: "Capital deployed" },
            { label: "Portfolio Value", value: data.portfolio.portfolioValue, note: "Current estimate" },
            { label: "Total Payout Received", value: data.portfolio.totalPayout, note: "Since investment" },
          ]}
        />
      </DashboardSection>
      <DashboardSection title="Monthly Performance Snapshot">
        <DataTable
          headers={["Line Item", "Amount", "Note"]}
          rows={data.monthlyBreakdown.map((b) => [b.label, b.amount, b.note])}
        />
      </DashboardSection>
      <DashboardSection title="Payout History">
        <p className="mb-4 text-xs text-muted-foreground">{data.payouts.bankDetails}</p>
        <DataTable
          headers={["Period", "Amount", "Status"]}
          rows={data.payouts.history.map((h) => [h.period, h.amount, h.status])}
        />
      </DashboardSection>
      <DashboardSection title="Property &amp; Guest Performance">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-primary">{data.property.name}</p>
            <p className="text-xs text-muted-foreground">{data.property.location}</p>
            <p className="mt-2 text-xs text-muted-foreground">Ownership: {data.property.ownership}</p>
            <p className="text-xs text-muted-foreground">{data.property.coInvestors}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Guest rating: {data.guestPerformance.averageRating}</p>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {data.guestPerformance.reviews.map((r) => (
                <li key={r.label}>
                  <span className="font-medium text-foreground/80">{r.label}:</span> {r.note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardSection>
    </>
  );
}

function OwnerExtras({ payload }: { payload: ReturnType<typeof buildPayload> }) {
  const data = getOwnerDashboardData(payload);
  return (
    <>
      <DashboardSection title="Revenue Breakdown (Waterfall)">
        <DataTable
          headers={["Line Item", "Amount", "Note"]}
          rows={data.revenueBreakdown.map((b) => [b.label, b.amount, b.note])}
        />
      </DashboardSection>
      <DashboardSection title="Bookings">
        <DataTable
          headers={["Guest", "Dates", "Platform", "Amount", "Status"]}
          rows={data.bookings.map((b) => [b.guestLabel, b.dates, b.platform, b.amount, b.status])}
        />
      </DashboardSection>
      <DashboardSection title="Payouts">
        <p className="mb-4 text-xs text-muted-foreground">{data.payouts.bankDetails}</p>
        <DataTable
          headers={["Period", "Amount", "Date"]}
          rows={data.payouts.history.map((h) => [h.period, h.amount, h.date])}
        />
      </DashboardSection>
    </>
  );
}
