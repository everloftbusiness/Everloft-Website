(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.home) {
		return;
	}

	var HomeView = function () {
		this.contactFormWidget = new app.Widgets.home.ContactFormWidget();
		this.certificatesWidget = new app.Widgets.home.CertificatesWidget();
		this.form = this.contactFormWidget.form;
	};

	HomeView.prototype.hasContactForm = function () {
		return this.contactFormWidget.exists();
	};

	HomeView.prototype.bindContactSubmit = function (handler) {
		this.contactFormWidget.bindSubmit(handler);
	};

	HomeView.prototype.setSubmittingState = function (submitting) {
		this.contactFormWidget.setSubmittingState(submitting);
	};

	HomeView.prototype.startProgress = function () {
		this.contactFormWidget.startProgress();
	};

	HomeView.prototype.finishProgress = function (success, customMessage) {
		this.contactFormWidget.finishProgress(success, customMessage);
	};

	HomeView.prototype.resetContactForm = function () {
		this.contactFormWidget.reset();
	};

	HomeView.prototype.initCertificateCarousel = function () {
		this.certificatesWidget.initCarousel();
	};

	HomeView.prototype.initCertificateFullscreen = function () {
		this.certificatesWidget.initFullscreen();
	};

	app.Views.home = HomeView;
})(window);
