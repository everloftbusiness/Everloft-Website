import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { DashboardHero, DashboardSection } from "@/components/dashboard/dashboard-ui";
import { QuickCreatePropertyForm } from "@/components/dashboard/properties/quick-create-form";

export default async function NewPropertyPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (!session.permissions.includes("create_property") && !session.permissions.includes("manage_properties")) {
    redirect("/dashboard/properties");
  }

  return (
    <>
      <DashboardHero eyebrow="Property Management" userName={session.username} description="Give your new property a name to get started." />
      <DashboardSection title="Add Property">
        <QuickCreatePropertyForm />
      </DashboardSection>
    </>
  );
}
