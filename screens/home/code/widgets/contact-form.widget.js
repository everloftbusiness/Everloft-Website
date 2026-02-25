(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.home) {
		return;
	}

	var ContactFormWidget = function () {
		this.form = document.getElementById("submit-to-google-sheet");
		this.submitButton = document.getElementById("contact-submit-button");
		this.progressContainer = document.getElementById("form-progress");
		this.progressBar = document.getElementById("form-progress-bar");
		this.progressFill = document.getElementById("form-progress-fill");
		this.progressLabel = document.getElementById("form-progress-label");
		this.progressTimer = null;
		this.progressHideTimer = null;
		this.progressCleanupTimer = null;
		this.progressValue = 0;
	};

	ContactFormWidget.prototype.exists = function () {
		return Boolean(this.form);
	};

	ContactFormWidget.prototype.bindSubmit = function (handler) {
		if (!this.form) {
			return;
		}

		this.form.addEventListener("submit", handler);
	};

	ContactFormWidget.prototype.setSubmittingState = function (submitting) {
		if (!this.submitButton) {
			return;
		}

		this.submitButton.disabled = submitting;
		this.submitButton.classList.toggle("is-loading", submitting);
		this.submitButton.value = submitting ? "Sending..." : "Send Message";
	};

	ContactFormWidget.prototype.updateProgress = function (value, text) {
		if (!this.progressBar || !this.progressFill || !this.progressLabel) {
			return;
		}

		var boundedValue = Math.max(0, Math.min(100, value));
		this.progressValue = boundedValue;
		this.progressBar.setAttribute("aria-valuenow", String(Math.round(boundedValue)));
		this.progressFill.style.width = boundedValue + "%";
		this.progressLabel.textContent = text || "Sending message...";
	};

	ContactFormWidget.prototype.showProgress = function () {
		if (!this.progressContainer) {
			return;
		}

		if (this.progressHideTimer) {
			window.clearTimeout(this.progressHideTimer);
			this.progressHideTimer = null;
		}

		if (this.progressCleanupTimer) {
			window.clearTimeout(this.progressCleanupTimer);
			this.progressCleanupTimer = null;
		}

		this.progressContainer.hidden = false;
		this.progressContainer.classList.add("is-visible");
		this.progressContainer.classList.remove("is-error");
	};

	ContactFormWidget.prototype.hideProgress = function () {
		var self = this;
		if (!self.progressContainer) {
			return;
		}

		self.progressContainer.classList.remove("is-visible");
		if (self.progressCleanupTimer) {
			window.clearTimeout(self.progressCleanupTimer);
		}

		self.progressCleanupTimer = window.setTimeout(function () {
			self.progressContainer.hidden = true;
			self.progressContainer.classList.remove("is-error");
			self.progressCleanupTimer = null;
		}, 220);
	};

	ContactFormWidget.prototype.startProgress = function () {
		var self = this;
		self.showProgress();
		self.updateProgress(8, "Connecting to server...");

		if (self.progressTimer) {
			window.clearInterval(self.progressTimer);
		}

		self.progressTimer = window.setInterval(function () {
			if (self.progressValue >= 90) {
				return;
			}

			var step = self.progressValue < 45 ? 7 : self.progressValue < 75 ? 3 : 1;
			self.updateProgress(self.progressValue + step);
		}, 300);
	};

	ContactFormWidget.prototype.finishProgress = function (success, customMessage) {
		var self = this;

		if (self.progressTimer) {
			window.clearInterval(self.progressTimer);
			self.progressTimer = null;
		}

		if (self.progressContainer && !success) {
			self.progressContainer.classList.add("is-error");
		}

		self.updateProgress(100, customMessage || (success ? "Message sent successfully." : "Unable to send message."));
		if (self.progressHideTimer) {
			window.clearTimeout(self.progressHideTimer);
		}

		self.progressHideTimer = window.setTimeout(function () {
			self.hideProgress();
			self.progressHideTimer = null;
		}, success ? 3600 : 2800);
	};

	ContactFormWidget.prototype.reset = function () {
		if (this.form) {
			this.form.reset();
		}
	};

	app.Widgets.home.ContactFormWidget = ContactFormWidget;
})(window);
