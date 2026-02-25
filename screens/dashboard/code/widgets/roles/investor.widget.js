(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.investor = {
		buildWorkspace: function (payload) {
			return {
				title: "Investor Workspace",
				note: "Investor-level transparency with revenue, expense, occupancy, and payout visibility.",
				cards: [
					{ label: "Ownership Share", value: "18.0%", note: "In selected property scope" },
					{ label: "Net Profit", value: payload.revenueStack.net, note: "Current selected cycle" },
					{ label: "Occupancy", value: payload.summary.occupancy, note: "Current cycle blended occupancy" }
				],
				headers: ["Investor Feed", "Period", "Status", "Next Action"],
				rows: [
					["Performance Report", payload.overview.latestReport, "Published", "Download statement"],
					["Payout Status", payload.payout.nextCycle, payload.payout.status, "Track settlement"],
					["Expense Breakdown", "Current Cycle", "Available", "Review line items"],
					["Upcoming Bookings", payload.profile.label, "Visible", "Monitor occupancy trend"]
				],
				alerts: [
					{ type: "info", icon: "fa-chart-line", text: "Investor access is restricted to your own property and payout records." }
				],
				restrictedOverview: {
					value: payload.summary.revenue,
					note: "Own-investment cycle performance",
					report: payload.overview.latestReport,
					reportNote: "Investor transparency snapshot"
				}
			};
		}
	};
})(window);
