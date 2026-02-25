(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.login) {
		return;
	}

	var LoginFormWidget = function () {
		this.form = document.getElementById("everloft-login-form");
		this.usernameInput = document.getElementById("login-username");
		this.passwordInput = document.getElementById("login-password");
		this.errorNode = document.getElementById("login-error");
		this.submitButton = this.form ? this.form.querySelector('button[type="submit"]') : null;
	};

	LoginFormWidget.prototype.exists = function () {
		return Boolean(this.form && this.usernameInput && this.passwordInput && this.errorNode);
	};

	LoginFormWidget.prototype.getCredentials = function () {
		return {
			username: this.usernameInput ? this.usernameInput.value.trim() : "",
			password: this.passwordInput ? this.passwordInput.value : ""
		};
	};

	LoginFormWidget.prototype.bindSubmit = function (handler) {
		if (!this.form) {
			return;
		}

		this.form.addEventListener("submit", handler);
	};

	LoginFormWidget.prototype.showError = function (message) {
		if (!this.errorNode) {
			return;
		}

		this.errorNode.hidden = false;
		this.errorNode.textContent = message;
	};

	LoginFormWidget.prototype.clearError = function () {
		if (!this.errorNode) {
			return;
		}

		this.errorNode.hidden = true;
		this.errorNode.textContent = "";
	};

	LoginFormWidget.prototype.setSubmitting = function (submitting) {
		if (!this.submitButton) {
			return;
		}

		this.submitButton.disabled = submitting;
		this.submitButton.textContent = submitting ? "Logging in..." : "Login to Dashboard";
	};

	app.Widgets.login.LoginFormWidget = LoginFormWidget;
})(window);
