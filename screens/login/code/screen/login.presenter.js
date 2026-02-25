(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Models.login || !app.Views.login) {
		return;
	}

	var LoginPresenter = function () {
		this.model = new app.Models.login();
		this.view = new app.Views.login();
	};

	var roleToDashboardPath = function (roleKey) {
		var map = {
			super_admin: "super-admin",
			finance_admin: "finance-admin",
			operations_manager: "operations-manager",
			tech_admin: "tech-admin",
			property_manager: "property-manager",
			housekeeping: "housekeeping",
			maintenance: "maintenance",
			guest_support: "guest-support",
			property_owner: "property-owner",
			guest: "guest",
			investor: "investor"
		};

		var slug = map[String(roleKey || "").trim()] || "investor";
		return "/dashboard/roles/" + slug + "/";
	};

	LoginPresenter.prototype.init = function () {
		var self = this;

		if (sessionStorage.getItem("everloftAuth") === "1") {
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
		}

		if (!self.view.hasForm()) {
			return;
		}

		self.view.bindSubmit(async function (event) {
			event.preventDefault();

			var credentials = self.view.getCredentials();
			if (!credentials.username || !credentials.password) {
				self.view.showError("Please enter username and password.");
				return;
			}

			self.view.clearError();
			self.view.setSubmitting(true);

			try {
				var data = await self.model.authenticate(credentials.username, credentials.password);
				var successfulAt = new Date().toISOString();

				var previousSuccessfulAt = localStorage.getItem("everloftLastSuccessfulLoginAt");
				if (previousSuccessfulAt) {
					localStorage.setItem("everloftPreviousSuccessfulLoginAt", previousSuccessfulAt);
				}
				localStorage.setItem("everloftLastSuccessfulLoginAt", successfulAt);

				var resolvedRole = self.model.resolveRole([
					credentials.username,
					data.role,
					data.user_role,
					data.access_role,
					data.profile_role,
					data.account_type,
					data.role_key,
					data.roleKey,
					data.userType,
					data.user_type,
					data.userrole,
					data.userRole,
					data.role_label,
					data.roleName
				]);
				var roleLabel = String(
					data.role_label || data.roleName || data.role || data.user_role || data.access_role || ""
				).trim();
				var resolvedUserId = String(data.user_id || data.userId || data.id || "").trim();

				sessionStorage.setItem("everloftAuth", "1");
				sessionStorage.setItem("everloftUserName", data.name || data.display_name || credentials.username);
				sessionStorage.setItem("everloftLoginUsername", credentials.username);
				sessionStorage.setItem("everloftUserRole", resolvedRole || "");
				sessionStorage.setItem("everloftUserRoleLabel", roleLabel || "");
				sessionStorage.setItem("everloftUserId", resolvedUserId || "");
				sessionStorage.setItem("everloftSessionLoginAt", successfulAt);
				localStorage.setItem("everloftLastResolvedRole", resolvedRole || "");

				self.view.redirect(roleToDashboardPath(resolvedRole));
			} catch (error) {
				var failedCount = Number(localStorage.getItem("everloftFailedLogins") || "0") + 1;
				localStorage.setItem("everloftFailedLogins", String(failedCount));
				localStorage.setItem("everloftLastFailedLoginAt", new Date().toISOString());
				self.view.showError(error && error.message ? error.message : "Unable to login right now.");
			} finally {
				self.view.setSubmitting(false);
			}
		});
	};

	app.Presenters.login = LoginPresenter;
})(window);
