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
		},
		getInvestorDashboardData: function (payload) {
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

			var formatInr = function (value) {
				return "INR " + Number(value || 0).toLocaleString("en-IN");
			};

			var generated = payload.revenueStack && payload.revenueStack.generated ? payload.revenueStack.generated : "INR 0";
			var expensesDisplay = payload.revenueStack && payload.revenueStack.expenses ? payload.revenueStack.expenses : "- INR 0";
			var maintenanceDisplay = payload.revenueStack && payload.revenueStack.maintenance ? payload.revenueStack.maintenance : "- INR 0";
			var netDisplay = payload.revenueStack && payload.revenueStack.net ? payload.revenueStack.net : "INR 0";

			var grossValue = parseInr(generated);
			var opExpenseValue = parseInr(expensesDisplay);
			var maintenanceValue = parseInr(maintenanceDisplay);
			var netValue = parseInr(netDisplay);

			if (!netValue && grossValue) {
				netValue = Math.max(0, grossValue + opExpenseValue + maintenanceValue);
			}

			var ownershipPercent = 18;
			var investorProfit = Math.round(netValue * (ownershipPercent / 100));

			var platformFeesValue = Math.round(grossValue * 0.12);
			var cleaningCostValue = Math.round(grossValue * 0.04);
			var otherExpensesValue = Math.max(0, Math.abs(opExpenseValue + maintenanceValue) - cleaningCostValue);

			var monthlyBreakdown = [
				{ label: "Gross Revenue", amount: formatInr(grossValue), note: "Total booking revenue for the selected month" },
				{ label: "Platform Fees", amount: "- " + formatInr(platformFeesValue), note: "Illustrative OTA / channel fees" },
				{ label: "Cleaning Cost", amount: "- " + formatInr(cleaningCostValue), note: "Housekeeping and turnover costs (sample)" },
				{ label: "Maintenance Cost", amount: expensesDisplay, note: "Repairs, replacements and upkeep (sample)" },
				{ label: "Other Expenses", amount: "- " + formatInr(otherExpensesValue), note: "Utilities and overheads (sample)" },
				{ label: "Net Profit", amount: formatInr(netValue), note: "Net of all illustrative expenses" },
				{ label: "Investor Share %", amount: ownershipPercent + "%", note: "Sample ownership in the selected asset" },
				{ label: "Investor Profit Amount", amount: formatInr(investorProfit), note: "Illustrative payout before any tax treatment" }
			];

			var portfolio = {
				totalProperties: 1,
				totalInvested: formatInr(2500000),
				portfolioValue: formatInr(2980000),
				monthProfit: formatInr(investorProfit || 48000),
				ytdProfit: formatInr((investorProfit || 48000) * 6),
				totalPayout: formatInr(480000)
			};

			var occupancy = {
				occupancyRate: payload.summary && payload.summary.occupancy ? payload.summary.occupancy : "—",
				totalNights: payload.summary && payload.summary.nights ? payload.summary.nights : "—",
				adr: payload.summary && payload.summary.adr ? payload.summary.adr : formatInr(7420),
				averageStay: "3.2 nights (sample)",
				upcomingBookings: "4 upcoming stays (sample)",
				revenueTrend: [
					{ month: "Sep", revenue: Math.round(grossValue * 0.82) },
					{ month: "Oct", revenue: Math.round(grossValue * 0.91) },
					{ month: "Nov", revenue: Math.round(grossValue * 0.96) },
					{ month: "Dec", revenue: Math.round(grossValue * 1.03) },
					{ month: "Jan", revenue: grossValue },
					{ month: "Feb", revenue: Math.round(grossValue * 1.05) }
				]
			};

			var payouts = {
				bankDetails: "HDFC Bank • **** 4456 • Kochi Branch (sample)",
				history: [
					{ month: "Jan 2026", netProfit: formatInr(netValue || 280000), share: formatInr(investorProfit || 50400), status: "Paid", paidDate: "05 Feb 2026 (sample)" },
					{ month: "Dec 2025", netProfit: formatInr(Math.round((netValue || 260000) * 0.96)), share: formatInr(Math.round((investorProfit || 48600) * 0.96)), status: "Paid", paidDate: "05 Jan 2026 (sample)" },
					{ month: "Nov 2025", netProfit: formatInr(Math.round((netValue || 240000) * 0.93)), share: formatInr(Math.round((investorProfit || 45600) * 0.93)), status: "Paid", paidDate: "05 Dec 2025 (sample)" }
				]
			};

			var property = {
				name: payload.profile && payload.profile.label ? payload.profile.label : "Everloft Marari Cove (sample)",
				location: "Kerala, India (sample)",
				investmentValue: portfolio.totalInvested,
				ownership: ownershipPercent + "%",
				investmentDate: "15 Mar 2024 (sample)",
				coInvestors: "Other investors hold 82% combined (sample)."
			};

			var health = {
				openIssues: 1,
				lastInspection: "Last week (sample)",
				upgrades: "Solar water heating and linen refresh completed recently (sample).",
				cleaningScore: "4.8 / 5 (sample)",
				complaints: 0,
				readinessNote: "Property maintained in guest-ready state with preventive checks (sample)."
			};

			var guest = {
				averageRating: "4.7 / 5 (sample)",
				repeatPercent: "32% repeat guest share (sample)",
				complaintCount: 1,
				reviews: [
					{ label: "Family stay", note: "“Great location, very clean, kids loved the space.”" },
					{ label: "Remote worker", note: "“Wi-Fi was stable all week. Perfect for work + leisure.”" },
					{ label: "Long-stay guest", note: "“Felt like a second home. Will return next quarter.”" }
				]
			};

			var longTerm = {
				totalProfit: formatInr(480000),
				roiPercent: "19.2%",
				breakEven: "Recovered ~36% of initial capital (sample).",
				yoyGrowth: "+14.5% YoY net profit growth (sample)."
			};

			return {
				portfolio: portfolio,
				monthlyBreakdown: monthlyBreakdown,
				occupancy: occupancy,
				payouts: payouts,
				property: property,
				health: health,
				guest: guest,
				longTerm: longTerm
			};
		}
	};
})(window);
