import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { listProperties } from "@/features/properties/services/properties.service";
import { DashboardHero, DashboardSection, DataTable, StatusChip } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";

export default async function PropertiesListPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (!session.permissions.includes("view_properties") && !session.permissions.includes("manage_properties")) {
    redirect("/dashboard");
  }

  const { search } = await searchParams;
  const { properties, total } = await listProperties({ search });
  const canCreate = session.permissions.includes("create_property") || session.permissions.includes("manage_properties");

  return (
    <>
      <DashboardHero
        eyebrow="Property Management"
        userName={session.username}
        description={`${total} ${total === 1 ? "property" : "properties"} in the portfolio.`}
      />

      <DashboardSection title="Properties">
        <div className="mb-5 flex items-center justify-between">
          <form className="flex gap-2">
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search by name..."
              className="h-9 w-64 rounded-lg border border-input bg-transparent px-3 text-sm"
            />
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
          {canCreate && (
            <Button asChild variant="gold">
              <Link href="/dashboard/properties/new">Add Property</Link>
            </Button>
          )}
        </div>

        <DataTable
          headers={["Name", "Type", "City", "Owner", "Manager", "Max Guests", "Status", ""]}
          rows={properties.map((p) => [
            <Link key={p.id} href={`/dashboard/properties/${p.id}`} className="font-semibold text-primary hover:underline">
              {p.name}
            </Link>,
            p.typeName ?? "—",
            p.city ?? "—",
            p.ownerName ?? "—",
            p.managerName ?? "—",
            p.maxGuests ?? "—",
            <StatusChip key={`${p.id}-status`} done={p.statusSlug === "active"} label={p.statusName ?? "—"} />,
            <Link key={`${p.id}-view`} href={`/dashboard/properties/${p.id}`} className="text-xs font-medium text-primary hover:underline">
              View →
            </Link>,
          ])}
        />
      </DashboardSection>
    </>
  );
}
