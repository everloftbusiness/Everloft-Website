(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	var FALLBACK_GUEST_USER_ID = "EL-GST-001";

	var addDays = function (date, days) {
		var next = new Date(date.getTime());
		next.setDate(next.getDate() + Number(days || 0));
		return next;
	};

	var toIsoDate = function (date) {
		return date.toISOString().split("T")[0];
	};

	var today = new Date();
	var sampleCheckInDate = addDays(today, 2);
	var sampleCheckOutDate = addDays(today, 5);

	var guestDataByUserId = {
		"EL-GST-001": {
			upcoming: {
				bookingId: "EL-G-1024",
				propertyName: "Everloft Marari Cove",
				location: "Marari Beach, Alappuzha",
				checkInDate: toIsoDate(sampleCheckInDate),
				checkOutDate: toIsoDate(sampleCheckOutDate),
				guests: 3,
				paymentStatus: "Paid",
				hostContact: "+91 74832 70264",
				mapLink: "https://maps.google.com/?q=Marari+Beach+Alappuzha",
				propertyDetailsUrl: "/",
				bookingAmount: 18750,
				paidAmount: 18750,
				pendingAmount: 0,
				instructions: {
					entryInstructions: "Main gate self-check-in kiosk near reception.",
					doorLockCode: "8426#",
					wifiName: "Everloft-Guest",
					wifiPassword: "Stay@Everloft",
					parkingInstructions: "Use slot B-14 and display guest parking slip.",
					houseRules: "No loud music after 10 PM. No smoking indoors.",
					emergencyContact: "+91 94470 22110"
				}
			},
			history: [
				{
					propertyName: "Everloft Kadavanthra Suites",
					checkInDate: "2025-12-18",
					checkOutDate: "2025-12-21",
					amount: 14200,
					status: "Completed",
					invoiceNumber: "INV-8891"
				},
				{
					propertyName: "Everloft Wayanad Ridge",
					checkInDate: "2025-09-03",
					checkOutDate: "2025-09-06",
					amount: 16600,
					status: "Completed",
					invoiceNumber: "INV-8450"
				}
			],
			payments: [
				{ date: toIsoDate(addDays(today, -2)), mode: "UPI", amount: 12000, status: "Success", reference: "UPI-529821" },
				{ date: toIsoDate(addDays(today, -3)), mode: "Card", amount: 6750, status: "Success", reference: "CRD-119204" }
			]
		}
	};

	roles.guest = {
		isolatedView: true,
		buildWorkspace: function () {
			return {
				title: "Guest Account Workspace",
				note: "Booking details, invoices, support, and profile settings for your account only.",
				cards: [
					{ label: "Upcoming Stay", value: "Active", note: "Check itinerary and arrival details" },
					{ label: "Past Stays", value: "2", note: "Completed stays in your account" },
					{ label: "Support", value: "Available", note: "Quick service requests" }
				],
				headers: ["Activity", "Reference", "Status", "Next Action"],
				rows: [
					["Upcoming Booking", "Guest Account", "Active", "Review stay details"],
					["Invoices", "Payments", "Available", "Download PDF"],
					["Support", "Help Center", "Open", "Raise request"],
					["Profile", "Account", "Editable", "Update details"]
				],
				alerts: [
					{ type: "info", icon: "fa-user-lock", text: "Guest dashboard is restricted to your own booking data." }
				],
				restrictedOverview: {
					value: "Guest View",
					note: "Own booking visibility only",
					report: "Guest Access",
					reportNote: "No backend reports"
				}
			};
		}
	};

	var escapeHtml = function (value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	};

	var formatDate = function (rawDate) {
		var parsed = new Date(rawDate);
		if (Number.isNaN(parsed.getTime())) {
			return "--";
		}
		return parsed.toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		});
	};

	var formatInr = function (amount) {
		return "INR " + Number(amount || 0).toLocaleString("en-IN");
	};

	var startOfDay = function (date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	};

	var sameDate = function (a, b) {
		return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
	};

	var getCountdownLabel = function (checkInDateRaw) {
		var checkInDate = startOfDay(new Date(checkInDateRaw));
		if (Number.isNaN(checkInDate.getTime())) {
			return "Stay date unavailable";
		}
		var todayDate = startOfDay(new Date());
		var diffDays = Math.round((checkInDate.getTime() - todayDate.getTime()) / 86400000);
		if (diffDays > 1) return String(diffDays) + " days to your stay";
		if (diffDays === 1) return "1 day to your stay";
		if (diffDays === 0) return "Today is your check-in day";
		return "Stay in progress";
	};

	var setFeedback = function (node, message, tone) {
		if (!node) return;
		node.textContent = message;
		node.classList.remove("is-success", "is-error");
		if (tone === "success") node.classList.add("is-success");
		if (tone === "error") node.classList.add("is-error");
	};

	var initGuestConsole = function () {
		var body = document.body;
		if (!body || String(body.getAttribute("data-force-role") || "") !== "guest") {
			return;
		}
		if (!document.getElementById("guest-welcome-section")) {
			return;
		}

		var userId = String(sessionStorage.getItem("everloftUserId") || "").trim() || FALLBACK_GUEST_USER_ID;
		var userName = String(sessionStorage.getItem("everloftUserName") || "Guest").trim() || "Guest";
		var guestData = guestDataByUserId[userId] || { upcoming: null, history: [], payments: [] };
		var upcoming = guestData.upcoming;
		var history = Array.isArray(guestData.history) ? guestData.history.slice() : [];
		var payments = Array.isArray(guestData.payments) ? guestData.payments.slice() : [];

		var profileStorageKey = "everloftGuestProfile::" + userId;
		var profileData = {};
		try {
			profileData = JSON.parse(localStorage.getItem(profileStorageKey) || "{}");
		} catch (_error) {
			profileData = {};
		}

		var setText = function (id, value) {
			var node = document.getElementById(id);
			if (node) node.textContent = value;
		};

		setText("guest-welcome-name", userName);

		var noBookingNode = document.getElementById("guest-no-booking");
		var upcomingCardNode = document.getElementById("guest-upcoming-card");
		if (!upcoming) {
			setText("guest-upcoming-property", "No upcoming stay");
			setText("guest-upcoming-checkin", "--");
			setText("guest-upcoming-checkout", "--");
			setText("guest-upcoming-countdown", "Plan your next Everloft experience");
			if (noBookingNode) noBookingNode.hidden = false;
			if (upcomingCardNode) upcomingCardNode.hidden = true;
			setText("guest-checkin-locked", "Instructions will be available when a booking is confirmed.");
			var checkinUnlockedEmpty = document.getElementById("guest-checkin-unlocked");
			if (checkinUnlockedEmpty) checkinUnlockedEmpty.hidden = true;
		} else {
			if (noBookingNode) noBookingNode.hidden = true;
			if (upcomingCardNode) upcomingCardNode.hidden = false;
			setText("guest-upcoming-property", upcoming.propertyName);
			setText("guest-upcoming-checkin", formatDate(upcoming.checkInDate));
			setText("guest-upcoming-checkout", formatDate(upcoming.checkOutDate));
			setText("guest-upcoming-countdown", getCountdownLabel(upcoming.checkInDate));
			setText("guest-booking-property", upcoming.propertyName);
			setText("guest-booking-location", upcoming.location);
			setText("guest-booking-dates", formatDate(upcoming.checkInDate) + " - " + formatDate(upcoming.checkOutDate));
			setText("guest-booking-guests", String(upcoming.guests));
			setText("guest-booking-payment", upcoming.paymentStatus);
			setText("guest-booking-host", upcoming.hostContact);
			var mapNode = document.getElementById("guest-booking-map");
			if (mapNode) mapNode.href = upcoming.mapLink;
			var detailsNode = document.getElementById("guest-booking-details");
			if (detailsNode) detailsNode.href = upcoming.propertyDetailsUrl;

			var checkInDate = new Date(upcoming.checkInDate);
			var unlockedNode = document.getElementById("guest-checkin-unlocked");
			var lockedNode = document.getElementById("guest-checkin-locked");
			var unlocked = !Number.isNaN(checkInDate.getTime()) && sameDate(new Date(), checkInDate);
			if (unlockedNode) unlockedNode.hidden = !unlocked;
			if (lockedNode) {
				lockedNode.hidden = unlocked;
				if (!unlocked) lockedNode.textContent = "Instructions will be available on arrival date.";
			}
			if (unlocked && upcoming.instructions) {
				setText("guest-checkin-entry", upcoming.instructions.entryInstructions);
				setText("guest-checkin-door", upcoming.instructions.doorLockCode);
				setText("guest-checkin-wifi", upcoming.instructions.wifiName + " / " + upcoming.instructions.wifiPassword);
				setText("guest-checkin-parking", upcoming.instructions.parkingInstructions);
				setText("guest-checkin-rules", upcoming.instructions.houseRules);
				setText("guest-checkin-emergency", upcoming.instructions.emergencyContact);
			}
		}

		var historyBody = document.getElementById("guest-history-body");
		if (historyBody) {
			historyBody.innerHTML = history.map(function (stay, index) {
				return "<tr>" +
					"<td data-label=\"Property\">" + escapeHtml(stay.propertyName) + "</td>" +
					"<td data-label=\"Dates\">" + escapeHtml(formatDate(stay.checkInDate) + " - " + formatDate(stay.checkOutDate)) + "</td>" +
					"<td data-label=\"Amount\">" + escapeHtml(formatInr(stay.amount)) + "</td>" +
					"<td data-label=\"Status\">" + escapeHtml(stay.status) + "</td>" +
					"<td data-label=\"Invoice\"><a href=\"#\" class=\"dash-link\">" + escapeHtml(stay.invoiceNumber + " PDF") + "</a></td>" +
					"<td data-label=\"Actions\"><button type=\"button\" class=\"button small guest-review-btn\" data-review-index=\"" + index + "\">Leave Review</button> <button type=\"button\" class=\"button small guest-rebook-btn\" data-rebook-index=\"" + index + "\">Rebook</button></td>" +
				"</tr>";
			}).join("");
		}

		var supportFeedbackNode = document.getElementById("guest-support-feedback");
		[
			{ id: "guest-support-cleaning", text: "Cleaning request sent." },
			{ id: "guest-support-maintenance", text: "Maintenance issue logged." },
			{ id: "guest-support-early", text: "Early check-in request submitted." },
			{ id: "guest-support-late", text: "Late checkout request submitted." },
			{ id: "guest-support-contact", text: "Support callback requested." }
		].forEach(function (item) {
			var node = document.getElementById(item.id);
			if (!node) return;
			node.addEventListener("click", function () {
				setFeedback(supportFeedbackNode, item.text + " Team will respond shortly.", "success");
			});
		});

		if (upcoming) {
			setText("guest-payment-total", formatInr(upcoming.bookingAmount));
			setText("guest-payment-paid", formatInr(upcoming.paidAmount));
			setText("guest-payment-pending", formatInr(upcoming.pendingAmount));
		}
		var paymentHistoryBody = document.getElementById("guest-payment-history-body");
		if (paymentHistoryBody) {
			paymentHistoryBody.innerHTML = payments.map(function (payment) {
				return "<tr>" +
					"<td data-label=\"Date\">" + escapeHtml(formatDate(payment.date)) + "</td>" +
					"<td data-label=\"Mode\">" + escapeHtml(payment.mode) + "</td>" +
					"<td data-label=\"Amount\">" + escapeHtml(formatInr(payment.amount)) + "</td>" +
					"<td data-label=\"Status\">" + escapeHtml(payment.status) + "</td>" +
					"<td data-label=\"Reference\">" + escapeHtml(payment.reference) + "</td>" +
				"</tr>";
			}).join("");
		}

		var canReview = false;
		if (history.length) {
			var latestCheckout = new Date(history[0].checkOutDate);
			canReview = !Number.isNaN(latestCheckout.getTime()) && startOfDay(latestCheckout).getTime() < startOfDay(new Date()).getTime();
		}
		var reviewAvailabilityNode = document.getElementById("guest-review-availability");
		if (reviewAvailabilityNode) {
			reviewAvailabilityNode.textContent = canReview ? "Review is open. Rate your latest stay and share feedback." : "Review option unlocks after checkout.";
		}
		var reviewForm = document.getElementById("guest-review-form");
		if (reviewForm) {
			reviewForm.hidden = !canReview;
		}
		var reviewFeedbackNode = document.getElementById("guest-review-feedback");
		var reviewSubmit = document.getElementById("guest-review-submit");
		if (reviewSubmit) {
			reviewSubmit.addEventListener("click", function () {
				if (!canReview) {
					setFeedback(reviewFeedbackNode, "Review can be submitted only after checkout.", "error");
					return;
				}
				var ratingNode = document.getElementById("guest-review-rating");
				var textNode = document.getElementById("guest-review-text");
				var photoNode = document.getElementById("guest-review-photo");
				var ratingValue = ratingNode ? Number(ratingNode.value || 0) : 0;
				var feedbackText = textNode ? String(textNode.value || "").trim() : "";
				if (!(ratingValue >= 1 && ratingValue <= 5)) {
					setFeedback(reviewFeedbackNode, "Please select a rating between 1 and 5.", "error");
					return;
				}
				if (!feedbackText) {
					setFeedback(reviewFeedbackNode, "Please enter feedback before submitting.", "error");
					return;
				}
				var photoName = photoNode && photoNode.files && photoNode.files[0] ? photoNode.files[0].name : "";
				var payload = [];
				try {
					payload = JSON.parse(localStorage.getItem("everloftGuestReviews") || "[]");
					if (!Array.isArray(payload)) payload = [];
				} catch (_error) {
					payload = [];
				}
				payload.push({
					userId: userId,
					rating: ratingValue,
					feedback: feedbackText,
					photoName: photoName,
					submittedAt: new Date().toISOString()
				});
				localStorage.setItem("everloftGuestReviews", JSON.stringify(payload));
				if (ratingNode) ratingNode.value = "";
				if (textNode) textNode.value = "";
				if (photoNode) photoNode.value = "";
				setFeedback(reviewFeedbackNode, "Review submitted successfully.", "success");
			});
		}

		var profileNameNode = document.getElementById("guest-profile-name");
		var profilePhoneNode = document.getElementById("guest-profile-phone");
		var profilePasswordNode = document.getElementById("guest-profile-password");
		var profileIdNode = document.getElementById("guest-profile-id-proof");
		var profileFeedbackNode = document.getElementById("guest-profile-feedback");
		if (profileNameNode) profileNameNode.value = profileData.name || userName;
		if (profilePhoneNode) profilePhoneNode.value = profileData.phone || "";
		if (profileIdNode) profileIdNode.value = profileData.idProof || "";
		var profileSave = document.getElementById("guest-profile-save-btn");
		if (profileSave) {
			profileSave.addEventListener("click", function () {
				var payload = {
					name: profileNameNode ? String(profileNameNode.value || "").trim() : "",
					phone: profilePhoneNode ? String(profilePhoneNode.value || "").trim() : "",
					idProof: profileIdNode ? String(profileIdNode.value || "").trim() : "",
					passwordUpdated: profilePasswordNode ? String(profilePasswordNode.value || "").trim().length > 0 : false,
					updatedAt: new Date().toISOString()
				};
				localStorage.setItem(profileStorageKey, JSON.stringify(payload));
				if (payload.name) {
					sessionStorage.setItem("everloftUserName", payload.name);
					setText("dashboard-user-name", payload.name);
					setText("guest-welcome-name", payload.name);
				}
				if (profilePasswordNode) profilePasswordNode.value = "";
				setFeedback(profileFeedbackNode, "Profile updated successfully.", "success");
			});
		}

		var bookNext = document.getElementById("guest-book-next-btn");
		if (bookNext) {
			bookNext.addEventListener("click", function () {
				window.location.href = "/";
			});
		}

		if (historyBody) {
			historyBody.addEventListener("click", function (event) {
				var reviewButton = event.target.closest(".guest-review-btn");
				if (reviewButton) {
					var reviewSection = document.getElementById("guest-review-section");
					if (reviewSection && typeof reviewSection.scrollIntoView === "function") {
						reviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
					}
					return;
				}
				var rebookButton = event.target.closest(".guest-rebook-btn");
				if (rebookButton) {
					window.location.href = "/";
				}
			});
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initGuestConsole);
	} else {
		initGuestConsole();
	}
})(window);
