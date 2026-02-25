(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.maintenance = {
		isolatedView: true,
		getExpenseStorageKey: function () {
			return "everloftMaintenanceExpenseClaims";
		},
		getProperties: function () {
			return {
				pinnacle_apartment: {
					name: "Pinnacle Apartment",
					location: "Kakkanad, Kochi",
					address: "Tower A, Flat A-402, Pinnacle Apartment, Kakkanad, Kochi",
					accessInstructions: "Collect key from security desk and update gate pass register before entry.",
					emergencyContact: "+91 94470 11223",
					contactPerson: "Operations Admin - Meera Nair"
				},
				villa_green_nest: {
					name: "Villa Green Nest",
					location: "Panampilly Nagar, Kochi",
					address: "Block B, Villa Green Nest, Panampilly Nagar, Kochi",
					accessInstructions: "Use service gate entry and call site caretaker before starting work.",
					emergencyContact: "+91 94470 44556",
					contactPerson: "Operations Admin - Anand Menon"
				}
			};
		},
		getScheduleTemplate: function () {
			return [
				{ taskId: "mnt-1001", time: "10 AM", issue: "AC repair", property: "Pinnacle Apartment" },
				{ taskId: "mnt-1002", time: "2 PM", issue: "Plumbing", property: "Villa Green Nest" }
			];
		},
		getTaskTemplate: function () {
			var nowIsoString = new Date().toISOString();
			return [
				{
					id: "mnt-1001",
					propertyKey: "pinnacle_apartment",
					unit: "Flat A-402",
					issueType: "AC",
					category: "Appliance",
					description: "Master bedroom AC is not cooling and remote shows sensor warning.",
					priority: "High",
					assignedDate: "25 Feb 2026",
					dueDate: "25 Feb 2026, 10:00 AM",
					status: "In Progress",
					reportedBy: "Front Office",
					reportedDate: "25 Feb 2026, 08:15 AM",
					requiredMaterials: "Capacitor and refrigerant refill kit",
					notes: "Guest check-in at 4 PM. Prioritize closure before noon.",
					images: ["/images/pic01.jpg"],
					completionDate: null,
					uploads: null
				},
				{
					id: "mnt-1002",
					propertyKey: "villa_green_nest",
					unit: "Villa B-07",
					issueType: "Plumbing",
					category: "Plumbing",
					description: "Leak under kitchen sink with visible water pooling near cabinet edge.",
					priority: "Urgent",
					assignedDate: "25 Feb 2026",
					dueDate: "25 Feb 2026, 2:00 PM",
					status: "Pending",
					reportedBy: "Property Manager",
					reportedDate: "25 Feb 2026, 09:20 AM",
					requiredMaterials: "Pipe sealant, elbow joint, drain tape",
					notes: "Temporary shutoff completed. Permanent fix needed today.",
					images: ["/images/pic02.jpg"],
					completionDate: null,
					uploads: null
				},
				{
					id: "mnt-1003",
					propertyKey: "pinnacle_apartment",
					unit: "Flat C-210",
					issueType: "Electrical",
					category: "Electrical",
					description: "Corridor light circuit tripping after 8 PM load increase.",
					priority: "Medium",
					assignedDate: "24 Feb 2026",
					dueDate: "26 Feb 2026, 11:00 AM",
					status: "Waiting for Parts",
					reportedBy: "Site Supervisor",
					reportedDate: "24 Feb 2026, 07:35 PM",
					requiredMaterials: "Replacement MCB and wiring harness",
					notes: "Part requisition approved. Resume once delivery reaches site.",
					images: [],
					completionDate: null,
					uploads: null
				},
				{
					id: "mnt-1004",
					propertyKey: "villa_green_nest",
					unit: "Villa D-11",
					issueType: "Furniture",
					category: "Furniture",
					description: "Wardrobe hinge loosened in guest bedroom and needs reinforcement.",
					priority: "Low",
					assignedDate: "22 Feb 2026",
					dueDate: "24 Feb 2026, 5:30 PM",
					status: "Completed",
					reportedBy: "Housekeeping Lead",
					reportedDate: "22 Feb 2026, 01:10 PM",
					requiredMaterials: "Hinge screws and wood adhesive",
					notes: "Closed with final alignment check completed.",
					images: ["/images/pic03.jpg"],
					completionDate: nowIsoString,
					uploads: null
				}
			];
		},
		buildWorkspace: function () {
			return {
				title: "Maintenance Task Workspace",
				note: "Repair ticket assignment and closure tracking with before/after update workflow.",
				cards: [
					{ label: "Open Repair Tickets", value: "9", note: "Across assigned properties" },
					{ label: "Critical Issues", value: "2", note: "Immediate response required" },
					{ label: "Avg Closure Time", value: "5.3h", note: "Last 14-day average" }
				],
				headers: ["Issue Type", "Property", "Status", "Next Action"],
				rows: [
					["AC Repair", "Kadavanthra Suites", "In Progress", "Upload completion photos"],
					["Water Pressure", "Marari Cove", "Pending Parts", "Receive valve kit"],
					["Door Lock Fault", "Wayanad Ridge", "Assigned", "Close before check-in"],
					["Lighting Audit", "All Assigned", "Scheduled", "Run preventive check"]
				],
				alerts: [
					{ type: "critical", icon: "fa-exclamation-triangle", text: "Two high-priority repairs are still open at guest-facing units." }
				],
				restrictedOverview: {
					value: "9 Tickets",
					note: "Assigned maintenance issues in queue",
					report: "Repair Log",
					reportNote: "Operational-only visibility"
				}
			};
		}
	};
})(window);
