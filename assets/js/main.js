/*
	Hyperspace by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$sidebar = $('#sidebar');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Hack: Enable IE flexbox workarounds.
		if (browser.name == 'ie')
			$body.addClass('is-ie');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Forms.

		// Hack: Activate non-input submits.
			$('form').on('click', '.submit', function(event) {

				// Stop propagation, default.
					event.stopPropagation();
					event.preventDefault();

				// Submit form.
					$(this).parents('form').submit();

			});

	// Sidebar.
		if ($sidebar.length > 0) {

			var $sidebar_a = $sidebar.find('nav a[href^="#"]'),
				$sidebarTitleIndicatorLayer = null,
				$sidebarTitleIndicator = null,
				$sidebarTitleIndicatorItems = $();

			function refreshSidebarTitleIndicatorLayout() {

				var indicatorElement, wasFullWidth, fitsFullWidth;

				if (!$sidebarTitleIndicator || $sidebarTitleIndicator.length < 1)
					return;

				indicatorElement = $sidebarTitleIndicator[0];
				wasFullWidth = $sidebarTitleIndicator.hasClass('is-full');

				if (wasFullWidth)
					$sidebarTitleIndicator.removeClass('is-full');

				fitsFullWidth = indicatorElement.scrollWidth <= (indicatorElement.clientWidth + 2);

				if (fitsFullWidth)
					$sidebarTitleIndicator.addClass('is-full');

			}

			function updateSidebarTitleIndicator() {

				var $activeSidebarLink, activeIndex, $activeIndicatorItem;

				if ($sidebarTitleIndicatorItems.length < 1)
					return;

				$activeSidebarLink = $sidebar_a.filter('.active').first();

				if ($activeSidebarLink.length < 1)
					$activeSidebarLink = $sidebar_a.first();

				activeIndex = $sidebar_a.index($activeSidebarLink);

				if (activeIndex < 0)
					activeIndex = 0;

				$sidebarTitleIndicatorItems.removeClass('is-active');
				$activeIndicatorItem = $sidebarTitleIndicatorItems.eq(activeIndex).addClass('is-active');
				refreshSidebarTitleIndicatorLayout();

				if (!$sidebar.is(':visible') && $activeIndicatorItem.length > 0) {
					$sidebarTitleIndicator.addClass('is-visible');

					if (!$sidebarTitleIndicator.hasClass('is-full')
					&&	$activeIndicatorItem.length > 0
					&&	$activeIndicatorItem[0].scrollIntoView)
						$activeIndicatorItem[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
				}
				else
					$sidebarTitleIndicator.removeClass('is-visible');

			}

			if ($sidebar_a.length > 0
			&&	($body.hasClass('home-page') || $body.hasClass('program-page'))) {

				var $indicatorList = $('<ul class="sidebar-title-indicator-list"></ul>');

				$sidebar_a.each(function(index) {

					var $sourceLink = $(this),
						linkText = $.trim($sourceLink.text()),
						linkHref = $sourceLink.attr('href') || '#';

					$indicatorList.append(
						$('<li></li>').append(
							$('<a class="sidebar-title-indicator-item scrolly"></a>')
								.attr('href', linkHref)
								.attr('data-sidebar-indicator-index', index)
								.text(linkText)
						)
					);

				});

				$sidebarTitleIndicatorLayer = $(
					'<div class="sidebar-title-indicator-layer">' +
						'<nav class="sidebar-title-indicator" aria-label="Section navigation"></nav>' +
					'</div>'
				);
				$sidebarTitleIndicator = $sidebarTitleIndicatorLayer.find('.sidebar-title-indicator');
				$sidebarTitleIndicator.append($indicatorList);
				$sidebarTitleIndicatorItems = $sidebarTitleIndicatorLayer.find('.sidebar-title-indicator-item');
				$body.append($sidebarTitleIndicatorLayer);

				$sidebarTitleIndicatorItems.on('click', function() {

					var indicatorIndex = parseInt($(this).attr('data-sidebar-indicator-index'), 10),
						$linkedSidebarItem = $sidebar_a.eq(indicatorIndex);

					if ($linkedSidebarItem.length < 1)
						return;

					$sidebar_a.removeClass('active');
					$linkedSidebarItem
						.addClass('active')
						.addClass('active-locked');

					updateSidebarTitleIndicator();

				});

				$window.on('resize.sidebarTitleIndicator orientationchange.sidebarTitleIndicator', function() {
					updateSidebarTitleIndicator();
				});

				updateSidebarTitleIndicator();

			}

			$sidebar_a
				.addClass('scrolly')
				.on('click', function() {

					var $this = $(this);

					// External link? Bail.
						if ($this.attr('href').charAt(0) != '#')
							return;

					// Deactivate all links.
						$sidebar_a.removeClass('active');

					// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
						$this
							.addClass('active')
							.addClass('active-locked');

					updateSidebarTitleIndicator();

				})
				.each(function() {

					var	$this = $(this),
						id = $this.attr('href'),
						$section = $(id);

					// No section for this link? Bail.
						if ($section.length < 1)
							return;

					// Scrollex.
						$section.scrollex({
							mode: 'middle',
							top: '-20vh',
							bottom: '-20vh',
							initialize: function() {

								// Deactivate section.
									$section.addClass('inactive');

							},
							enter: function() {

								// Activate section.
									$section.removeClass('inactive');

								// No locked links? Deactivate all links and activate this section's one.
									if ($sidebar_a.filter('.active-locked').length == 0) {

										$sidebar_a.removeClass('active');
										$this.addClass('active');

									}

								// Otherwise, if this section's link is the one that's locked, unlock it.
									else if ($this.hasClass('active-locked'))
										$this.removeClass('active-locked');

								updateSidebarTitleIndicator();

							}
						});

				});

			updateSidebarTitleIndicator();

		}

	// Scrolly.
		$('.scrolly').scrolly({
			speed: 1000,
			offset: function() {

				// If <=large, >small, and visible sidebar is present, use its height as the offset.
					if (breakpoints.active('<=large')
					&&	!breakpoints.active('<=small')
					&&	$sidebar.length > 0
					&&	$sidebar.is(':visible'))
						return $sidebar.outerHeight();

				return 0;

			}
		});

	// Spotlights.
		$('.spotlights > section')
			.scrollex({
				mode: 'middle',
				top: '-10vh',
				bottom: '-10vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			})
			.each(function() {

				var	$this = $(this),
					$image = $this.find('.image'),
					$img = $image.find('img'),
					x;

				// Assign image.
					$image.css('background-image', 'url(' + $img.attr('src') + ')');

				// Set background position.
					if (x = $img.data('position'))
						$image.css('background-position', x);

				// Hide <img>.
					$img.hide();

			});

	// Features.
		$('.features')
			.scrollex({
				mode: 'middle',
				top: '-20vh',
				bottom: '-20vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			});

	// PWA install prompt.
		(function() {

			var installBanner = null;
			var installMessage = null;
			var installAction = null;
			var deferredInstallPrompt = null;
			var fallbackTimer = null;
			var INSTALLED_KEY = 'everloft-install-complete';
			var LAST_SHOWN_KEY = 'everloft-install-last-shown-at';
			var PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

			function isMobileDevice() {
				return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
			}

			function isIOSDevice() {
				return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
			}

			function isStandaloneMode() {
				var standaloneMatch = false;

				if (window.matchMedia)
					standaloneMatch = window.matchMedia('(display-mode: standalone)').matches;

				return standaloneMatch || window.navigator.standalone === true;
			}

			function setInstalledFlag() {
				try {
					window.localStorage.setItem(INSTALLED_KEY, '1');
				}
				catch (error) {
					// Ignore localStorage restrictions.
				}
			}

			function isInstallFlagSet() {
				try {
					return window.localStorage.getItem(INSTALLED_KEY) === '1';
				}
				catch (error) {
					return false;
				}
			}

			function isInstalledExperience() {
				var standalone = isStandaloneMode();

				if (standalone)
					setInstalledFlag();

				return standalone || isInstallFlagSet();
			}

			function wasPromptShownRecently() {
				try {
					var rawValue = window.localStorage.getItem(LAST_SHOWN_KEY);

					if (!rawValue)
						return false;

					return (Date.now() - parseInt(rawValue, 10)) < PROMPT_COOLDOWN_MS;
				}
				catch (error) {
					return false;
				}
			}

			function markPromptShown() {
				try {
					window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
				}
				catch (error) {
					// Ignore localStorage restrictions.
				}
			}

			function hideInstallBanner() {
				if (!installBanner)
					return;

				installBanner.classList.remove('is-visible');
			}

			function handleInstallAction() {
				var mode = installBanner ? installBanner.getAttribute('data-install-mode') : '';

				if (mode === 'android' && deferredInstallPrompt) {
					deferredInstallPrompt.prompt();
					deferredInstallPrompt.userChoice.then(function(choice) {
						if (choice && choice.outcome === 'accepted')
							setInstalledFlag();

						deferredInstallPrompt = null;
						hideInstallBanner();
					})['catch'](function() {
						hideInstallBanner();
					});
					return;
				}

				if (mode === 'ios') {
					window.alert('To install Everloft on iPhone: open in Safari, tap Share, then tap Add to Home Screen.');
					hideInstallBanner();
					return;
				}

				window.alert('To install Everloft: open your browser menu and choose Install app or Add to Home screen.');
				hideInstallBanner();
			}

			function createInstallBanner() {
				if (installBanner)
					return;

				installBanner = document.createElement('aside');
				installBanner.className = 'everloft-install-banner';
				installBanner.setAttribute('aria-live', 'polite');
				installBanner.innerHTML =
					'<img src="/images/everloft-logo-mark.png" alt="Everloft logo">' +
					'<div class="install-copy">' +
						'<strong>Install Everloft</strong>' +
						'<p></p>' +
					'</div>' +
					'<button type="button" class="install-action">Install</button>' +
					'<button type="button" class="install-dismiss" aria-label="Dismiss install prompt">' +
						'<span class="icon solid fa-times" aria-hidden="true"></span>' +
					'</button>';

				document.body.appendChild(installBanner);

				installMessage = installBanner.querySelector('p');
				installAction = installBanner.querySelector('.install-action');

				installAction.addEventListener('click', handleInstallAction);
				installBanner.querySelector('.install-dismiss').addEventListener('click', function() {
					hideInstallBanner();
				});
			}

			function showInstallBanner(mode) {
				if (!isMobileDevice() || isInstalledExperience() || wasPromptShownRecently())
					return;

				createInstallBanner();
				installBanner.setAttribute('data-install-mode', mode);

				if (mode === 'ios') {
					installMessage.textContent = 'Add Everloft to your home screen for one-tap access.';
					installAction.textContent = 'How to Install';
				}
				else if (mode === 'android') {
					installMessage.textContent = 'Install Everloft for faster access and a full-screen app experience.';
					installAction.textContent = 'Install App';
				}
				else {
					installMessage.textContent = 'Add Everloft from your browser menu to keep it on your home screen.';
					installAction.textContent = 'Show Steps';
				}

				installBanner.classList.add('is-visible');
				markPromptShown();
			}

			function registerServiceWorker() {
				var canRegister = 'serviceWorker' in navigator;
				var secureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

				if (!canRegister || !secureContext)
					return;

				navigator.serviceWorker.register('/sw.js')['catch'](function() {
					// Ignore registration failures.
				});
			}

			function showFallbackPrompt() {
				if (!isMobileDevice() || isInstalledExperience() || wasPromptShownRecently())
					return;

				if (isIOSDevice()) {
					showInstallBanner('ios');
					return;
				}

				if (deferredInstallPrompt)
					showInstallBanner('android');
				else
					showInstallBanner('fallback');
			}

			registerServiceWorker();

			window.addEventListener('beforeinstallprompt', function(event) {
				event.preventDefault();
				deferredInstallPrompt = event;

				if (fallbackTimer) {
					window.clearTimeout(fallbackTimer);
					fallbackTimer = null;
				}

				showInstallBanner('android');
			});

			window.addEventListener('appinstalled', function() {
				setInstalledFlag();
				deferredInstallPrompt = null;
				hideInstallBanner();
			});

			$window.on('load', function() {
				if (!isMobileDevice() || isInstalledExperience())
					return;

				fallbackTimer = window.setTimeout(showFallbackPrompt, 1400);
			});

		})();

})(jQuery);
