import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { createDraftProperty } from "@/features/properties/services/properties.service";

export default async function NewPropertyPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (!session.permissions.includes("create_property") && !session.permissions.includes("manage_properties")) {
    redirect("/dashboard/properties");
  }

  const { id } = await createDraftProperty("New Property", session.userId);
  redirect(`/dashboard/properties/${id}/setup`);
}

