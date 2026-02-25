(function (global) {
	var app = global.EverloftMVP;
	if (!app) {
		return;
	}

	var HomeView = function () {
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
		this.certCarousel = document.getElementById("cert-carousel");
		this.certFullscreen = document.getElementById("cert-fullscreen");
		this.certFullscreenImage = document.getElementById("cert-fullscreen-image");
	};

	HomeView.prototype.hasContactForm = function () {
		return Boolean(this.form);
	};

	HomeView.prototype.bindContactSubmit = function (handler) {
		if (!this.form) {
			return;
		}

		this.form.addEventListener("submit", handler);
	};

	HomeView.prototype.setSubmittingState = function (submitting) {
		if (!this.submitButton) {
			return;
		}

		this.submitButton.disabled = submitting;
		this.submitButton.classList.toggle("is-loading", submitting);
		this.submitButton.value = submitting ? "Sending..." : "Send Message";
	};

	HomeView.prototype.updateProgress = function (value, text) {
		if (!this.progressBar || !this.progressFill || !this.progressLabel) {
			return;
		}

		var boundedValue = Math.max(0, Math.min(100, value));
		this.progressValue = boundedValue;
		this.progressBar.setAttribute("aria-valuenow", String(Math.round(boundedValue)));
		this.progressFill.style.width = boundedValue + "%";
		this.progressLabel.textContent = text || "Sending message...";
	};

	HomeView.prototype.showProgress = function () {
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

	HomeView.prototype.hideProgress = function () {
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

	HomeView.prototype.startProgress = function () {
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

	HomeView.prototype.finishProgress = function (success, customMessage) {
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

	HomeView.prototype.resetContactForm = function () {
		if (this.form) {
			this.form.reset();
		}
	};

	HomeView.prototype.initCertificateCarousel = function () {
		var certCarousel = this.certCarousel;
		if (!certCarousel) {
			return;
		}

		var track = certCarousel.querySelector(".cert-track");
		var cards = Array.prototype.slice.call(certCarousel.querySelectorAll(".cert-card"));
		var dots = Array.prototype.slice.call(certCarousel.querySelectorAll(".cert-dots button"));
		var mobileMedia = window.matchMedia("(max-width: 736px)");
		var currentSlide = 0;
		var autoSwipeTimer = null;

		var applySlide = function (index) {
			if (!track || cards.length === 0) {
				return;
			}

			currentSlide = (index + cards.length) % cards.length;
			if (mobileMedia.matches) {
				track.style.transform = "translateX(-" + currentSlide * 100 + "%)";
			} else {
				track.style.transform = "";
			}

			dots.forEach(function (dot, dotIndex) {
				dot.classList.toggle("is-active", dotIndex === currentSlide);
			});
		};

		var stopAutoSwipe = function () {
			if (autoSwipeTimer) {
				window.clearInterval(autoSwipeTimer);
				autoSwipeTimer = null;
			}
		};

		var startAutoSwipe = function () {
			stopAutoSwipe();
			if (!mobileMedia.matches || cards.length < 2) {
				return;
			}

			autoSwipeTimer = window.setInterval(function () {
				applySlide(currentSlide + 1);
			}, 3300);
		};

		dots.forEach(function (dot, index) {
			dot.addEventListener("click", function () {
				applySlide(index);
				startAutoSwipe();
			});
		});

		certCarousel.addEventListener("mouseenter", stopAutoSwipe);
		certCarousel.addEventListener("mouseleave", startAutoSwipe);
		certCarousel.addEventListener("touchstart", stopAutoSwipe, { passive: true });
		certCarousel.addEventListener("touchend", startAutoSwipe, { passive: true });

		var handleViewportChange = function () {
			applySlide(0);
			startAutoSwipe();
		};

		if (typeof mobileMedia.addEventListener === "function") {
			mobileMedia.addEventListener("change", handleViewportChange);
		} else if (typeof mobileMedia.addListener === "function") {
			mobileMedia.addListener(handleViewportChange);
		}

		applySlide(0);
		startAutoSwipe();
	};

	HomeView.prototype.initCertificateFullscreen = function () {
		var certFullscreen = this.certFullscreen;
		var certFullscreenImage = this.certFullscreenImage;
		var certPreviewImages = Array.prototype.slice.call(document.querySelectorAll("#certifications .cert-preview img"));
		if (!certFullscreen || !certFullscreenImage || certPreviewImages.length < 1) {
			return;
		}

		var closeCertFullscreen = function () {
			certFullscreen.hidden = true;
			certFullscreen.setAttribute("aria-hidden", "true");
			certFullscreenImage.src = "";
			certFullscreenImage.alt = "";
			document.body.classList.remove("is-cert-fullscreen-open");
		};

		var openCertFullscreen = function (image) {
			certFullscreenImage.src = image.src;
			certFullscreenImage.alt = image.alt || "Certificate full view";
			certFullscreen.hidden = false;
			certFullscreen.setAttribute("aria-hidden", "false");
			document.body.classList.add("is-cert-fullscreen-open");
		};

		certPreviewImages.forEach(function (image) {
			image.addEventListener("click", function () {
				openCertFullscreen(image);
			});
		});

		certFullscreen.addEventListener("click", function () {
			closeCertFullscreen();
		});

		document.addEventListener("keydown", function (event) {
			if (event.key === "Escape" && !certFullscreen.hidden) {
				closeCertFullscreen();
			}
		});
	};

	app.Views.home = HomeView;
})(window);
