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
		},
		getOperationsDashboardData: function () {
			var kpis = {
				activeProperties: 3,
				todayCheckins: 4,
				todayCheckouts: 2,
				pendingCleaning: 3,
				openMaintenance: 5,
				occupancyRate: "78%",
				revenueMonth: "INR 8,42,000"
			};

			var todayTimeline = {
				morning: [
					"2 check-outs scheduled at Marari Cove.",
					"3 cleanings scheduled before 1 PM."
				],
				afternoon: [
					"4 check-ins across all properties.",
					"1 mid-stay room refresh at Kadavanthra Suites."
				],
				evening: [
					"1 late arrival noted at Wayanad Ridge.",
					"Confirm night staff handover for late check-in."
				]
			};

			var housekeepingRows = [
				{
					property: "Everloft Marari Cove",
					checkout: "10:00 AM",
					assigned: "Anju (HK)",
					status: "In progress",
					actionLabel: "Mark Urgent"
				},
				{
					property: "Everloft Kadavanthra Suites",
					checkout: "11:00 AM",
					assigned: "Rahul (HK)",
					status: "Pending",
					actionLabel: "Assign Staff"
				},
				{
					property: "Everloft Wayanad Ridge",
					checkout: "09:30 AM",
					assigned: "Team B",
					status: "Awaiting QC",
					actionLabel: "Approve Completion"
				}
			];

			var maintenanceRows = [
				{
					property: "Marari Cove",
					issue: "Shower pressure low",
					priority: "Medium",
					assignedTo: "Suresh",
					status: "In progress",
					age: "1 day"
				},
				{
					property: "Kadavanthra Suites",
					issue: "AC not cooling",
					priority: "High",
					assignedTo: "External vendor",
					status: "Waiting for parts",
					age: "3 days"
				},
				{
					property: "Wayanad Ridge",
					issue: "Balcony railing check",
					priority: "Low",
					assignedTo: "Maintenance team",
					status: "Scheduled",
					age: "0 days"
				}
			];

			var bookingManagement = {
				upcoming: [
					"Today: 2 check-ins at Marari Cove.",
					"Tomorrow: 1 long-stay check-in at Wayanad Ridge.",
					"Next 7 days: 11 total arrivals across all properties."
				],
				alerts: [
					"Low occupancy flagged for mid-week at Kadavanthra Suites.",
					"One booking marked as payment pending; follow-up required.",
					"Same-day turnover at Marari Cove requires tight cleaning schedule."
				]
			};

			var propertyStatusRows = [
				{
					property: "Everloft Marari Cove",
					nextCheckin: "Today, 3:00 PM",
					cleaning: "In progress",
					maintenance: "Clear",
					ready: "🟡 Cleaning pending"
				},
				{
					property: "Everloft Kadavanthra Suites",
					nextCheckin: "Today, 6:00 PM",
					cleaning: "Complete",
					maintenance: "AC service pending",
					ready: "🔴 Maintenance pending"
				},
				{
					property: "Everloft Wayanad Ridge",
					nextCheckin: "Tomorrow, 1:00 PM",
					cleaning: "Scheduled",
					maintenance: "Clear",
					ready: "🟢 Ready"
				}
			];

			var alerts = [
				"Unassigned cleaning tasks at Kadavanthra Suites.",
				"Overdue maintenance ticket for AC unit (Kadavanthra).",
				"Same-day turnover at Marari Cove requires priority routing.",
				"One booking marked payment pending for today.",
				"Guest complaint logged yesterday; follow-up due."
			];

			var analytics = {
				occupancy: "76% (sample)",
				turnaround: "3.1 hours avg. room turnaround",
				cleaning: "42 minutes avg. cleaning time",
				maintenanceResolution: "1.8 days avg. resolution time",
				cancellationRate: "6.4% (sample)"
			};

			var staff = {
				housekeeping: [
					"Anju – 3 rooms assigned",
					"Rahul – 2 rooms assigned",
					"Team B – villa turnaround"
				],
				maintenance: [
					"Suresh – plumbing and fixtures",
					"Ravi – electrical and lighting",
					"External vendor – AC servicing"
				],
				performance: [
					"Average HK completion score: 4.6 / 5 (sample).",
					"On-time task completion: 91% this month (sample).",
					"High-load shifts flagged for redistribution tomorrow (sample)."
				]
			};

			return {
				kpis: kpis,
				todayTimeline: todayTimeline,
				housekeepingRows: housekeepingRows,
				maintenanceRows: maintenanceRows,
				bookingManagement: bookingManagement,
				propertyStatusRows: propertyStatusRows,
				alerts: alerts,
				analytics: analytics,
				staff: staff
			};
		}
	};
})(window);
