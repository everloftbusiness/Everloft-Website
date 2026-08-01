// Ported from screens/dashboard/code/widgets/roles/*.widget.js (buildWorkspace / getXDashboardData).
import type { RoleKey } from "@/lib/dashboard-roles";
import type { DashboardPayload } from "@/lib/dashboard/mock-engine";
import { formatCurrency } from "@/lib/format";

export type WorkspaceCard = { label: string; value: string; note: string };
export type WorkspaceAlert = { type: "info" | "warning" | "critical"; icon: string; text: string };
export type Workspace = {
  title: string;
  note: string;
  cards: WorkspaceCard[];
  headers: string[];
  rows: string[][];
  alerts: WorkspaceAlert[];
  restrictedOverview: { value: string; note: string; report: string; reportNote: string };
};

export function buildWorkspace(role: RoleKey, payload: DashboardPayload): Workspace {
  switch (role) {
    case "super_admin":
      return {
        title: "Executive Command Center",
        note: "Portfolio-wide oversight across finance, operations, and platform access.",
        cards: [
          { label: "Active Access Roles", value: "11", note: "Every role currently provisioned" },
          { label: "Portfolio Gross", value: payload.summary.total, note: "Selected cycle, all properties" },
          { label: "Payout Approvals", value: "3 Pending", note: "Awaiting finance sign-off" },
        ],
        headers: ["Control Area", "Owner", "Status", "Next Action"],
        rows: [
          ["Revenue Share Policy", "Finance Team", "Review Required", "Approve v2.4 matrix"],
          ["Investor Onboarding Queue", "Investor Relations", "5 Pending", "Complete KYC verification"],
          ["Commission Rules", "Core Admin", "Locked", "Open March cycle"],
          ["New Asset Onboarding", "Operations", "In Progress", "Finalize Wayanad checklist"],
        ],
        alerts: [
          { type: "critical", icon: "fa-user-shield", text: "3 high-privilege role changes are waiting for final approval." },
        ],
        restrictedOverview: {
          value: payload.summary.total,
          note: "Portfolio gross for the selected cycle",
          report: payload.overview.latestReport,
          reportNote: "Full financial visibility",
        },
      };
    case "finance_admin":
      return {
        title: "Finance Operations Workspace",
        note: "Revenue reconciliation, expense review, and payout release for the full portfolio.",
        cards: [
          { label: "Revenue Recorded", value: payload.summary.total, note: "Selected cycle" },
          { label: "Expense Entries", value: "46", note: "Logged this cycle" },
          { label: "Payout Batch", value: payload.payout.status, note: "Current settlement batch" },
        ],
        headers: ["Ledger Stream", "Owner", "Status", "Next Action"],
        rows: [
          ["Monthly Revenue Ledger", "Finance Ops", "Reconciled", "Publish final workbook"],
          ["Expense Validation", "Accounts", "7 In Review", "Close pending invoices"],
          ["Commission Calculation", "Finance Ops", "Prepared", "Run approval check"],
          ["Payout Register", "Treasury", "Scheduled", "Release on cycle date"],
        ],
        alerts: [
          { type: "warning", icon: "fa-wallet", text: "2 payout lines flagged for manual finance review before release." },
        ],
        restrictedOverview: {
          value: payload.summary.total,
          note: "Revenue recorded this cycle",
          report: payload.overview.latestReport,
          reportNote: "Finance visibility only",
        },
      };
    case "guest_support":
      return {
        title: "Guest Support Workspace",
        note: "Ticket queue, escalations, and guest communication across all properties.",
        cards: [
          { label: "Open Tickets", value: "13", note: "Across all properties" },
          { label: "SLA Compliance", value: "94%", note: "Rolling 7-day average" },
          { label: "Escalations", value: "3", note: "Require manager attention" },
        ],
        headers: ["Support Queue", "Owner", "Status", "Next Action"],
        rows: [
          ["Pre-arrival Requests", "Support Desk", "5 Open", "Send confirmations"],
          ["Check-in Issues", "Guest Support", "2 Escalated", "Coordinate with operations"],
          ["Refund Requests", "Finance Liaison", "In Review", "Update guest timeline"],
          ["Post-stay Feedback", "Support Desk", "Ongoing", "Close unresolved threads"],
        ],
        alerts: [
          { type: "warning", icon: "fa-headset", text: "Three guest escalations are nearing SLA breach threshold." },
        ],
        restrictedOverview: {
          value: "13 Tickets",
          note: "Open support tickets",
          report: "Support Cycle",
          reportNote: "No financial visibility for this role",
        },
      };
    case "property_manager":
      return {
        title: "Property Manager Workspace",
        note: "Day-to-day readiness, housekeeping QC, and task follow-through.",
        cards: [
          { label: "Assigned Properties", value: "2", note: "Marari Cove and Wayanad Ridge" },
          { label: "Open Tasks", value: "18", note: "Across assigned properties" },
          { label: "Task Completion", value: "88%", note: "Rolling 7-day average" },
        ],
        headers: ["Task Group", "Owner", "Status", "Next Action"],
        rows: [
          ["Check-in Readiness", "Site Team", "6/7 Ready", "Close Wayanad villa prep"],
          ["Housekeeping QC", "Property Manager", "On Track", "Complete room audit run"],
          ["Minor Repairs", "Maintenance", "3 Open", "Close before weekend demand"],
          ["Guest Requests", "Support", "2 Open", "Follow up within SLA"],
        ],
        alerts: [
          { type: "warning", icon: "fa-tools", text: "Three turnaround tasks are due in the next 4 hours." },
        ],
        restrictedOverview: {
          value: "18 Open Tasks",
          note: "Across assigned properties",
          report: "Ops Cycle",
          reportNote: "No financial visibility for this role",
        },
      };
    case "tech_admin":
      return {
        title: "Platform Access Workspace",
        note: "System health, access provisioning, and content publishing controls.",
        cards: [
          { label: "User Access Requests", value: "9", note: "Awaiting approval" },
          { label: "Uptime (30d)", value: "99.94%", note: "Platform availability" },
          { label: "Content Jobs", value: "12", note: "In the publishing queue" },
        ],
        headers: ["Platform Area", "Owner", "Status", "Next Action"],
        rows: [
          ["Role Access Queue", "Tech Admin", "9 Pending", "Approve least-privilege requests"],
          ["Dashboard Build", "Web Ops", "Healthy", "Run release smoke test"],
          ["Content Pipeline", "Content Team", "In Progress", "Publish investor update"],
          ["Security Logs", "Tech Admin", "Stable", "Review anomaly digest"],
        ],
        alerts: [
          { type: "info", icon: "fa-user-lock", text: "New onboarding wave requires role provisioning for 4 staff accounts." },
        ],
        restrictedOverview: {
          value: "9 Requests",
          note: "Pending access provisioning",
          report: "Platform Cycle",
          reportNote: "No financial visibility for this role",
        },
      };
    case "operations_manager":
      return {
        title: "Operations Management Workspace",
        note: "Operations scope for booking control, housekeeping assignments, and maintenance throughput.",
        cards: [
          { label: "Active Bookings", value: "87", note: "Across all managed listings" },
          { label: "Turnovers Today", value: "14", note: "Check-out to check-in transitions" },
          { label: "Open Service Issues", value: "5", note: "2 critical, 3 normal priority" },
        ],
        headers: ["Ops Stream", "Owner", "Status", "Next Action"],
        rows: [
          ["Property Calendar Blocks", "Ops Desk", "2 Conflicts", "Resolve overlap requests"],
          ["Housekeeping Assignment", "Shift Lead", "On Track", "Close 6 pending rooms"],
          ["Maintenance Queue", "Tech Team", "Backlog 5", "Escalate 2 urgent repairs"],
          ["Guest Escalations", "Support", "4 Open", "Close before 6 PM"],
        ],
        alerts: [
          { type: "warning", icon: "fa-calendar-check", text: "Weekend occupancy spike requires additional housekeeping allocation." },
        ],
        restrictedOverview: {
          value: "14 Turnovers",
          note: "Operational handovers scheduled today",
          report: "Ops Cycle",
          reportNote: "No financial visibility for this role",
        },
      };
    case "property_owner":
      return {
        title: "Property Owner Workspace",
        note: "Own-property bookings, revenue summary, commission impact, and maintenance snapshots.",
        cards: [
          { label: "Booked Nights", value: String(payload.summary.nights), note: "Current selected cycle" },
          { label: "Net Revenue", value: payload.revenueStack.net, note: "After operations and reserve" },
          { label: "Commission Applied", value: "12%", note: "As per management agreement" },
        ],
        headers: ["Owner Feed", "Period", "Status", "Next Action"],
        rows: [
          ["Monthly Revenue Summary", payload.overview.latestReport, "Published", "Download statement"],
          ["Booking Calendar", payload.profile.label, "Healthy", "Review blocked dates"],
          ["Guest Reviews", "Current Cycle", "4.7 / 5", "Close response drafts"],
          ["Maintenance Updates", "Current Cycle", "2 Open", "Track closure ETA"],
        ],
        alerts: [
          { type: "info", icon: "fa-home", text: "Owner dashboard is restricted to your managed property data only." },
        ],
        restrictedOverview: {
          value: payload.revenueStack.net,
          note: "Owner net summary for the selected cycle",
          report: payload.overview.latestReport,
          reportNote: "Own data + commission view",
        },
      };
    case "investor":
      return {
        title: "Investor Workspace",
        note: "Ownership share, payouts, and occupancy for your invested property.",
        cards: [
          { label: "Ownership Share", value: "18.0%", note: "Of net property profit" },
          { label: "Net Profit", value: payload.revenueStack.net, note: "Selected cycle" },
          { label: "Occupancy", value: payload.summary.occupancyLabel, note: "Selected cycle" },
        ],
        headers: ["Investor Feed", "Period", "Status", "Next Action"],
        rows: [
          ["Performance Report", payload.overview.latestReport, "Published", "Review payout breakdown"],
          ["Payout Status", payload.payout.status, "On Schedule", "Confirm bank details"],
          ["Expense Breakdown", "Current Cycle", "Reviewed", "No action required"],
          ["Upcoming Bookings", "Current Cycle", "4 Upcoming", "Monitor occupancy"],
        ],
        alerts: [
          { type: "info", icon: "fa-chart-pie", text: "Investor dashboard is restricted to your own portfolio data." },
        ],
        restrictedOverview: {
          value: payload.revenueStack.net,
          note: "Net profit for the selected cycle",
          report: payload.overview.latestReport,
          reportNote: "Own data + ownership share view",
        },
      };
    default:
      return {
        title: "Workspace",
        note: "",
        cards: [],
        headers: [],
        rows: [],
        alerts: [],
        restrictedOverview: { value: "—", note: "", report: "", reportNote: "" },
      };
  }
}

