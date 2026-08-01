import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata = { robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-soft">
      <DashboardHeader session={session} />
      <main className="site-container py-10">{children}</main>
    </div>
  );
}
