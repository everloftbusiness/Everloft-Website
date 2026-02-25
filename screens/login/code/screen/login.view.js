(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.login) {
		return;
	}

	var LoginView = function () {
		this.formWidget = new app.Widgets.login.LoginFormWidget();
	};

	LoginView.prototype.hasForm = function () {
		return this.formWidget.exists();
	};

	LoginView.prototype.getCredentials = function () {
		return this.formWidget.getCredentials();
	};

	LoginView.prototype.bindSubmit = function (handler) {
		this.formWidget.bindSubmit(handler);
	};

	LoginView.prototype.showError = function (message) {
		this.formWidget.showError(message);
	};

	LoginView.prototype.clearError = function () {
		this.formWidget.clearError();
	};

	LoginView.prototype.setSubmitting = function (submitting) {
		this.formWidget.setSubmitting(submitting);
	};

	LoginView.prototype.redirect = function (url) {
		window.location.href = url;
	};

	app.Views.login = LoginView;
})(window);
