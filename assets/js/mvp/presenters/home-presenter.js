(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Models.home || !app.Views.home) {
		return;
	}

	var HomePresenter = function () {
		this.model = new app.Models.home();
		this.view = new app.Views.home();
		this.isSubmitting = false;
	};

	HomePresenter.prototype.init = function () {
		var self = this;

		self.view.initCertificateCarousel();
		self.view.initCertificateFullscreen();

		if (!self.view.hasContactForm()) {
			return;
		}

		self.view.bindContactSubmit(async function (event) {
			event.preventDefault();

			if (self.isSubmitting) {
				return;
			}

			self.isSubmitting = true;
			self.view.setSubmittingState(true);
			self.view.startProgress();

			try {
				await self.model.submitContact(self.view.form);
				self.view.finishProgress(true, "Thanks! Your message has been sent. Everloft will contact you soon.");
				self.view.resetContactForm();
			} catch (error) {
				self.view.finishProgress(false, "Unable to send message. Please try again.");
			} finally {
				self.isSubmitting = false;
				self.view.setSubmittingState(false);
			}
		});
	};

	app.Presenters.home = HomePresenter;
})(window);
