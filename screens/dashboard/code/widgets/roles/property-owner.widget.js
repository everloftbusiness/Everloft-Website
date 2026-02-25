(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.property_owner = {
		buildWorkspace: function (payload) {
			return {
				title: "Property Owner Workspace",
				note: "Own-property bookings, revenue summary, commission impact, and maintenance snapshots.",
				cards: [
					{ label: "Booked Nights", value: payload.summary.nights, note: "Current selected cycle" },
					{ label: "Net Revenue", value: payload.revenueStack.net, note: "After operations and reserve" },
					{ label: "Commission Applied", value: "12%", note: "As per management agreement" }
				],
				headers: ["Owner Feed", "Period", "Status", "Next Action"],
				rows: [
					["Monthly Revenue Summary", payload.overview.latestReport, "Published", "Download statement"],
					["Booking Calendar", payload.profile.label, "Healthy", "Review blocked dates"],
					["Guest Reviews", "Current Cycle", "4.7 / 5", "Close response drafts"],
					["Maintenance Updates", "Current Cycle", "2 Open", "Track closure ETA"]
				],
				alerts: [
					{ type: "info", icon: "fa-home", text: "Owner dashboard is restricted to your managed property data only." }
				],
				restrictedOverview: {
					value: payload.revenueStack.net,
					note: "Owner net summary for the selected cycle",
					report: payload.overview.latestReport,
					reportNote: "Own data + commission view"
				}
			};
		}
	};
})(window);
