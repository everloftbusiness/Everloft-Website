(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.guest_support = {
		buildWorkspace: function () {
			return {
				title: "Guest Support Workspace",
				note: "Support queue triage for guest requests, escalation management, and response SLA tracking.",
				cards: [
					{ label: "Open Tickets", value: "13", note: "Guest and booking support issues" },
					{ label: "SLA Compliance", value: "94%", note: "Resolved within SLA window" },
					{ label: "Escalations", value: "3", note: "Requires manager review" }
				],
				headers: ["Support Queue", "Owner", "Status", "Next Action"],
				rows: [
					["Pre-arrival Requests", "Support Desk", "5 Open", "Send confirmations"],
					["Check-in Issues", "Guest Support", "2 Escalated", "Coordinate with operations"],
					["Refund Requests", "Finance Liaison", "In Review", "Update guest timeline"],
					["Post-stay Feedback", "Support Desk", "Ongoing", "Close unresolved threads"]
				],
				alerts: [
					{ type: "warning", icon: "fa-headset", text: "Three guest escalations are nearing SLA breach threshold." }
				],
				restrictedOverview: {
					value: "13 Tickets",
					note: "Support queue currently active",
					report: "Support Queue",
					reportNote: "Financial data hidden"
				}
			};
		}
	};
})(window);
