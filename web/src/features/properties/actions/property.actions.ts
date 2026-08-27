"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDashboardSession } from "@/lib/dashboard/session";
import {
  createDraftProperty,
  updateProperty,
  softDeleteProperty,
  type CreatePropertyInput,
} from "@/features/properties/services/properties.service";

// "Add Property" itself only ever creates a minimal name-only draft
// (createDraftPropertyAction below) and sends the user straight into the
// Setup Dashboard (docs/PROPERTY_ONBOARDING_EXPERIENCE.md) to fill in
// everything else — this schema/action pair is for the EDIT form on the
// plain property detail page (updatePropertyAction), not property creation.
//
// These actions deliberately never call next/navigation's redirect() —
// they're invoked from a client component wrapped in try/catch (see
// components/dashboard/properties/property-form.tsx), and redirect() works
// by throwing a special control-flow error that a surrounding catch block
// would otherwise swallow as a real failure. Instead, actions return a
// plain result object and the client component redirects itself.
const propertyFormSchema = z.object({
  name: z.string().min(2, "Property name is required."),
  typeId: z.string().uuid("Select a property type."),
  statusId: z.string().uuid("Select a status."),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  country: z.string().min(1, "Country is required."),
  state: z.string().optional(),
  city: z.string().min(1, "City is required."),
  address: z.string().optional(),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  maxGuests: z.coerce.number().int().min(1).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  currency: z.string().length(3).default("INR"),
});

function formDataToInput(formData: FormData): CreatePropertyInput {
  const raw = Object.fromEntries(formData.entries());
  const parsed = propertyFormSchema.parse(raw);
  return {
    ...parsed,
    categoryId: parsed.categoryId || undefined,
    ownerId: parsed.ownerId || undefined,
  };
}

async function requirePermission(permission: string) {
  const session = await getDashboardSession();
  if (!session) throw new Error("Sign in required.");
  if (!session.permissions.includes(permission) && !session.permissions.includes("manage_properties")) {
    throw new Error(`You don't have permission to do that (${permission}).`);
  }
  return session;
}

const draftNameSchema = z.object({ name: z.string().min(2, "Property name is required.") });

export async function createDraftPropertyAction(formData: FormData): Promise<{ id: string }> {
  const session = await requirePermission("create_property");
  const { name } = draftNameSchema.parse(Object.fromEntries(formData.entries()));
  const { id } = await createDraftProperty(name, session.userId);
  revalidatePath("/dashboard/properties");
  return { id };
}

export async function updatePropertyAction(id: string, formData: FormData): Promise<{ id: string }> {
  const session = await requirePermission("edit_property");
  const input = formDataToInput(formData);
  await updateProperty(id, input, session.userId);
  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  return { id };
}

export async function deletePropertyAction(id: string): Promise<{ ok: true }> {
  const session = await requirePermission("delete_property");
  await softDeleteProperty(id, session.userId);
  revalidatePath("/dashboard/properties");
  return { ok: true };
}

export async function updatePropertyStatusAction(id: string, statusSlug: string): Promise<{ ok: true }> {
  const session = await requirePermission("edit_property");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: statusRow } = await supabase.from("property_status").select("id").eq("slug", statusSlug).maybeSingle();
  if (!statusRow) throw new Error(`Invalid status slug: ${statusSlug}`);

  const { error } = await supabase.from("properties").update({ status_id: statusRow.id, updated_by: session.userId }).eq("id", id);
  if (error) throw error;

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  return { ok: true };
}