// Investor-specific derived dashboard (screens/dashboard/code/widgets/roles/investor.widget.js).
export function getInvestorDashboardData(payload: DashboardPayload) {
  const ownershipPercent = 18;
  const netValue = payload.revenueStack.netValue;
  const investorProfit = Math.round(netValue * (ownershipPercent / 100));
  const grossValue = payload.revenueStack.generatedValue;

  const monthlyBreakdown = [
    { label: "Gross Revenue", amount: formatCurrency(grossValue), note: "Total confirmed revenue for the selected period" },
    { label: "Platform Fees", amount: `- ${formatCurrency(Math.round(grossValue * 0.12))}`, note: "Illustrative OTA / channel fees (sample)" },
    { label: "Cleaning Cost", amount: `- ${formatCurrency(Math.round(grossValue * 0.04))}`, note: "Housekeeping and turnover costs (sample)" },
    { label: "Maintenance Cost", amount: payload.revenueStack.maintenance, note: "Repairs and upkeep (sample)" },
    { label: "Net Profit", amount: formatCurrency(netValue), note: "After all deductions" },
    { label: "Investor Share %", amount: `${ownershipPercent}%`, note: "As per investment agreement" },
    { label: "Investor Profit Amount", amount: formatCurrency(investorProfit), note: "Illustrative payout before any tax treatment" },
  ];

  return {
    portfolio: {
      totalProperties: 1,
      totalInvested: formatCurrency(2500000),
      portfolioValue: formatCurrency(2980000),
      monthProfit: formatCurrency(investorProfit || 48000),
      ytdProfit: formatCurrency((investorProfit || 48000) * 6),
      totalPayout: formatCurrency(480000),
    },
    monthlyBreakdown,
    occupancy: {
      occupancyRate: payload.summary.occupancyLabel,
      totalNights: payload.summary.nightsLabel,
      adr: payload.summary.adrLabel,
      averageStay: "3.2 nights (sample)",
      upcomingBookings: "4 upcoming stays (sample)",
    },
    payouts: {
      bankDetails: "HDFC Bank • **** 4456 • Kochi Branch (sample)",
      history: [
        { period: "Jan 2026", amount: formatCurrency(investorProfit), status: "Paid" },
        { period: "Dec 2025", amount: formatCurrency(Math.round(investorProfit * 0.96)), status: "Paid" },
        { period: "Nov 2025", amount: formatCurrency(Math.round(investorProfit * 0.93 * 0.96)), status: "Paid" },
      ],
    },
    property: {
      name: payload.profile.label || "Everloft Marari Cove (sample)",
      location: "Kerala, India (sample)",
      investmentValue: formatCurrency(2500000),
      ownership: `${ownershipPercent}%`,
      investmentDate: "15 Mar 2024 (sample)",
      coInvestors: "Other investors hold 82% combined (sample).",
    },
    health: {
      openIssues: 1,
      lastInspection: "Last week (sample)",
      upgrades: "Solar water heating and linen refresh completed recently (sample).",
      cleaningScore: "4.8 / 5 (sample)",
      complaints: 0,
    },
    guestPerformance: {
      averageRating: "4.7 / 5 (sample)",
      repeatPercent: "32% repeat guest share (sample)",
      complaintCount: 1,
      reviews: [
        { label: "Family stay", note: "“Spotless villa, wonderful hosts. Will return.”" },
        { label: "Remote worker", note: "“Fast WiFi and a quiet workspace made a two-week stay easy.”" },
        { label: "Long-stay guest", note: "“Housekeeping was consistent throughout our stay.”" },
      ],
    },
    longTerm: {
      totalProfit: formatCurrency(480000),
      roiPercent: "19.2%",
      breakEven: "Recovered ~36% of initial capital (sample).",
      yoyGrowth: "+14.5% YoY net profit growth (sample).",
    },
  };
}

