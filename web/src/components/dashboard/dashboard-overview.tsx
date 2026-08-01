import { formatDistanceToNow } from "date-fns";
import { getOverviewData } from "@/lib/dashboard/overview";
import { DashboardHero, DashboardSection, KpiGrid, DataTable, StatusChip } from "@/components/dashboard/dashboard-ui";

export async function DashboardOverview({ userName }: { userName: string }) {
  const data = await getOverviewData();

  return (
    <>
      <DashboardHero
        eyebrow="Platform Overview"
        userName={userName}
        description="A foundation-level snapshot of the Everloft platform — properties, people, and system health. Occupancy and revenue populate once the booking and revenue modules ship."
      />

      <DashboardSection title="Platform at a glance">
        <KpiGrid
          items={[
            { label: "Total Properties", value: String(data.totalProperties), note: "Onboarded to the platform" },
            { label: "Total Users", value: String(data.totalUsers), note: "Across every role" },
            { label: "Owners", value: String(data.totalOwners), note: "Property owner accounts" },
            { label: "Investors", value: String(data.totalInvestors), note: "Investor accounts" },
            { label: "Occupancy", value: "—", note: "Placeholder — ships with the booking engine" },
            { label: "Revenue", value: "—", note: "Placeholder — ships with revenue management" },
          ]}
        />
      </DashboardSection>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-8">
        <DashboardSection title="Recent activity">
          <DataTable
            headers={["Action", "By", "When"]}
            rows={data.recentActivity.map((row) => [
              row.action.replace(/_/g, " "),
              row.actor,
              formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }),
            ])}
          />
        </DashboardSection>

        <DashboardSection title="Latest logins">
          <DataTable
            headers={["User", "When"]}
            rows={data.latestLogins.map((row) => [
              row.actor,
              formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }),
            ])}
          />
        </DashboardSection>
      </div>

      <DashboardSection title="System status">
        <ul className="space-y-3">
          {data.systemStatus.map((status) => (
            <li key={status.label} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-semibold text-primary">{status.label}</p>
                <p className="text-xs text-muted-foreground">{status.detail}</p>
              </div>
              <StatusChip done={status.ok} label={status.ok ? "Connected" : "Not configured"} />
            </li>
          ))}
        </ul>
      </DashboardSection>
    </>
  );
}
