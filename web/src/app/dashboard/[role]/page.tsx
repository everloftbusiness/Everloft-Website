import { redirect, notFound } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { GenericDashboard } from "@/components/dashboard/generic-dashboard";
import { GuestDashboard } from "@/components/dashboard/roles/guest-dashboard";
import { HousekeepingDashboard } from "@/components/dashboard/roles/housekeeping-dashboard";
import { MaintenanceDashboard } from "@/components/dashboard/roles/maintenance-dashboard";
import type { AssetKey, RangeKey } from "@/lib/dashboard/role-profiles";

const VALID_SLUGS = [
  "super-admin",
  "finance-admin",
  "operations-manager",
  "tech-admin",
  "property-manager",
  "housekeeping",
  "maintenance",
  "guest-support",
  "property-owner",
  "guest",
  "investor",
];

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function RoleDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { role: roleSlug } = await params;
  if (!VALID_SLUGS.includes(roleSlug)) notFound();

  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (session.roleSlug !== roleSlug) redirect(`/dashboard/${session.roleSlug}`);

  if (session.role === "guest") return <GuestDashboard userName={session.username} />;
  if (session.role === "housekeeping") return <HousekeepingDashboard userName={session.username} />;
  if (session.role === "maintenance") return <MaintenanceDashboard userName={session.username} />;

  const sp = await searchParams;
  const asset = (Array.isArray(sp.asset) ? sp.asset[0] : sp.asset) as AssetKey | undefined;
  const range = (Array.isArray(sp.range) ? sp.range[0] : sp.range) as RangeKey | undefined;

  return (
    <GenericDashboard
      role={session.role}
      userName={session.username}
      asset={asset ?? "all"}
      range={range ?? "monthly"}
    />
  );
}
