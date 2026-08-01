import { createClient } from "@/lib/supabase/server";

export type OverviewData = {
  totalProperties: number;
  totalUsers: number;
  totalOwners: number;
  totalInvestors: number;
  recentActivity: { id: string; action: string; actor: string; createdAt: string }[];
  latestLogins: { id: string; actor: string; createdAt: string }[];
  systemStatus: { label: string; ok: boolean; detail: string }[];
};

async function countUsersWithRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roleSlug: string
): Promise<number> {
  const { data: role } = await supabase.from("roles").select("id").eq("slug", roleSlug).maybeSingle();
  if (!role) return 0;
  const { count } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", role.id)
    .is("deleted_at", null);
  return count ?? 0;
}

// Batches profile lookups for a set of activity_log rows so we don't run
// N+1 queries or depend on PostgREST embedded-resource type inference.
async function describeActors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: { id: string; user_id: string | null; created_at: string; action?: string }[]
) {
  const userIds = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  const profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, profile.full_name || profile.email || "Unknown user");
    }
  }

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actor: (row.user_id && profileMap.get(row.user_id)) || "Unknown user",
    createdAt: row.created_at,
  }));
}

export async function getOverviewData(): Promise<OverviewData> {
  const supabase = await createClient();

  const [
    { count: totalProperties },
    { count: totalUsers },
    totalOwners,
    totalInvestors,
    { data: activityRows },
    { data: loginRows },
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    countUsersWithRole(supabase, "property_owner"),
    countUsersWithRole(supabase, "investor"),
    supabase.from("activity_logs").select("id, user_id, action, created_at").order("created_at", { ascending: false }).limit(8),
    supabase
      .from("activity_logs")
      .select("id, user_id, created_at")
      .eq("action", "login")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const [recentActivity, latestLoginsRaw] = await Promise.all([
    describeActors(supabase, activityRows ?? []),
    describeActors(supabase, loginRows ?? []),
  ]);

  return {
    totalProperties: totalProperties ?? 0,
    totalUsers: totalUsers ?? 0,
    totalOwners,
    totalInvestors,
    recentActivity: recentActivity.map((row) => ({
      id: row.id,
      action: row.action ?? "activity",
      actor: row.actor,
      createdAt: row.createdAt,
    })),
    latestLogins: latestLoginsRaw.map((row) => ({ id: row.id, actor: row.actor, createdAt: row.createdAt })),
    systemStatus: [
      {
        label: "Supabase connection",
        ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL",
      },
      {
        label: "Service role (admin ops)",
        ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        detail: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "Missing SUPABASE_SERVICE_ROLE_KEY",
      },
      {
        label: "Cloudflare R2 storage",
        ok: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_PUBLIC_BASE_URL),
        detail: process.env.R2_ACCOUNT_ID ? "Configured" : "Not configured yet",
      },
    ],
  };
}
