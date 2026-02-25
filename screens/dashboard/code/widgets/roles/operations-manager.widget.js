(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.operations_manager = {
		buildWorkspace: function () {
			return {
				title: "Operations Management Workspace",
				note: "Operations scope for booking control, housekeeping assignments, and maintenance throughput.",
				cards: [
					{ label: "Active Bookings", value: "87", note: "Across all managed listings" },
					{ label: "Turnovers Today", value: "14", note: "Check-out to check-in transitions" },
					{ label: "Open Service Issues", value: "5", note: "2 critical, 3 normal priority" }
				],
				headers: ["Ops Stream", "Owner", "Status", "Next Action"],
				rows: [
					["Property Calendar Blocks", "Ops Desk", "2 Conflicts", "Resolve overlap requests"],
					["Housekeeping Assignment", "Shift Lead", "On Track", "Close 6 pending rooms"],
					["Maintenance Queue", "Tech Team", "Backlog 5", "Escalate 2 urgent repairs"],
					["Guest Escalations", "Support", "4 Open", "Close before 6 PM"]
				],
				alerts: [
					{ type: "warning", icon: "fa-calendar-check", text: "Weekend occupancy spike requires additional housekeeping allocation." }
				],
				restrictedOverview: {
					value: "14 Turnovers",
					note: "Operational handovers scheduled today",
					report: "Ops Cycle",
					reportNote: "No financial visibility for this role"
				}
			};
		}
	};
})(window);
