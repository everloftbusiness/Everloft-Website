// Typed view of the permission keys seeded in
// supabase/migrations/20260730000008_seed_rbac_data.sql. This union exists
// purely for editor autocomplete/typo-safety in application code — the
// actual source of truth is the `permissions` table, and adding a new
// permission there (e.g. for a future custom role) works immediately with
// no code change; this type just won't autocomplete it until updated.
export type PermissionKey =
  | "view_dashboard"
  | "manage_users"
  | "manage_roles"
  | "manage_permissions"
  | "manage_properties"
  | "manage_bookings"
  | "view_financials"
  | "manage_expenses"
  | "view_reports"
  | "manage_investors"
  | "manage_owners"
  | "manage_housekeeping"
  | "manage_maintenance";

export function hasPermission(granted: string[], permission: PermissionKey): boolean {
  return granted.includes(permission);
}

export function hasAnyPermission(granted: string[], permissions: PermissionKey[]): boolean {
  return permissions.some((permission) => granted.includes(permission));
}

export function hasAllPermissions(granted: string[], permissions: PermissionKey[]): boolean {
  return permissions.every((permission) => granted.includes(permission));
}
