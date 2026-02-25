(function () {
	const authFlag = sessionStorage.getItem("everloftAuth");
	if (authFlag !== "1") {
		window.location.href = "login.html";
		return;
	}

	const userName = sessionStorage.getItem("everloftUserName") || "User";
	const userNameNode = document.getElementById("dashboard-user-name");
	if (userNameNode) {
		userNameNode.textContent = userName;
	}

	const logoutNode = document.getElementById("dashboard-logout");
	if (logoutNode) {
		logoutNode.addEventListener("click", function () {
			sessionStorage.removeItem("everloftAuth");
			sessionStorage.removeItem("everloftUserName");
			sessionStorage.removeItem("everloftSessionLoginAt");
		});
	}

	const formatInr = function (value) {
		return "INR " + Number(value).toLocaleString("en-IN");
	};

	const formatCompactInr = function (value) {
		const absolute = Math.abs(Number(value));
		if (absolute >= 10000000) {
			return "INR " + (Number(value) / 10000000).toFixed(2).replace(/\.00$/, "") + "Cr";
		}

		if (absolute >= 100000) {
			return "INR " + (Number(value) / 100000).toFixed(2).replace(/\.00$/, "") + "L";
		}

		return formatInr(value);
	};

	const formatDateTime = function (rawValue) {
		const parsedDate = rawValue instanceof Date ? rawValue : new Date(rawValue);
		if (Number.isNaN(parsedDate.getTime())) {
			return "Not available";
		}

		return parsedDate.toLocaleString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	const clamp = function (value, min, max) {
		return Math.max(min, Math.min(max, value));
	};

	const setText = function (id, value) {
		const node = document.getElementById(id);
		if (node) {
			node.textContent = value;
		}
	};

	const rangeLabels = {
		monthly: "Monthly",
		quarterly: "Quarterly",
		yearly: "Yearly"
	};

	const rangeDefinitions = {
		monthly: {
			labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
			revenue: [168000, 184000, 207000, 241000],
			occupancy: [69, 73, 79, 86],
			adr: [6820, 7150, 7480, 7810],
			reportLabel: "Jan 2026",
			nextCycle: "05 Mar 2026",
			historyPeriods: ["Jan 2026", "Dec 2025", "Nov 2025"],
			comparisonTarget: "previous month",
			baselineNote: "Steady growth with stronger booking velocity in the recent cycle."
		},
		quarterly: {
			labels: ["Q1", "Q2", "Q3", "Q4"],
			revenue: [1720000, 1980000, 2240000, 2460000],
			occupancy: [68, 72, 77, 81],
			adr: [6940, 7320, 7610, 8040],
			reportLabel: "Q4 2025",
			nextCycle: "15 Apr 2026",
			historyPeriods: ["Q4 2025", "Q3 2025", "Q2 2025"],
			comparisonTarget: "last quarter",
			baselineNote: "Quarterly momentum is supported by direct bookings and peak-weekend premiums."
		},
		yearly: {
			labels: ["2022", "2023", "2024", "2025", "2026"],
			revenue: [4980000, 6150000, 7420000, 8840000, 10100000],
			occupancy: [62, 67, 71, 75, 79],
			adr: [6120, 6610, 7010, 7480, 8120],
			reportLabel: "FY 2026",
			nextCycle: "20 Jan 2027",
			historyPeriods: ["FY 2026", "FY 2025", "FY 2024"],
			comparisonTarget: "last year",
			baselineNote: "Yearly trend shows healthy scale-up with disciplined pricing and occupancy control."
		}
	};

	const assetProfiles = {
		all: {
			label: "All Assets",
			revenueFactor: 1,
			occDelta: 0,
			adrDelta: 0,
			assetCount: 3,
			assetNote: "2 live, 1 under development",
			expenseRatio: 0.26,
			underDevelopment: false
		},
		marari: {
			label: "Everloft Marari Cove",
			revenueFactor: 0.45,
			occDelta: 4,
			adrDelta: 450,
			assetCount: 1,
			assetNote: "Developed premium coastal asset",
			expenseRatio: 0.24,
			underDevelopment: false
		},
		kadavanthra: {
			label: "Everloft Kadavanthra Suites",
			revenueFactor: 0.35,
			occDelta: 2,
			adrDelta: 180,
			assetCount: 1,
			assetNote: "Leased urban short-stay asset",
			expenseRatio: 0.25,
			underDevelopment: false
		},
		wayanad: {
			label: "Everloft Wayanad Ridge",
			revenueFactor: 0.20,
			occDelta: -8,
			adrDelta: -260,
			assetCount: 1,
			assetNote: "Managed asset under staged onboarding",
			expenseRatio: 0.31,
			underDevelopment: true
		}
	};

	const buildDistributionRows = function (periods, revenueSeries, isPendingAsset) {
		const recentRevenue = revenueSeries.slice(-periods.length).reverse();
		return periods.map(function (period, index) {
			const gross = recentRevenue[index] || recentRevenue[recentRevenue.length - 1] || 0;
			const netAmount = Math.round(gross * 0.67);
			const status = isPendingAsset && index === 0 ? "Scheduled" : "Processed";
			return {
				period: period,
				netAmount: netAmount,
				status: status
			};
		});
	};

	const buildPayload = function (rangeKey, assetKey) {
		const base = rangeDefinitions[rangeKey] || rangeDefinitions.monthly;
		const profile = assetProfiles[assetKey] || assetProfiles.all;

		const revenue = base.revenue.map(function (value) {
			return Math.max(0, Math.round(value * profile.revenueFactor));
		});

		const occupancy = base.occupancy.map(function (value) {
			return clamp(Math.round(value + profile.occDelta), 45, 96);
		});

		const adr = base.adr.map(function (value) {
			return Math.max(4500, Math.round(value + profile.adrDelta));
		});

		const latestRevenue = revenue[revenue.length - 1];
		const previousRevenue = revenue[Math.max(0, revenue.length - 2)];
		const totalRevenue = revenue.reduce(function (sum, value) { return sum + value; }, 0);
		const avgOcc = Math.round(occupancy.reduce(function (sum, value) { return sum + value; }, 0) / occupancy.length);
		const avgAdr = Math.round(adr.reduce(function (sum, value) { return sum + value; }, 0) / adr.length);
		const nights = Math.max(1, Math.round(latestRevenue / Math.max(adr[adr.length - 1], 1)));

		const percentDelta = previousRevenue > 0
			? ((latestRevenue - previousRevenue) / previousRevenue) * 100
			: 0;
		const seasonComparison = (percentDelta >= 0 ? "+" : "") + percentDelta.toFixed(1) + "% vs " + base.comparisonTarget;

		const generated = latestRevenue;
		const expenses = Math.round(generated * profile.expenseRatio);
		const maintenance = Math.round(generated * 0.07);
		const net = Math.max(0, generated - expenses - maintenance);
		const payoutStatus = profile.underDevelopment ? "Scheduled" : "Processed";

		const contextualNote = profile.underDevelopment
			? "Asset is ramping inventory while maintaining rate integrity."
			: "Performance remains stable with strong weekend conversion.";

		return {
			rangeKey: rangeKey,
			assetKey: assetKey,
			profile: profile,
			labels: base.labels.slice(),
			revenue: revenue,
			occupancy: occupancy,
			adr: adr,
			latestOccupancy: occupancy[occupancy.length - 1],
			summary: {
				nights: nights.toLocaleString("en-IN"),
				adr: formatInr(avgAdr),
				occupancy: avgOcc + "%",
				revenue: formatCompactInr(latestRevenue),
				total: formatCompactInr(totalRevenue),
				avgOcc: avgOcc + "%",
				season: seasonComparison,
				note: contextualNote + " " + base.baselineNote
			},
			overview: {
				activeAssets: String(profile.assetCount),
				activeNote: profile.assetNote,
				occupancyStatus: occupancy[occupancy.length - 1] + "%",
				occupancyNote: rangeLabels[rangeKey] + " blended occupancy",
				monthPerformance: formatCompactInr(latestRevenue),
				performanceNote: "Gross revenue, " + rangeLabels[rangeKey].toLowerCase() + " cycle",
				latestReport: base.reportLabel,
				reportNote: "Published 03 Feb 2026"
			},
			revenueStack: {
				generated: formatInr(generated),
				expenses: "- " + formatInr(expenses),
				maintenance: "- " + formatInr(maintenance),
				net: formatInr(net)
			},
			payout: {
				status: payoutStatus,
				statusType: profile.underDevelopment ? "pending" : "done",
				nextCycle: base.nextCycle,
				historyRows: buildDistributionRows(base.historyPeriods, revenue, profile.underDevelopment)
			}
		};
	};

	const buildDrilldownRows = function (payload, periodIndex) {
		const periodRevenue = payload.revenue[periodIndex] || 0;
		const periodAdr = payload.adr[periodIndex] || 1;
		const periodNights = Math.max(1, Math.round(periodRevenue / Math.max(periodAdr, 1)));
		const channels = [
			{ name: "Direct", share: 0.34, status: "Settled" },
			{ name: "Airbnb", share: 0.41, status: "Settled" },
			{
				name: "Booking Platforms",
				share: 0.25,
				status: payload.profile.underDevelopment ? "In Review" : "Settled"
			}
		];

		let revenueAssigned = 0;
		let nightsAssigned = 0;
		return channels.map(function (channel, index) {
			const isLast = index === channels.length - 1;
			const channelRevenue = isLast
				? Math.max(0, periodRevenue - revenueAssigned)
				: Math.round(periodRevenue * channel.share);
			const channelNights = isLast
				? Math.max(0, periodNights - nightsAssigned)
				: Math.max(1, Math.round(periodNights * channel.share));

			revenueAssigned += channelRevenue;
			nightsAssigned += channelNights;

			return {
				period: payload.labels[periodIndex],
				channel: channel.name,
				nights: channelNights,
				revenue: channelRevenue,
				status: channel.status
			};
		});
	};

	const rangeFilterNode = document.getElementById("global-range-filter");
	const assetFilterNode = document.getElementById("global-asset-filter");
	const rangeButtons = Array.prototype.slice.call(document.querySelectorAll(".chart-range-btn"));
	const summaryNode = document.getElementById("period-summary");
	const noteNode = document.getElementById("chart-note");
	const distributionBody = document.getElementById("distribution-history-body");
	const drilldownBody = document.getElementById("drilldown-table-body");
	const alertListNode = document.getElementById("dashboard-alert-list");
	const alertContextNode = document.getElementById("alert-context");
	const payoutStatusChip = document.getElementById("payout-status-chip");
	const payoutNextCycle = document.getElementById("payout-next-cycle");
	const kpiNights = document.getElementById("kpi-nights");
	const kpiAdr = document.getElementById("kpi-adr");
	const kpiOcc = document.getElementById("kpi-occupancy");
	const kpiRev = document.getElementById("kpi-revenue");
	const assetCards = Array.prototype.slice.call(document.querySelectorAll(".asset-card[data-asset-key]"));

	if (!sessionStorage.getItem("everloftSessionLoginAt")) {
		sessionStorage.setItem("everloftSessionLoginAt", new Date().toISOString());
	}

	const renderSecuritySummary = function () {
		const previousSuccessfulLogin = localStorage.getItem("everloftPreviousSuccessfulLoginAt");
		const currentSuccessfulLogin = localStorage.getItem("everloftLastSuccessfulLoginAt");
		const lastFailedLogin = localStorage.getItem("everloftLastFailedLoginAt");
		const failedLoginCount = Number(localStorage.getItem("everloftFailedLogins") || "0");
		const sessionStart = sessionStorage.getItem("everloftSessionLoginAt");

		setText(
			"security-last-login",
			previousSuccessfulLogin
				? formatDateTime(previousSuccessfulLogin)
				: (currentSuccessfulLogin ? formatDateTime(currentSuccessfulLogin) : "First sign-in on this device")
		);
		setText("security-session-start", formatDateTime(sessionStart));
		setText("security-failed-count", String(failedLoginCount));
		setText(
			"security-last-failed",
			lastFailedLogin ? formatDateTime(lastFailedLogin) : "No failed attempts recorded"
		);
	};

	const renderFreshness = function () {
		const stampText = "Last updated: " + formatDateTime(new Date());
		[
			"overview-freshness",
			"performance-freshness",
			"revenue-chart-freshness",
			"mix-chart-freshness",
			"distribution-freshness",
			"asset-value-freshness"
		].forEach(function (id) {
			setText(id, stampText);
		});
	};

	const renderAlerts = function (payload) {
		if (!alertListNode) {
			return;
		}

		const alerts = [];
		if (payload.payout.statusType === "pending") {
			alerts.push({
				type: "critical",
				icon: "fa-exclamation-circle",
				text: "Payout for " + payload.profile.label + " is scheduled post onboarding milestone clearance."
			});
		} else {
			alerts.push({
				type: "info",
				icon: "fa-info-circle",
				text: "Next payout cycle is " + payload.payout.nextCycle + ". Statement release follows settlement lock."
			});
		}

		if (payload.latestOccupancy < 70) {
			alerts.push({
				type: "warning",
				icon: "fa-exclamation-triangle",
				text: "Occupancy is below portfolio target. Pricing and channel mix optimization is active."
			});
		} else {
			alerts.push({
				type: "success",
				icon: "fa-check-circle",
				text: "Occupancy is healthy for the selected scope and period."
			});
		}

		if (payload.assetKey === "all" || payload.assetKey === "wayanad") {
			alerts.push({
				type: "warning",
				icon: "fa-shield-alt",
				text: "Compliance review for Wayanad Ridge is due on 12 Mar 2026."
			});
		}

		alertListNode.innerHTML = alerts.map(function (alert) {
			return "<li class=\"alert-item is-" + alert.type + "\">" +
				"<span class=\"icon solid " + alert.icon + "\" aria-hidden=\"true\"></span>" +
				alert.text +
			"</li>";
		}).join("");
	};

	const renderDistributionHistory = function (payload) {
		if (!distributionBody) {
			return;
		}

		distributionBody.innerHTML = payload.payout.historyRows.map(function (row) {
			return "<tr>" +
				"<td data-label=\"Period\">" + row.period + "</td>" +
				"<td data-label=\"Net Amount\">" + formatInr(row.netAmount) + "</td>" +
				"<td data-label=\"Status\">" + row.status + "</td>" +
				"<td data-label=\"Statement\"><a href=\"#\" class=\"dash-link\"><span class=\"icon solid fa-download\" aria-hidden=\"true\"></span> PDF</a></td>" +
			"</tr>";
		}).join("");
	};

	const renderDrilldown = function (payload, periodIndex) {
		if (!drilldownBody) {
			return;
		}

		const rows = buildDrilldownRows(payload, periodIndex);
		setText(
			"drilldown-context",
			rangeLabels[payload.rangeKey] + " | " + payload.profile.label + " | " + payload.labels[periodIndex]
		);

		drilldownBody.innerHTML = rows.map(function (row) {
			return "<tr>" +
				"<td data-label=\"Period\">" + row.period + "</td>" +
				"<td data-label=\"Channel\">" + row.channel + "</td>" +
				"<td data-label=\"Nights\">" + row.nights + "</td>" +
				"<td data-label=\"Revenue\">" + formatInr(row.revenue) + "</td>" +
				"<td data-label=\"Status\">" + row.status + "</td>" +
			"</tr>";
		}).join("");
	};

	const syncRangeButtons = function (rangeKey) {
		rangeButtons.forEach(function (button) {
			button.classList.toggle("is-active", button.getAttribute("data-range") === rangeKey);
		});
	};

	const updateAssetVisibility = function (assetKey) {
		assetCards.forEach(function (card) {
			const cardAssetKey = card.getAttribute("data-asset-key");
			card.hidden = !(assetKey === "all" || cardAssetKey === assetKey);
		});
	};

	const state = {
		range: rangeFilterNode && rangeDefinitions[rangeFilterNode.value] ? rangeFilterNode.value : "monthly",
		asset: assetFilterNode && assetProfiles[assetFilterNode.value] ? assetFilterNode.value : "all",
		selectedPeriodIndex: null,
		payload: null
	};

	let revenueChart = null;
	let mixChart = null;

	const revenueCtx = document.getElementById("revenue-chart");
	const mixCtx = document.getElementById("mix-chart");
	const isCompactScreen = window.matchMedia("(max-width: 736px)").matches;

	if (window.Chart && revenueCtx && mixCtx) {
		const bootstrapPayload = buildPayload(state.range, state.asset);
		const gradient = revenueCtx.getContext("2d").createLinearGradient(0, 0, 0, 260);
		gradient.addColorStop(0, "rgba(94, 66, 166, 0.36)");
		gradient.addColorStop(1, "rgba(94, 66, 166, 0.03)");

		revenueChart = new Chart(revenueCtx, {
			type: "line",
			data: {
				labels: bootstrapPayload.labels,
				datasets: [{
					label: "Revenue",
					data: bootstrapPayload.revenue,
					borderColor: "#5e42a6",
					backgroundColor: gradient,
					fill: true,
					tension: 0.35,
					borderWidth: 3,
					pointRadius: isCompactScreen ? 2.4 : 4,
					pointBackgroundColor: "#4c338f"
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				onClick: function (_event, elements) {
					if (!elements || !elements.length || !state.payload) {
						return;
					}

					state.selectedPeriodIndex = elements[0].index;
					renderDrilldown(state.payload, state.selectedPeriodIndex);
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: function (context) {
								return " " + formatInr(context.raw);
							}
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							color: "#696492",
							maxRotation: 0,
							autoSkip: true,
							maxTicksLimit: isCompactScreen ? 4 : 7
						}
					},
					y: {
						grid: { color: "rgba(121, 105, 179, 0.2)" },
						title: { display: !isCompactScreen, text: "Revenue (INR)", color: "#5d5789" },
						ticks: {
							color: "#696492",
							maxTicksLimit: isCompactScreen ? 4 : 6,
							callback: function (value) {
								return "INR " + Number(value / 1000).toFixed(0) + "k";
							}
						}
					}
				}
			}
		});

		mixChart = new Chart(mixCtx, {
			type: "bar",
			data: {
				labels: bootstrapPayload.labels,
				datasets: [
					{
						type: "bar",
						label: "Occupancy %",
						data: bootstrapPayload.occupancy,
						backgroundColor: "rgba(79, 168, 207, 0.78)",
						borderRadius: isCompactScreen ? 4 : 6,
						yAxisID: "y"
					},
					{
						type: "line",
						label: "ADR (INR)",
						data: bootstrapPayload.adr,
						borderColor: "#f39f4c",
						backgroundColor: "rgba(243, 159, 76, 0.24)",
						borderWidth: 3,
						pointRadius: isCompactScreen ? 2.2 : 3,
						tension: 0.3,
						yAxisID: "y1"
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				onClick: function (_event, elements) {
					if (!elements || !elements.length || !state.payload) {
						return;
					}

					state.selectedPeriodIndex = elements[0].index;
					renderDrilldown(state.payload, state.selectedPeriodIndex);
				},
				plugins: {
					legend: {
						position: isCompactScreen ? "top" : "bottom",
						labels: {
							boxWidth: isCompactScreen ? 10 : 12,
							color: "#5f5a86",
							usePointStyle: true,
							pointStyle: "circle",
							font: { size: isCompactScreen ? 10 : 12 }
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						max: 100,
						grid: { color: "rgba(121, 105, 179, 0.2)" },
						title: { display: !isCompactScreen, text: "Occupancy %", color: "#5d5789" },
						ticks: { color: "#696492", maxTicksLimit: isCompactScreen ? 4 : 6 }
					},
					y1: {
						position: "right",
						grid: { drawOnChartArea: false },
						title: { display: !isCompactScreen, text: "ADR (INR)", color: "#5d5789" },
						ticks: {
							color: "#696492",
							maxTicksLimit: isCompactScreen ? 4 : 6,
							callback: function (value) {
								return (Number(value) / 1000).toFixed(1) + "k";
							}
						}
					},
					x: {
						ticks: {
							color: "#696492",
							maxRotation: 0,
							autoSkip: true,
							maxTicksLimit: isCompactScreen ? 4 : 7
						}
					}
				}
			}
		});
	}

	const applyState = function () {
		const payload = buildPayload(state.range, state.asset);
		state.payload = payload;

		if (state.selectedPeriodIndex === null || state.selectedPeriodIndex >= payload.labels.length) {
			state.selectedPeriodIndex = payload.labels.length - 1;
		}

		setText("overview-active-assets", payload.overview.activeAssets);
		setText("overview-active-note", payload.overview.activeNote);
		setText("overview-occupancy-status", payload.overview.occupancyStatus);
		setText("overview-occupancy-note", payload.overview.occupancyNote);
		setText("overview-month-performance", payload.overview.monthPerformance);
		setText("overview-performance-note", payload.overview.performanceNote);
		setText("overview-latest-report", payload.overview.latestReport);
		setText("overview-report-note", payload.overview.reportNote);

		if (kpiNights) kpiNights.textContent = payload.summary.nights;
		if (kpiAdr) kpiAdr.textContent = payload.summary.adr;
		if (kpiOcc) kpiOcc.textContent = payload.summary.occupancy;
		if (kpiRev) kpiRev.textContent = payload.summary.revenue;

		setText("revenue-generated", payload.revenueStack.generated);
		setText("revenue-expenses", payload.revenueStack.expenses);
		setText("revenue-maintenance", payload.revenueStack.maintenance);
		setText("revenue-net", payload.revenueStack.net);

		if (noteNode) {
			noteNode.textContent = payload.summary.note;
		}

		if (summaryNode) {
			summaryNode.innerHTML =
				"<p><strong>Total Revenue:</strong> " + payload.summary.total + "</p>" +
				"<p><strong>Average Occupancy:</strong> " + payload.summary.avgOcc + "</p>" +
				"<p><strong>Seasonal Comparison:</strong> " + payload.summary.season + "</p>";
		}

		if (payoutStatusChip) {
			const isPending = payload.payout.statusType === "pending";
			const iconClass = isPending ? "fa-clock" : "fa-check-circle";
			payoutStatusChip.className = "status-chip " + (isPending ? "is-pending" : "is-done");
			payoutStatusChip.innerHTML = "<span class=\"icon solid " + iconClass + "\" aria-hidden=\"true\"></span> " + payload.payout.status;
		}

		if (payoutNextCycle) {
			payoutNextCycle.textContent = payload.payout.nextCycle;
		}

		if (alertContextNode) {
			alertContextNode.textContent = payload.profile.label + " | " + rangeLabels[payload.rangeKey];
		}

		updateAssetVisibility(payload.assetKey);
		renderAlerts(payload);
		renderDistributionHistory(payload);
		renderDrilldown(payload, state.selectedPeriodIndex);
		renderFreshness();
		renderSecuritySummary();

		if (revenueChart && mixChart) {
			revenueChart.data.labels = payload.labels;
			revenueChart.data.datasets[0].data = payload.revenue;
			revenueChart.update();

			mixChart.data.labels = payload.labels;
			mixChart.data.datasets[0].data = payload.occupancy;
			mixChart.data.datasets[1].data = payload.adr;
			mixChart.update();
		}

		syncRangeButtons(state.range);
	};

	if (rangeFilterNode) {
		rangeFilterNode.addEventListener("change", function () {
			state.range = rangeDefinitions[rangeFilterNode.value] ? rangeFilterNode.value : "monthly";
			applyState();
		});
	}

	if (assetFilterNode) {
		assetFilterNode.addEventListener("change", function () {
			state.asset = assetProfiles[assetFilterNode.value] ? assetFilterNode.value : "all";
			applyState();
		});
	}

	rangeButtons.forEach(function (button) {
		button.addEventListener("click", function () {
			const selectedRange = button.getAttribute("data-range");
			if (!rangeDefinitions[selectedRange]) {
				return;
			}

			state.range = selectedRange;
			if (rangeFilterNode) {
				rangeFilterNode.value = selectedRange;
			}
			applyState();
		});
	});

	if (rangeFilterNode) {
		rangeFilterNode.value = state.range;
	}
	if (assetFilterNode) {
		assetFilterNode.value = state.asset;
	}

	applyState();
})();

