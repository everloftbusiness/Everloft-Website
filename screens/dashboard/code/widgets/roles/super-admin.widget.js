(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.super_admin = {
		buildWorkspace: function (payload) {
			return {
				title: "Executive Command Center",
				note: "Founder-level control with full authority across users, finance approvals, and system operations.",
				cards: [
					{ label: "Active Access Roles", value: "11", note: "Department + staff + external roles live" },
					{ label: "Portfolio Gross", value: payload.summary.total, note: "Aggregated across all monitored properties" },
					{ label: "Payout Approvals", value: "3 Pending", note: "Awaiting final super-admin sign-off" }
				],
				headers: ["Control Area", "Owner", "Status", "Next Action"],
				rows: [
					["Revenue Share Policy", "Finance Team", "Review Required", "Approve v2.4 matrix"],
					["Investor Onboarding Queue", "Investor Relations", "5 Pending", "Complete KYC verification"],
					["Commission Rules", "Core Admin", "Locked", "Open March cycle"],
					["New Asset Onboarding", "Operations", "In Progress", "Finalize Wayanad checklist"]
				],
				alerts: [
					{ type: "critical", icon: "fa-user-shield", text: "3 high-privilege role changes are waiting for final approval." }
				],
				restrictedOverview: {
					value: "Control Matrix Active",
					note: "System governance and cross-team controls",
					report: "Admin Console",
					reportNote: "Policy and access model snapshot"
				}
			};
		}
	};
})(window);
