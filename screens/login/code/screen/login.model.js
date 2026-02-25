(function (global) {
	var app = global.EverloftMVP;
	if (!app) {
		return;
	}

	var LoginModel = function () {
		this.loginApiUrl =
			"https://script.google.com/macros/s/AKfycbynU254u0gahicbJsjk9Y_F38saapB7fysqv6p8f1du2IZj6yfxF1Xa_A-IXmqCh8rz/exec";
	};

	LoginModel.prototype.normalizeRole = function (value) {
		return String(value || "")
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "");
	};

	LoginModel.prototype.resolveRole = function (candidates) {
		var self = this;
		var roleAliases = {
			super_admin: "super_admin",
			superadmin: "super_admin",
			opsadmin: "operations_manager",
			finance_admin: "finance_admin",
			financeadmin: "finance_admin",
			operations_manager: "operations_manager",
			operationsmanager: "operations_manager",
			operations_admin: "operations_manager",
			operationsadmin: "operations_manager",
			tech_admin: "tech_admin",
			techadmin: "tech_admin",
			property_manager: "property_manager",
			propertymanager: "property_manager",
			housekeeping: "housekeeping",
			housekeeping_staff: "housekeeping",
			housekeepingstaff: "housekeeping",
			maintenance: "maintenance",
			maintenance_staff: "maintenance",
			maintenancestaff: "maintenance",
			guest_support: "guest_support",
			guestsupport: "guest_support",
			investor: "investor",
			investor01: "investor",
			property_owner: "property_owner",
			propertyowner: "property_owner",
			owner: "property_owner",
			owner01: "property_owner",
			guest: "guest",
			customer: "guest",
			guest01: "guest",
			housekeep01: "housekeeping",
			maint01: "maintenance"
		};

		var list = Array.isArray(candidates) ? candidates : [candidates];
		var resolved = "";
		var fallback = "";
		list.forEach(function (candidate) {
			if (resolved) {
				return;
			}

			var normalized = self.normalizeRole(candidate);
			if (!normalized) {
				return;
			}
			if (!fallback) {
				fallback = normalized;
			}

			if (roleAliases[normalized]) {
				resolved = roleAliases[normalized];
				return;
			}

			var compact = normalized.replace(/_/g, "");
			if (roleAliases[compact]) {
				resolved = roleAliases[compact];
				return;
			}

			if (normalized.indexOf("maintenance") !== -1 || normalized.indexOf("maint") !== -1 || normalized.indexOf("mnt") !== -1) {
				resolved = "maintenance";
				return;
			}
			if (normalized.indexOf("housekeeping") !== -1 || normalized.indexOf("housekeep") !== -1 || normalized.indexOf("hkp") !== -1) {
				resolved = "housekeeping";
				return;
			}
			if (normalized.indexOf("operations") !== -1 || normalized.indexOf("ops") !== -1) {
				resolved = "operations_manager";
				return;
			}
			if (normalized.indexOf("finance") !== -1) {
				resolved = "finance_admin";
				return;
			}
			if (normalized.indexOf("tech") !== -1) {
				resolved = "tech_admin";
				return;
			}
			if (normalized.indexOf("support") !== -1) {
				resolved = "guest_support";
				return;
			}
		});

		return resolved || fallback;
	};

	LoginModel.prototype.authenticate = async function (username, password) {
		var requestedAt = new Date().toISOString();
		var body = new URLSearchParams({
			username: username,
			password: password,
			loginAt: requestedAt,
			eventType: "login"
		});

		var response = await fetch(this.loginApiUrl, {
			method: "POST",
			headers: { Accept: "application/json" },
			body: body
		});

		if (!response.ok) {
			throw new Error("Login request failed.");
		}

		var data = await response.json();
		var state = String(data.result || data.status || "").toLowerCase();
		var isSuccess = data.ok === true || state === "success" || state === "ok";

		if (!isSuccess) {
			throw new Error(data.message || "Invalid username or password.");
		}

		return data;
	};

	app.Models.login = LoginModel;
})(window);
