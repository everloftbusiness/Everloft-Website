// Shared role vocabulary used across the dashboard UI and the
// roles/user_roles tables in Supabase (supabase/migrations/20260730000008_
// seed_rbac_data.sql seeds exactly these 11 slugs). The DB is the source of
// truth for who has which role — this module just gives the app a typed,
// stable name for each one and the URL slug it routes to.

export const ROLE_SLUGS = [
  "super_admin",
  "finance_admin",
  "operations_manager",
  "tech_admin",
  "property_manager",
  "housekeeping",
  "maintenance",
  "guest_support",
  "property_owner",
  "guest",
  "investor",
] as const;

export type RoleKey = (typeof ROLE_SLUGS)[number];

const ROLE_TO_SLUG: Record<RoleKey, string> = {
  super_admin: "super-admin",
  finance_admin: "finance-admin",
  operations_manager: "operations-manager",
  tech_admin: "tech-admin",
  property_manager: "property-manager",
  housekeeping: "housekeeping",
  maintenance: "maintenance",
  guest_support: "guest-support",
  property_owner: "property-owner",
  guest: "guest",
  investor: "investor",
};

export function roleToDashboardSlug(role: RoleKey | string): string {
  return ROLE_TO_SLUG[role as RoleKey] || "guest";
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: "Super Admin",
  finance_admin: "Finance Admin",
  operations_manager: "Operations Manager",
  tech_admin: "Tech Admin",
  property_manager: "Property Manager",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  guest_support: "Guest Support",
  property_owner: "Property Owner",
  guest: "Guest",
  investor: "Investor",
};
