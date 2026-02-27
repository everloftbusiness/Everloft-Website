(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.property_owner = {
		buildWorkspace: function (payload) {
			return {
				title: "Property Owner Workspace",
				note: "Own-property bookings, revenue summary, commission impact, and maintenance snapshots.",
				cards: [
					{ label: "Booked Nights", value: payload.summary.nights, note: "Current selected cycle" },
					{ label: "Net Revenue", value: payload.revenueStack.net, note: "After operations and reserve" },
					{ label: "Commission Applied", value: "12%", note: "As per management agreement" }
				],
				headers: ["Owner Feed", "Period", "Status", "Next Action"],
				rows: [
					["Monthly Revenue Summary", payload.overview.latestReport, "Published", "Download statement"],
					["Booking Calendar", payload.profile.label, "Healthy", "Review blocked dates"],
					["Guest Reviews", "Current Cycle", "4.7 / 5", "Close response drafts"],
					["Maintenance Updates", "Current Cycle", "2 Open", "Track closure ETA"]
				],
				alerts: [
					{ type: "info", icon: "fa-home", text: "Owner dashboard is restricted to your managed property data only." }
				],
				restrictedOverview: {
					value: payload.revenueStack.net,
					note: "Owner net summary for the selected cycle",
					report: payload.overview.latestReport,
					reportNote: "Own data + commission view"
				}
			};
		},
		getOwnerDashboardData: function (payload) {
			var generated = payload.revenueStack && payload.revenueStack.generated ? payload.revenueStack.generated : "INR 0";
			var expensesDisplay = payload.revenueStack && payload.revenueStack.expenses ? payload.revenueStack.expenses : "- INR 0";
			var maintenanceDisplay = payload.revenueStack && payload.revenueStack.maintenance ? payload.revenueStack.maintenance : "- INR 0";
			var netDisplay = payload.revenueStack && payload.revenueStack.net ? payload.revenueStack.net : "INR 0";

			// Parse numeric value from formatted INR strings like "INR 8,42,000" or "- INR 2,18,000"
			var parseInr = function (text) {
				var cleaned = String(text || "")
					.replace(/[^\d\-]/g, "")
					.trim();
				var parsed = Number(cleaned || "0");
				if (Number.isNaN(parsed)) {
					return 0;
				}
				return parsed;
			};

			var grossValue = parseInr(generated);
			var opExpenseValue = parseInr(expensesDisplay);
			var maintenanceValue = parseInr(maintenanceDisplay);
			var netValue = parseInr(netDisplay);

			if (!netValue && grossValue) {
				netValue = Math.max(0, grossValue + opExpenseValue + maintenanceValue);
			}

			var platformFeesValue = Math.round(grossValue * 0.12);
			var cleaningChargesValue = Math.round(grossValue * 0.04);
			var utilitiesValue = Math.round(grossValue * 0.03);
			var commissionValue = Math.round(grossValue * 0.12);

			var ownerPayoutValue = Math.max(0, grossValue + opExpenseValue + maintenanceValue - platformFeesValue - cleaningChargesValue - utilitiesValue - commissionValue);

			var formatNumber = function (value) {
				return "INR " + Number(value || 0).toLocaleString("en-IN");
			};

			var revenueBreakdown = [
				{ key: "booking_revenue", label: "Booking Revenue", amount: formatNumber(grossValue), note: "Total confirmed revenue for the selected period" },
				{ key: "platform_fees", label: "Platform Fees", amount: "- " + formatNumber(platformFeesValue), note: "Illustrative OTA / channel commissions" },
				{ key: "cleaning_charges", label: "Cleaning Charges", amount: "- " + formatNumber(cleaningChargesValue), note: "Housekeeping, linen and turnover costs" },
				{ key: "maintenance_expenses", label: "Maintenance Expenses", amount: expensesDisplay, note: "Repairs, upkeep and consumables (illustrative)" },
				{ key: "utilities", label: "Utilities", amount: "- " + formatNumber(utilitiesValue), note: "Electricity, water, broadband and other running costs" },
				{ key: "everloft_commission", label: "Everloft Commission", amount: "- " + formatNumber(commissionValue), note: "Management commission for the property" },
				{ key: "owner_payout", label: "Final Owner Payout", amount: formatNumber(ownerPayoutValue), note: "Indicative net amount after all deductions" }
			];

			var monthlySeries = [
				{ label: "Oct", revenue: Math.round(grossValue * 0.82), expenses: Math.round(Math.abs(opExpenseValue + maintenanceValue) * 0.8) },
				{ label: "Nov", revenue: Math.round(grossValue * 0.94), expenses: Math.round(Math.abs(opExpenseValue + maintenanceValue) * 0.9) },
				{ label: "Dec", revenue: Math.round(grossValue * 1.02), expenses: Math.round(Math.abs(opExpenseValue + maintenanceValue) * 1.0) },
				{ label: payload.overview && payload.overview.latestReport ? payload.overview.latestReport : "Current", revenue: grossValue, expenses: Math.abs(opExpenseValue + maintenanceValue) }
			];

			var yearlySeries = [
				{ year: "2023", revenue: Math.round(grossValue * 6.2), expenses: Math.round(Math.abs(opExpenseValue + maintenanceValue) * 6.1) },
				{ year: "2024", revenue: Math.round(grossValue * 7.1), expenses: Math.round(Math.abs(opExpenseValue + maintenanceValue) * 6.8) },
				{ year: "2025", revenue: Math.round(grossValue * 8.0), expenses: Math.round(Math.abs(opExpenseValue + maintenanceValue) * 7.4) }
			];

			var bookingCalendar = {
				monthLabel: "Current Month (sample)",
				days: [
					{ day: 1, status: "booked" },
					{ day: 2, status: "booked" },
					{ day: 3, status: "owner_block" },
					{ day: 4, status: "booked" },
					{ day: 5, status: "blocked_platform" },
					{ day: 6, status: "booked" },
					{ day: 7, status: "booked" },
					{ day: 8, status: "maintenance" },
					{ day: 9, status: "maintenance" },
					{ day: 10, status: "booked" },
					{ day: 11, status: "booked" },
					{ day: 12, status: "booked" },
					{ day: 13, status: "booked" },
					{ day: 14, status: "booked" },
					{ day: 15, status: "owner_block" },
					{ day: 16, status: "owner_block" },
					{ day: 17, status: "booked" },
					{ day: 18, status: "booked" },
					{ day: 19, status: "booked" },
					{ day: 20, status: "booked" },
					{ day: 21, status: "booked" },
					{ day: 22, status: "blocked_platform" },
					{ day: 23, status: "blocked_platform" },
					{ day: 24, status: "booked" },
					{ day: 25, status: "booked" },
					{ day: 26, status: "booked" },
					{ day: 27, status: "booked" },
					{ day: 28, status: "booked" },
					{ day: 29, status: "booked" },
					{ day: 30, status: "booked" }
				]
			};

			var bookings = [
				{
					guestLabel: "Guest A",
					dates: "03–05 (2 nights)",
					platform: "Airbnb",
					amount: formatNumber(Math.round(grossValue * 0.06) || 42000),
					status: "Completed",
					rating: "4.9",
					notes: "Weekend leisure stay; repeat guest."
				},
				{
					guestLabel: "Corporate Booking",
					dates: "09–12 (3 nights)",
					platform: "Direct",
					amount: formatNumber(Math.round(grossValue * 0.09) || 68000),
					status: "Completed",
					rating: "4.8",
					notes: "Team offsite; early check-in arranged."
				},
				{
					guestLabel: "Guest B",
					dates: "16–18 (2 nights)",
					platform: "Booking.com",
					amount: formatNumber(Math.round(grossValue * 0.05) || 36000),
					status: "Upcoming",
					rating: "—",
					notes: "Special request for late checkout."
				},
				{
					guestLabel: "Long Stay Guest",
					dates: "20–27 (7 nights)",
					platform: "Direct",
					amount: formatNumber(Math.round(grossValue * 0.22) || 180000),
					status: "In-house",
					rating: "—",
					notes: "Work-from-anywhere booking; monthly arrangement."
				}
			];

			var maintenance = {
				openIssues: 2,
				completedThisMonth: 5,
				upcoming: 1,
				rows: [
					{ type: "Plumbing check", priority: "Medium", status: "Scheduled", targetDate: "12th (sample)" },
					{ type: "AC servicing", priority: "High", status: "In queue", targetDate: "18th (sample)" },
					{ type: "Exterior repaint", priority: "Low", status: "Planned", targetDate: "Next month (sample)" }
				],
				photos: [
					"Sample before/after maintenance photos will appear here when integrated with real tasks."
				]
			};

			var housekeeping = {
				cleaningStatus: "Completed for current checkouts",
				lastInspection: "Yesterday (sample)",
				readiness: "Ready for next guest",
				readinessTone: "ready",
				note: "Housekeeping checks and readiness states here are illustrative samples."
			};

			var payouts = {
				currentAmount: formatNumber(ownerPayoutValue),
				nextDate: payload.payout && payload.payout.nextCycle ? payload.payout.nextCycle : "05 of next month (sample)",
				history: [
					{ period: "Jan 2026", amount: formatNumber(ownerPayoutValue || 566000), date: "05 Feb 2026 (sample)", reference: "PDF" },
					{ period: "Dec 2025", amount: formatNumber(Math.round(ownerPayoutValue * 0.94) || 534000), date: "05 Jan 2026 (sample)", reference: "PDF" },
					{ period: "Nov 2025", amount: formatNumber(Math.round(ownerPayoutValue * 0.91) || 512000), date: "05 Dec 2025 (sample)", reference: "PDF" }
				],
				bankDetails: "HDFC Bank • **** 1024 • Kochi Branch (sample)"
			};

			var reviews = {
				averageRating: "4.7 / 5",
				items: [
					{ label: "Guest (family stay)", note: "“Very clean, responsive support, and great location.”" },
					{ label: "Guest (work trip)", note: "“Wi-Fi and workspace were reliable for a full week.”" },
					{ label: "Direct repeat guest", note: "“Second stay here – consistency and cleanliness are impressive.”" }
				]
			};

			var analytics = {
				averageNightlyRate: payload.summary && payload.summary.adr ? payload.summary.adr : formatNumber(7200),
				averageStayDuration: "3.4 nights (sample)",
				seasonalTrend: "Higher weekend demand, stable mid-week occupancy.",
				vsLastMonth: "+8.2% net earnings vs last month (sample)"
			};

			var overview = {
				totalBookings: bookings.length,
				occupancyRate: payload.summary && payload.summary.occupancy ? payload.summary.occupancy : "—",
				grossRevenue: generated,
				totalExpenses: expensesDisplay,
				netEarnings: netDisplay,
				payoutStatus: payload.payout && payload.payout.status ? payload.payout.status : "Illustrative",
				payoutNote: "Payout state here is illustrative; final status will reflect finance approvals."
			};

			return {
				overview: overview,
				revenueBreakdown: revenueBreakdown,
				monthlySeries: monthlySeries,
				yearlySeries: yearlySeries,
				bookingCalendar: bookingCalendar,
				bookings: bookings,
				maintenance: maintenance,
				housekeeping: housekeeping,
				payouts: payouts,
				reviews: reviews,
				analytics: analytics
			};
		}
	};
})(window);
