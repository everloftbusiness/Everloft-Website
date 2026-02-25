(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.tech_admin = {
		buildWorkspace: function () {
			return {
				title: "Platform Access Workspace",
				note: "Tech/Admin scope for user access, backend reliability, and website content governance.",
				cards: [
					{ label: "User Access Requests", value: "9", note: "Pending role changes" },
					{ label: "Uptime (30d)", value: "99.94%", note: "Service reliability across core pages" },
					{ label: "Content Jobs", value: "12", note: "Pending publish/update tasks" }
				],
				headers: ["Platform Area", "Owner", "Status", "Next Action"],
				rows: [
					["Role Access Queue", "Tech Admin", "9 Pending", "Approve least-privilege requests"],
					["Dashboard Build", "Web Ops", "Healthy", "Run release smoke test"],
					["Content Pipeline", "Content Team", "In Progress", "Publish investor update"],
					["Security Logs", "Tech Admin", "Stable", "Review anomaly digest"]
				],
				alerts: [
					{ type: "info", icon: "fa-user-lock", text: "New onboarding wave requires role provisioning for 4 staff accounts." }
				],
				restrictedOverview: {
					value: "9 Access Requests",
					note: "Pending user-role provisioning",
					report: "Tech Ops",
					reportNote: "System and access governance view"
				}
			};
		}
	};
})(window);
