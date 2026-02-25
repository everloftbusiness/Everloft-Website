(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var DashboardShellWidget = function () {
		this.userNameNode = document.getElementById("dashboard-user-name");
		this.logoutNode = document.getElementById("dashboard-logout");
	};

	DashboardShellWidget.prototype.applyUserName = function (userName) {
		if (this.userNameNode) {
			this.userNameNode.textContent = userName;
		}
	};

	DashboardShellWidget.prototype.bindLogout = function (handler) {
		if (!this.logoutNode) {
			return;
		}

		this.logoutNode.addEventListener("click", handler);
	};

	DashboardShellWidget.prototype.clearSession = function () {
		[
			"everloftAuth",
			"everloftUserName",
			"everloftLoginUsername",
			"everloftUserRole",
			"everloftUserRoleLabel",
			"everloftUserId",
			"everloftSessionLoginAt"
		].forEach(function (key) {
			sessionStorage.removeItem(key);
		});
	};

	app.Widgets.dashboard.DashboardShellWidget = DashboardShellWidget;
})(window);
