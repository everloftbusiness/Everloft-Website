import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getPropertyDetail } from "@/lib/dashboard/property-detail";
import { DashboardHero, DashboardSection, KpiGrid } from "@/components/dashboard/dashboard-ui";
import { StatusChip } from "@/components/dashboard/dashboard-ui";
import { PropertyRevenueChart } from "@/components/dashboard/property-revenue-chart";
import { Button } from "@/components/ui/button";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (session.role !== "super_admin") redirect(`/dashboard/${session.roleSlug}`);

  const detail = await getPropertyDetail(decodeURIComponent(assetId));

  if (!detail) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">No property was found for Asset_ID {assetId}.</p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
          <Link href="/dashboard/super-admin"><ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/dashboard/super-admin"><ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard</Link>
        </Button>
      </div>

      <DashboardHero eyebrow="Property Details" userName={detail.name} description={`Asset ID: ${detail.assetId} — source: Assets sheet`} />

      <DashboardSection title="Property Information">
        <KpiGrid
          items={[
            { label: "Property Name", value: detail.name, note: "Primary property record" },
            { label: "City", value: detail.city, note: "Location" },
            { label: "Address", value: detail.address, note: "Full address" },
            { label: "Status", value: detail.status, note: "Operational status" },
          ]}
        />
      </DashboardSection>

      <DashboardSection title="Property Revenue Summary">
        <KpiGrid
          items={[
            { label: "Current Month Revenue", value: detail.revenue.currentMonth, note: "This calendar month" },
            { label: "Total Net Revenue", value: detail.revenue.total, note: "All tracked months" },
            { label: "Tracked Months", value: String(detail.revenue.trackedMonths), note: "Months with revenue rows" },
            { label: "Latest Revenue Month", value: detail.revenue.latestMonth, note: "Most recent data" },
          ]}
        />
        <div className="mt-6">
          <PropertyRevenueChart data={detail.revenue.chart} />
        </div>
      </DashboardSection>

      <DashboardSection title="Property Bookings">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4">Guest Name</th>
                <th className="pb-3 pr-4">Checkin Date</th>
                <th className="pb-3 pr-4">Checkout Date</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">No records found.</td>
                </tr>
              ) : (
                detail.bookings.map((b, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">{b.guestName}</td>
                    <td className="py-3 pr-4">{b.checkin}</td>
                    <td className="py-3 pr-4">{b.checkout}</td>
                    <td className="py-3 pr-4">{b.source}</td>
                    <td className="py-3 pr-4">{b.amount}</td>
                    <td className="py-3 pr-4"><StatusChip done={b.statusDone} label={b.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </>
  );
}
