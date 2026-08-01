import Link from "next/link";
import { getManagingProperties } from "@/lib/dashboard/managing-properties";
import { StatusChip } from "@/components/dashboard/dashboard-ui";

export async function ManagingPropertiesTable() {
  const { rows, error } = await getManagingProperties();

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {rows.length} {rows.length === 1 ? "property" : "properties"} visible
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4">Property</th>
              <th className="pb-3 pr-4">City</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Occupancy</th>
              <th className="pb-3 pr-4">Revenue</th>
              <th className="pb-3 pr-4">Next Checkin</th>
              <th className="pb-3 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted-foreground">
                  No properties found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.assetId} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-primary">{row.property}</td>
                  <td className="py-3 pr-4 text-foreground/80">{row.city}</td>
                  <td className="py-3 pr-4">
                    <StatusChip done={row.statusDone} label={row.status} />
                  </td>
                  <td className="py-3 pr-4 text-foreground/80">{row.occupancy}%</td>
                  <td className="py-3 pr-4 text-foreground/80">{row.revenue}</td>
                  <td className="py-3 pr-4 text-foreground/80">{row.nextCheckin}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/property/${encodeURIComponent(row.assetId)}`}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
