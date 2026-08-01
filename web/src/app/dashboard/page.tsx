import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

const PLATFORM_OVERVIEW_ROLES = new Set(["super_admin", "tech_admin"]);

export default async function DashboardRouterPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");

  if (PLATFORM_OVERVIEW_ROLES.has(session.role)) {
    return <DashboardOverview userName={session.username} />;
  }

  redirect(`/dashboard/${session.roleSlug}`);
}
