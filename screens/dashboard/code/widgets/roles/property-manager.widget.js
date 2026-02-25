(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.property_manager = {
		buildWorkspace: function () {
			return {
				title: "Property Manager Workspace",
				note: "Task-oriented property operations with assignment and progress tracking only.",
				cards: [
					{ label: "Assigned Properties", value: "2", note: "Marari Cove and Wayanad Ridge" },
					{ label: "Open Tasks", value: "18", note: "Housekeeping + issue follow-up" },
					{ label: "Task Completion", value: "88%", note: "Current weekly completion rate" }
				],
				headers: ["Task Group", "Owner", "Status", "Next Action"],
				rows: [
					["Check-in Readiness", "Site Team", "6/7 Ready", "Close Wayanad villa prep"],
					["Housekeeping QC", "Property Manager", "On Track", "Complete room audit run"],
					["Minor Repairs", "Maintenance", "3 Open", "Close before weekend demand"],
					["Guest Requests", "Support", "2 Open", "Follow up within SLA"]
				],
				alerts: [
					{ type: "warning", icon: "fa-tools", text: "Three turnaround tasks are due in the next 4 hours." }
				],
				restrictedOverview: {
					value: "18 Open Tasks",
					note: "Current assigned operations workload",
					report: "Operations Snapshot",
					reportNote: "Financial data hidden"
				}
			};
		}
	};
})(window);
