(function (global) {
	var app = global.EverloftMVP;
	if (!app) {
		return;
	}

	var hasStarted = false;

	var resolvePageKey = function () {
		var body = document.body;
		if (!body) {
			return "";
		}

		if (body.classList.contains("home-page")) {
			return "home";
		}
		if (body.classList.contains("login-page")) {
			return "login";
		}
		if (body.classList.contains("dashboard-page")) {
			return "dashboard";
		}

		return "";
	};

	var start = function () {
		if (hasStarted) {
			return;
		}
		hasStarted = true;

		var pageKey = resolvePageKey();
		if (!pageKey) {
			return;
		}

		var Presenter = app.Presenters[pageKey];
		if (typeof Presenter !== "function") {
			return;
		}

		var presenter = new Presenter();
		if (presenter && typeof presenter.init === "function") {
			presenter.init();
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start);
	} else {
		start();
	}
})(window);
