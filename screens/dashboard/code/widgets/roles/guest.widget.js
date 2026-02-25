(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	roles.guest = {
		buildWorkspace: function () {
			return {
				title: "Guest Account Workspace",
				note: "Booking history, upcoming stays, invoices, and support updates for your account only.",
				cards: [
					{ label: "Upcoming Stay", value: "07 Mar 2026", note: "Everloft Marari Cove - 2 nights" },
					{ label: "Past Bookings", value: "4", note: "Completed stays in your profile" },
					{ label: "Open Support Tickets", value: "1", note: "Resolution ETA: 6 hours" }
				],
				headers: ["Guest Activity", "Reference", "Status", "Next Action"],
				rows: [
					["Booking #EL-G-1024", "07 Mar 2026", "Confirmed", "Download invoice"],
					["Invoice #INV-8891", "Latest Stay", "Issued", "Save PDF copy"],
					["Support Ticket #T-44", "Room Preferences", "Open", "Await support reply"],
					["Profile Verification", "Account", "Complete", "No action required"]
				],
				alerts: [
					{ type: "success", icon: "fa-check-circle", text: "Your next stay is confirmed and pre-arrival details are available." }
				],
				restrictedOverview: {
					value: "Upcoming Stay",
					note: "Guest account view with booking-only scope",
					report: "Guest Access",
					reportNote: "No backend financial visibility"
				}
			};
		}
	};
})(window);
