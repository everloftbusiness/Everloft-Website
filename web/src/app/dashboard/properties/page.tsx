import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { listProperties } from "@/features/properties/services/properties.service";
import { DashboardHero, DashboardSection } from "@/components/dashboard/dashboard-ui";
import { PropertiesListView } from "@/components/dashboard/properties/properties-list-view";

export default async function PropertiesListPage(props: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (!session.permissions.includes("view_properties") && !session.permissions.includes("manage_properties")) {
    redirect("/dashboard");
  }

  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const search = resolvedParams?.search;
  const { properties, total } = await listProperties({ search, pageSize: 100 });
  const canCreate = session.permissions.includes("create_property") || session.permissions.includes("manage_properties");

  return (
    <>
      <DashboardHero
        eyebrow="Property Management"
        userName={session.username}
        description={`${total} ${total === 1 ? "property" : "properties"} in the portfolio.`}
      />

      <DashboardSection title="Properties Portfolio">
        <PropertiesListView
          initialProperties={properties}
          total={total}
          canCreate={canCreate}
          userRole={session.role}
        />
      </DashboardSection>
    </>
  );
}
