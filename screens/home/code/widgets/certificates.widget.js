(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.home) {
		return;
	}

	var CertificatesWidget = function () {
		this.certCarousel = document.getElementById("cert-carousel");
		this.certFullscreen = document.getElementById("cert-fullscreen");
		this.certFullscreenImage = document.getElementById("cert-fullscreen-image");
	};

	CertificatesWidget.prototype.initCarousel = function () {
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

	CertificatesWidget.prototype.initFullscreen = function () {
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

	app.Widgets.home.CertificatesWidget = CertificatesWidget;
})(window);
