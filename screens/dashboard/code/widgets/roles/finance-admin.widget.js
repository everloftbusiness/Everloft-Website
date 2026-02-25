(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.finance_admin = {
		buildWorkspace: function (payload) {
			return {
				title: "Finance Operations Workspace",
				note: "Finance-admin scope: revenue, expense, payout, and commission workflows without system settings control.",
				cards: [
					{ label: "Revenue Recorded", value: payload.summary.total, note: "Current selected period" },
					{ label: "Expense Entries", value: "46", note: "Entries posted in this cycle" },
					{ label: "Payout Batch", value: payload.payout.status, note: "Settlement state for next run" }
				],
				headers: ["Ledger Stream", "Owner", "Status", "Next Action"],
				rows: [
					["Monthly Revenue Ledger", "Finance Ops", "Reconciled", "Publish final workbook"],
					["Expense Validation", "Accounts", "7 In Review", "Close pending invoices"],
					["Commission Calculation", "Finance Ops", "Prepared", "Run approval check"],
					["Payout Register", "Treasury", "Scheduled", "Release on cycle date"]
				],
				alerts: [
					{ type: "warning", icon: "fa-wallet", text: "2 payout lines flagged for manual finance review before release." }
				],
				restrictedOverview: {
					value: payload.summary.revenue,
					note: "Finance-monitored gross for active scope",
					report: payload.overview.latestReport,
					reportNote: "Finance workbook refreshed"
				}
			};
		}
	};
})(window);
