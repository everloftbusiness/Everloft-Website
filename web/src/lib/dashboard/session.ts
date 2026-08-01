import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, roleToDashboardSlug, type RoleKey } from "@/lib/dashboard-roles";

// Same shape the dashboard UI has always consumed (dashboard-header.tsx,
// /dashboard/[role]/page.tsx, /dashboard/property/[assetId]/page.tsx) —
// only where it comes from changed: Supabase Auth + the roles/user_roles/
// role_permissions tables, not a custom JWT parsed from a Google Script
// response.
export type DashboardSession = {
  userId: string;
  username: string; // display name shown in the header/greetings
  email: string;
  role: RoleKey;
  roleLabel: string;
  roleSlug: string;
  permissions: string[];
};

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: primaryUserRole }, { data: permissionRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("user_permissions").select("permission_key").eq("user_id", user.id),
  ]);

  let role: RoleKey = "guest";
  let roleName: string | undefined;

  if (primaryUserRole?.role_id) {
    const { data: roleRow } = await supabase
      .from("roles")
      .select("slug, name")
      .eq("id", primaryUserRole.role_id)
      .maybeSingle();
    if (roleRow) {
      role = roleRow.slug as RoleKey;
      roleName = roleRow.name;
    }
  }

  return {
    userId: user.id,
    username: profile?.full_name || profile?.email || user.email || "Everloft User",
    email: profile?.email ?? user.email ?? "",
    role,
    roleLabel: roleName ?? ROLE_LABELS[role] ?? role,
    roleSlug: roleToDashboardSlug(role),
    permissions: (permissionRows ?? []).map((p) => p.permission_key as string),
  };
}