// Property owner-specific derived dashboard (property-owner.widget.js).
export function getOwnerDashboardData(payload: DashboardPayload) {
  const grossValue = payload.revenueStack.generatedValue;
  const opExpenseValue = payload.revenueStack.expensesValue;
  const maintenanceValue = payload.revenueStack.maintenanceValue;

  const platformFeesValue = Math.round(grossValue * 0.12);
  const cleaningChargesValue = Math.round(grossValue * 0.04);
  const utilitiesValue = Math.round(grossValue * 0.03);
  const commissionValue = Math.round(grossValue * 0.12);
  const ownerPayoutValue = Math.max(
    0,
    grossValue + opExpenseValue + maintenanceValue - platformFeesValue - cleaningChargesValue - utilitiesValue - commissionValue
  );

  return {
    revenueBreakdown: [
      { label: "Booking Revenue", amount: formatCurrency(grossValue), note: "Total confirmed revenue for the selected period" },
      { label: "Platform Fees", amount: `- ${formatCurrency(platformFeesValue)}`, note: "Illustrative OTA / channel commissions" },
      { label: "Cleaning Charges", amount: `- ${formatCurrency(cleaningChargesValue)}`, note: "Housekeeping, linen and turnover costs" },
      { label: "Maintenance Expenses", amount: payload.revenueStack.maintenance, note: "Repairs, upkeep and consumables (illustrative)" },
      { label: "Utilities", amount: `- ${formatCurrency(utilitiesValue)}`, note: "Electricity, water, broadband and other running costs" },
      { label: "Everloft Commission", amount: `- ${formatCurrency(commissionValue)}`, note: "Management commission for the property" },
      { label: "Owner Payout", amount: formatCurrency(ownerPayoutValue), note: "Indicative net amount after all deductions" },
    ],
    bookings: [
      { guestLabel: "Guest A", dates: "03–05 (2 nights)", platform: "Airbnb", amount: formatCurrency(Math.round(grossValue * 0.06) || 42000), status: "Completed", rating: "4.9", notes: "Weekend leisure stay; repeat guest." },
      { guestLabel: "Guest B", dates: "10–14 (4 nights)", platform: "Direct", amount: formatCurrency(Math.round(grossValue * 0.11) || 78000), status: "Upcoming", rating: "—", notes: "Booked directly via Everloft site." },
      { guestLabel: "Guest C", dates: "18–19 (1 night)", platform: "Booking.com", amount: formatCurrency(Math.round(grossValue * 0.03) || 21000), status: "In-house", rating: "—", notes: "Short business stay." },
      { guestLabel: "Guest D", dates: "24–27 (3 nights)", platform: "Airbnb", amount: formatCurrency(Math.round(grossValue * 0.08) || 56000), status: "Completed", rating: "4.8", notes: "Family trip, repeat guest." },
    ],
    maintenance: {
      openIssues: 2,
      completedThisMonth: 5,
      upcoming: 1,
      rows: [
        { type: "Plumbing check", priority: "Medium", status: "Scheduled", targetDate: "12th (sample)" },
        { type: "AC servicing", priority: "Low", status: "Scheduled", targetDate: "20th (sample)" },
      ],
    },
    housekeeping: {
      cleaningStatus: "Completed for current checkouts",
      lastInspection: "Yesterday (sample)",
      readiness: "Ready for next guest",
    },
    payouts: {
      currentAmount: formatCurrency(ownerPayoutValue),
      nextDate: "05 of next month (sample)",
      bankDetails: "HDFC Bank • **** 1024 • Kochi Branch (sample)",
      history: [
        { period: "Jan 2026", amount: formatCurrency(ownerPayoutValue), date: "05 Jan 2026" },
        { period: "Dec 2025", amount: formatCurrency(Math.round(ownerPayoutValue * 0.94) || 534000), date: "05 Dec 2025" },
        { period: "Nov 2025", amount: formatCurrency(Math.round(ownerPayoutValue * 0.91) || 512000), date: "05 Nov 2025" },
      ],
    },
    reviews: {
      averageRating: "4.7 / 5",
      items: [
        { label: "Guest A", note: "“Beautifully kept property, everything felt considered.”" },
        { label: "Guest D", note: "“Our second stay — same excellent standard as the first.”" },
        { label: "Guest C", note: "“Quiet, clean, and easy check-in.”" },
      ],
    },
    analytics: {
      averageNightlyRate: payload.summary.adrLabel,
      averageStayDuration: "3.4 nights (sample)",
      vsLastMonth: "+8.2% net earnings vs last month (sample)",
    },
  };
}
