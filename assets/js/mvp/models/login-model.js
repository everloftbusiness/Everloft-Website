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
