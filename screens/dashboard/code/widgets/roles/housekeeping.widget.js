(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.housekeeping = {
		buildWorkspace: function () {
			return {
				title: "Housekeeping Assignment Workspace",
				note: "Room turnover, cleaning schedules, and task completion updates for assigned shifts.",
				cards: [
					{ label: "Rooms Assigned", value: "11", note: "Today's cleaning roster" },
					{ label: "Turnovers Due", value: "6", note: "Before 2 PM check-ins" },
					{ label: "Completion Rate", value: "82%", note: "Current shift performance" }
				],
				headers: ["Cleaning Task", "Property", "Status", "Next Action"],
				rows: [
					["Checkout Cleaning", "Marari Cove", "4 Done", "Complete 2 remaining suites"],
					["Deep Clean Cycle", "Kadavanthra Suites", "Scheduled", "Run at 4 PM"],
					["Linen Restock", "Marari Cove", "Pending", "Close before evening check-in"],
					["Supervisor Audit", "All Assigned", "Queued", "Submit checklist photos"]
				],
				alerts: [
					{ type: "warning", icon: "fa-broom", text: "2 rooms are nearing late-clean threshold for today." }
				],
				restrictedOverview: {
					value: "11 Rooms",
					note: "Cleaning schedule assigned for this shift",
					report: "Task Sheet",
					reportNote: "Operational-only visibility"
				}
			};
		}
	};
})(window);
