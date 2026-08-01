// Ported from screens/dashboard/code/screen/dashboard.presenter.js `roleProfiles`.
import type { RoleKey } from "@/lib/dashboard-roles";

export type Permission =
  | "view_property"
  | "edit_property"
  | "view_financials"
  | "approve_payout"
  | "assign_task"
  | "view_only_own_data"
  | "manage_users"
  | "manage_system"
  | "manage_content"
  | "manage_bookings";

export type AssetKey = "all" | "marari" | "kadavanthra" | "wayanad";
export type RangeKey = "monthly" | "quarterly" | "yearly";

export type RoleProfile = {
  label: string;
  level: string;
  heroEyebrow: string;
  heroDescription: string;
  permissions: Permission[];
  allowedAssets: AssetKey[];
  allowedRanges: RangeKey[];
  defaultAsset: AssetKey;
  defaultRange: RangeKey;
  isolatedView?: boolean;
};

export const ROLE_PROFILES: Record<RoleKey, RoleProfile> = {
  super_admin: {
    label: "Super Admin",
    level: "Level 1 - Super Admin",
    heroEyebrow: "Executive Oversight",
    heroDescription: "Full visibility and control across every Everloft property, team, and system.",
    permissions: [
      "view_property",
      "edit_property",
      "view_financials",
      "approve_payout",
      "assign_task",
      "manage_users",
      "manage_system",
      "manage_content",
    ],
    allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
    allowedRanges: ["monthly", "quarterly", "yearly"],
    defaultAsset: "all",
    defaultRange: "monthly",
  },
  finance_admin: {
    label: "Finance Admin",
    level: "Level 2 - Department Admin",
    heroEyebrow: "Financial Operations",
    heroDescription: "Revenue, expenses, commissions, and payout cycles for the full portfolio.",
    permissions: ["view_property", "view_financials", "approve_payout"],
    allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
    allowedRanges: ["monthly", "quarterly", "yearly"],
    defaultAsset: "all",
    defaultRange: "monthly",
  },
  operations_manager: {
    label: "Operations Manager",
    level: "Level 2 - Department Admin",
    heroEyebrow: "Operations Control",
    heroDescription: "Booking flow, housekeeping assignment, and maintenance throughput across properties.",
    permissions: ["view_property", "assign_task"],
    allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
    allowedRanges: ["monthly", "quarterly", "yearly"],
    defaultAsset: "all",
    defaultRange: "monthly",
  },
  tech_admin: {
    label: "Tech Admin",
    level: "Level 2 - Department Admin",
    heroEyebrow: "Platform &amp; Access",
    heroDescription: "System health, access provisioning, and content publishing controls.",
    permissions: ["manage_users", "manage_system", "manage_content", "view_property"],
    allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
    allowedRanges: ["monthly"],
    defaultAsset: "all",
    defaultRange: "monthly",
  },
  property_manager: {
    label: "Property Manager",
    level: "Level 3 - Operational Staff",
    heroEyebrow: "Property Operations",
    heroDescription: "Day-to-day readiness, housekeeping QC, and task follow-through for your assigned properties.",
    permissions: ["view_property", "edit_property", "assign_task"],
    allowedAssets: ["marari", "kadavanthra", "wayanad"],
    allowedRanges: ["monthly"],
    defaultAsset: "marari",
    defaultRange: "monthly",
  },
  housekeeping: {
    label: "Housekeeping",
    level: "Level 3 - Operational Staff",
    heroEyebrow: "Housekeeping Console",
    heroDescription: "Your cleaning schedule, checklists, and photo verification for today's turnovers.",
    permissions: ["assign_task"],
    allowedAssets: ["marari", "kadavanthra"],
    allowedRanges: ["monthly"],
    defaultAsset: "marari",
    defaultRange: "monthly",
    isolatedView: true,
  },
  maintenance: {
    label: "Maintenance",
    level: "Level 3 - Operational Staff",
    heroEyebrow: "Maintenance Console",
    heroDescription: "Your assigned repair tickets, property access details, and expense claims.",
    permissions: ["assign_task"],
    allowedAssets: ["marari", "kadavanthra"],
    allowedRanges: ["monthly"],
    defaultAsset: "marari",
    defaultRange: "monthly",
    isolatedView: true,
  },
  guest_support: {
    label: "Guest Support",
    level: "Level 3 - Operational Staff",
    heroEyebrow: "Guest Support Desk",
    heroDescription: "Ticket queue, escalations, and guest communication across all properties.",
    permissions: ["assign_task", "manage_bookings"],
    allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
    allowedRanges: ["monthly"],
    defaultAsset: "all",
    defaultRange: "monthly",
  },
  property_owner: {
    label: "Property Owner",
    level: "Level 4 - Partner Access",
    heroEyebrow: "Owner Portal",
    heroDescription: "Revenue, bookings, and maintenance visibility for your managed property.",
    permissions: ["view_property", "view_financials", "view_only_own_data"],
    allowedAssets: ["marari"],
    allowedRanges: ["monthly", "quarterly", "yearly"],
    defaultAsset: "marari",
    defaultRange: "monthly",
  },
  guest: {
    label: "Guest",
    level: "Guest Access",
    heroEyebrow: "Your Stay",
    heroDescription: "Everything you need for your Everloft stay, in one place.",
    permissions: ["view_only_own_data"],
    allowedAssets: ["marari"],
    allowedRanges: ["monthly"],
    defaultAsset: "marari",
    defaultRange: "monthly",
    isolatedView: true,
  },
  investor: {
    label: "Investor",
    level: "Level 4 - Partner Access",
    heroEyebrow: "Investor Portal",
    heroDescription: "Portfolio performance, payouts, and long-term returns on your Everloft investment.",
    permissions: ["view_property", "view_financials", "view_only_own_data"],
    allowedAssets: ["marari"],
    allowedRanges: ["monthly", "quarterly", "yearly"],
    defaultAsset: "marari",
    defaultRange: "monthly",
  },
};

export function hasPermission(role: RoleKey, permission: Permission): boolean {
  return ROLE_PROFILES[role].permissions.includes(permission);
}

export function hasAnyPermission(role: RoleKey, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
