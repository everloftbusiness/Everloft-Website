(function (global) {
	var app = global.EverloftMVP;
	if (!app) {
		return;
	}

	var LoginView = function () {
		this.form = document.getElementById("everloft-login-form");
		this.usernameInput = document.getElementById("login-username");
		this.passwordInput = document.getElementById("login-password");
		this.errorNode = document.getElementById("login-error");
		this.submitButton = this.form ? this.form.querySelector('button[type="submit"]') : null;
	};

	LoginView.prototype.hasForm = function () {
		return Boolean(this.form && this.usernameInput && this.passwordInput && this.errorNode);
	};

	LoginView.prototype.getCredentials = function () {
		return {
			username: this.usernameInput ? this.usernameInput.value.trim() : "",
			password: this.passwordInput ? this.passwordInput.value : ""
		};
	};

	LoginView.prototype.bindSubmit = function (handler) {
		if (!this.form) {
			return;
		}

		this.form.addEventListener("submit", handler);
	};

	LoginView.prototype.showError = function (message) {
		if (!this.errorNode) {
			return;
		}

		this.errorNode.hidden = false;
		this.errorNode.textContent = message;
	};

	LoginView.prototype.clearError = function () {
		if (!this.errorNode) {
			return;
		}

		this.errorNode.hidden = true;
		this.errorNode.textContent = "";
	};

	LoginView.prototype.setSubmitting = function (submitting) {
		if (!this.submitButton) {
			return;
		}

		this.submitButton.disabled = submitting;
		this.submitButton.textContent = submitting ? "Logging in..." : "Login to Dashboard";
	};

	LoginView.prototype.redirect = function (url) {
		window.location.href = url;
	};

	app.Views.login = LoginView;
})(window);
