(function (global) {
	var app = global.EverloftMVP;
	if (!app) {
		return;
	}

	app.Presenters.dashboard = function DashboardPresenter() {};
	app.Presenters.dashboard.prototype.init = function () {
	const authFlag = sessionStorage.getItem("everloftAuth");
	if (authFlag !== "1") {
		window.location.href = "/login/";
		return;
	}

	const shellWidget = app.Widgets && app.Widgets.dashboard && app.Widgets.dashboard.DashboardShellWidget
		? new app.Widgets.dashboard.DashboardShellWidget()
		: null;

	const userName = sessionStorage.getItem("everloftUserName") || "User";
	if (shellWidget) {
		shellWidget.applyUserName(userName);
		shellWidget.bindLogout(function () {
			shellWidget.clearSession();
		});
	} else {
		const userNameNode = document.getElementById("dashboard-user-name");
		if (userNameNode) {
			userNameNode.textContent = userName;
		}

		const logoutNode = document.getElementById("dashboard-logout");
		if (logoutNode) {
			logoutNode.addEventListener("click", function () {
				[
					"everloftAuth",
					"everloftUserName",
					"everloftUserRole",
					"everloftUserRoleLabel",
					"everloftUserId",
					"everloftSessionLoginAt"
				].forEach(function (key) {
					sessionStorage.removeItem(key);
				});
			});
		}
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

	const normalizeRole = function (value) {
		return String(value || "")
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "");
	};

	const roleAliases = {
		super_admin: "super_admin",
		superadmin: "super_admin",
		finance_admin: "finance_admin",
		financeadmin: "finance_admin",
		operations_manager: "operations_manager",
		operationsmanager: "operations_manager",
		operations_admin: "operations_manager",
		operationsadmin: "operations_manager",
		tech_admin: "tech_admin",
		techadmin: "tech_admin",
		property_manager: "property_manager",
		propertymanager: "property_manager",
		housekeeping: "housekeeping",
		housekeeping_staff: "housekeeping",
		housekeepingstaff: "housekeeping",
		maintenance: "maintenance",
		maintenance_staff: "maintenance",
		maintenancestaff: "maintenance",
		guest_support: "guest_support",
		guestsupport: "guest_support",
		investor: "investor",
		property_owner: "property_owner",
		propertyowner: "property_owner",
		owner: "property_owner",
		guest: "guest",
		customer: "guest"
	};

	const resolveRole = function (value) {
		const normalized = normalizeRole(value);
		if (!normalized) {
			return "investor";
		}
		if (roleAliases[normalized]) {
			return roleAliases[normalized];
		}
		const compact = normalized.replace(/_/g, "");
		if (roleAliases[compact]) {
			return roleAliases[compact];
		}
		return normalized;
	};

	const roleProfiles = {
		super_admin: {
			label: "Super Admin",
			level: "Level 1 - Super Admin",
			heroEyebrow: "Founder Control Console",
			heroDescription: "Full system governance across properties, finance, roles, onboarding, and payout approvals.",
			permissions: ["view_property", "edit_property", "view_financials", "approve_payout", "assign_task", "manage_users", "manage_system", "manage_content"],
			allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly", "quarterly", "yearly"],
			defaultAsset: "all",
			defaultRange: "monthly"
		},
		finance_admin: {
			label: "Finance Admin",
			level: "Level 2 - Department Admin",
			heroEyebrow: "Finance Control Console",
			heroDescription: "Revenue reports, expense tracking, payout management, and commission calculations with no system settings control.",
			permissions: ["view_property", "view_financials", "approve_payout"],
			allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly", "quarterly", "yearly"],
			defaultAsset: "all",
			defaultRange: "monthly"
		},
		operations_manager: {
			label: "Operations Manager",
			level: "Level 2 - Department Admin",
			heroEyebrow: "Operations Control Console",
			heroDescription: "Booking operations, property calendars, staff assignments, and maintenance tracking across active assets.",
			permissions: ["view_property", "edit_property", "assign_task", "manage_bookings"],
			allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly", "quarterly"],
			defaultAsset: "all",
			defaultRange: "monthly"
		},
		tech_admin: {
			label: "Tech/Admin",
			level: "Level 2 - Department Admin",
			heroEyebrow: "Platform Admin Console",
			heroDescription: "User access governance, website backend updates, and content publishing operations.",
			permissions: ["manage_users", "manage_system", "manage_content", "view_property"],
			allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly"],
			defaultAsset: "all",
			defaultRange: "monthly"
		},
		property_manager: {
			label: "Property Manager",
			level: "Level 3 - Operational Staff",
			heroEyebrow: "Operational Staff Console",
			heroDescription: "Task-level execution for assigned properties with no financial visibility.",
			permissions: ["view_property", "edit_property", "assign_task"],
			allowedAssets: ["marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly"],
			defaultAsset: "marari",
			defaultRange: "monthly"
		},
		housekeeping: {
			label: "Housekeeping Staff",
			level: "Level 3 - Operational Staff",
			heroEyebrow: "Housekeeping Task Console",
			heroDescription: "Cleaning schedules, check-in turnover tasks, and completion status for assigned properties.",
			permissions: ["view_property", "assign_task"],
			allowedAssets: ["marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly"],
			defaultAsset: "marari",
			defaultRange: "monthly"
		},
		maintenance: {
			label: "Maintenance Staff",
			level: "Level 3 - Operational Staff",
			heroEyebrow: "Maintenance Task Console",
			heroDescription: "Issue tracking, repair assignments, and closure updates for property infrastructure.",
			permissions: ["view_property", "assign_task"],
			allowedAssets: ["marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly"],
			defaultAsset: "kadavanthra",
			defaultRange: "monthly"
		},
		guest_support: {
			label: "Guest Support",
			level: "Level 3 - Operational Staff",
			heroEyebrow: "Guest Support Console",
			heroDescription: "Support ticket triage, response SLAs, and escalation management.",
			permissions: ["assign_task", "manage_bookings"],
			allowedAssets: ["all", "marari", "kadavanthra", "wayanad"],
			allowedRanges: ["monthly"],
			defaultAsset: "all",
			defaultRange: "monthly"
		},
		investor: {
			label: "Investor",
			level: "External Layer - Investor",
			heroEyebrow: "Investor Transparency Console",
			heroDescription: "Own-portfolio revenue, expense, occupancy, payout, and statement visibility for trust-driven reporting.",
			permissions: ["view_property", "view_financials", "view_only_own_data"],
			allowedAssets: ["marari"],
			allowedRanges: ["monthly", "quarterly"],
			defaultAsset: "marari",
			defaultRange: "monthly"
		},
		property_owner: {
			label: "Property Owner",
			level: "External Layer - Property Owner",
			heroEyebrow: "Owner Performance Console",
			heroDescription: "Property performance and booking visibility with revenue and commission tracking.",
			permissions: ["view_property", "view_financials", "view_only_own_data"],
			allowedAssets: ["kadavanthra"],
			allowedRanges: ["monthly", "quarterly"],
			defaultAsset: "kadavanthra",
			defaultRange: "monthly"
		},
		guest: {
			label: "Guest / Customer",
			level: "External Layer - Guest",
			heroEyebrow: "Guest Stay Console",
			heroDescription: "Booking history, upcoming stays, invoices, and support updates without backend financial visibility.",
			permissions: ["view_only_own_data"],
			allowedAssets: ["marari"],
			allowedRanges: ["monthly"],
			defaultAsset: "marari",
			defaultRange: "monthly"
		}
	};

	const permissionLabels = {
		view_property: "view_property",
		edit_property: "edit_property",
		view_financials: "view_financials",
		approve_payout: "approve_payout",
		assign_task: "assign_task",
		view_only_own_data: "view_only_own_data",
		manage_users: "manage_users",
		manage_system: "manage_system",
		manage_content: "manage_content",
		manage_bookings: "manage_bookings"
	};

	const resolvedRoleCandidate = resolveRole(sessionStorage.getItem("everloftUserRole") || localStorage.getItem("everloftLastResolvedRole"));
	const activeRoleKey = roleProfiles[resolvedRoleCandidate] ? resolvedRoleCandidate : "investor";
	const activeRole = roleProfiles[activeRoleKey];
	const activePermissions = activeRole.permissions.reduce(function (acc, permission) {
		acc[permission] = true;
		return acc;
	}, {});

	const hasPermission = function (permission) {
		return Boolean(activePermissions[permission]);
	};

	const hasAnyPermission = function (expression) {
		if (!expression) {
			return true;
		}

		return String(expression)
			.split("|")
			.map(function (part) { return part.trim(); })
			.filter(function (part) { return part.length > 0; })
			.some(function (permission) { return hasPermission(permission); });
	};

	sessionStorage.setItem("everloftUserRole", activeRoleKey);
	sessionStorage.setItem("everloftUserRoleLabel", activeRole.label);

	const heroEyebrowNode = document.querySelector(".dashboard-hero .eyebrow");
	if (heroEyebrowNode) {
		heroEyebrowNode.textContent = activeRole.heroEyebrow;
	}
	const heroDescriptionNode = document.getElementById("dashboard-hero-description");
	if (heroDescriptionNode) {
		heroDescriptionNode.textContent = activeRole.heroDescription;
	}

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
	const roleWorkspaceTitleNode = document.getElementById("role-workspace-title");
	const roleLevelTextNode = document.getElementById("role-level-text");
	const rolePermissionCountNode = document.getElementById("role-permission-count");
	const roleWorkspaceNoteNode = document.getElementById("role-workspace-note");
	const rolePermissionChipsNode = document.getElementById("role-permission-chips");
	const roleSummaryGridNode = document.getElementById("role-summary-grid");
	const roleActivityHeadNode = document.getElementById("role-activity-head");
	const roleActivityBodyNode = document.getElementById("role-activity-body");

	const filterKeys = function (rawKeys, fallbackKeys) {
		const source = Array.isArray(rawKeys) && rawKeys.length ? rawKeys : fallbackKeys;
		const deduped = [];
		source.forEach(function (key) {
			if (fallbackKeys.indexOf(key) !== -1 && deduped.indexOf(key) === -1) {
				deduped.push(key);
			}
		});
		return deduped.length ? deduped : fallbackKeys.slice();
	};

	const availableRangeKeys = Object.keys(rangeDefinitions);
	const availableAssetKeys = Object.keys(assetProfiles);
	const allowedRangeKeys = filterKeys(activeRole.allowedRanges, availableRangeKeys);
	const allowedAssetKeys = filterKeys(activeRole.allowedAssets, availableAssetKeys);

	const applyPermissionVisibility = function () {
		const guardedNodes = Array.prototype.slice.call(document.querySelectorAll("[data-permissions]"));
		guardedNodes.forEach(function (node) {
			const expression = node.getAttribute("data-permissions");
			node.hidden = !hasAnyPermission(expression);
		});
	};

	const buildRoleWorkspace = function (payload) {
		switch (activeRoleKey) {
		case "super_admin":
			return {
				title: "Executive Command Center",
				note: "Founder-level control with full authority across users, finance approvals, and system operations.",
				cards: [
					{ label: "Active Access Roles", value: "11", note: "Department + staff + external roles live" },
					{ label: "Portfolio Gross", value: payload.summary.total, note: "Aggregated across all monitored properties" },
					{ label: "Payout Approvals", value: "3 Pending", note: "Awaiting final super-admin sign-off" }
				],
				headers: ["Control Area", "Owner", "Status", "Next Action"],
				rows: [
					["Revenue Share Policy", "Finance Team", "Review Required", "Approve v2.4 matrix"],
					["Investor Onboarding Queue", "Investor Relations", "5 Pending", "Complete KYC verification"],
					["Commission Rules", "Core Admin", "Locked", "Open March cycle"],
					["New Asset Onboarding", "Operations", "In Progress", "Finalize Wayanad checklist"]
				],
				alerts: [
					{ type: "critical", icon: "fa-user-shield", text: "3 high-privilege role changes are waiting for final approval." }
				],
				restrictedOverview: {
					value: "Control Matrix Active",
					note: "System governance and cross-team controls",
					report: "Admin Console",
					reportNote: "Policy and access model snapshot"
				}
			};
		case "finance_admin":
			return {
				title: "Finance Operations Workspace",
				note: "Finance-admin scope: revenue, expense, payout, and commission workflows without system settings control.",
				cards: [
					{ label: "Revenue Recorded", value: payload.summary.total, note: "Current selected period" },
					{ label: "Expense Entries", value: "46", note: "Entries posted in this cycle" },
					{ label: "Payout Batch", value: payload.payout.status, note: "Settlement state for next run" }
				],
				headers: ["Ledger Stream", "Owner", "Status", "Next Action"],
				rows: [
					["Monthly Revenue Ledger", "Finance Ops", "Reconciled", "Publish final workbook"],
					["Expense Validation", "Accounts", "7 In Review", "Close pending invoices"],
					["Commission Calculation", "Finance Ops", "Prepared", "Run approval check"],
					["Payout Register", "Treasury", "Scheduled", "Release on cycle date"]
				],
				alerts: [
					{ type: "warning", icon: "fa-wallet", text: "2 payout lines flagged for manual finance review before release." }
				],
				restrictedOverview: {
					value: payload.summary.revenue,
					note: "Finance-monitored gross for active scope",
					report: payload.overview.latestReport,
					reportNote: "Finance workbook refreshed"
				}
			};
		case "operations_manager":
			return {
				title: "Operations Management Workspace",
				note: "Operations scope for booking control, housekeeping assignments, and maintenance throughput.",
				cards: [
					{ label: "Active Bookings", value: "87", note: "Across all managed listings" },
					{ label: "Turnovers Today", value: "14", note: "Check-out to check-in transitions" },
					{ label: "Open Service Issues", value: "5", note: "2 critical, 3 normal priority" }
				],
				headers: ["Ops Stream", "Owner", "Status", "Next Action"],
				rows: [
					["Property Calendar Blocks", "Ops Desk", "2 Conflicts", "Resolve overlap requests"],
					["Housekeeping Assignment", "Shift Lead", "On Track", "Close 6 pending rooms"],
					["Maintenance Queue", "Tech Team", "Backlog 5", "Escalate 2 urgent repairs"],
					["Guest Escalations", "Support", "4 Open", "Close before 6 PM"]
				],
				alerts: [
					{ type: "warning", icon: "fa-calendar-check", text: "Weekend occupancy spike requires additional housekeeping allocation." }
				],
				restrictedOverview: {
					value: "14 Turnovers",
					note: "Operational handovers scheduled today",
					report: "Ops Cycle",
					reportNote: "No financial visibility for this role"
				}
			};
		case "tech_admin":
			return {
				title: "Platform Access Workspace",
				note: "Tech/Admin scope for user access, backend reliability, and website content governance.",
				cards: [
					{ label: "User Access Requests", value: "9", note: "Pending role changes" },
					{ label: "Uptime (30d)", value: "99.94%", note: "Service reliability across core pages" },
					{ label: "Content Jobs", value: "12", note: "Pending publish/update tasks" }
				],
				headers: ["Platform Area", "Owner", "Status", "Next Action"],
				rows: [
					["Role Access Queue", "Tech Admin", "9 Pending", "Approve least-privilege requests"],
					["Dashboard Build", "Web Ops", "Healthy", "Run release smoke test"],
					["Content Pipeline", "Content Team", "In Progress", "Publish investor update"],
					["Security Logs", "Tech Admin", "Stable", "Review anomaly digest"]
				],
				alerts: [
					{ type: "info", icon: "fa-user-lock", text: "New onboarding wave requires role provisioning for 4 staff accounts." }
				],
				restrictedOverview: {
					value: "9 Access Requests",
					note: "Pending user-role provisioning",
					report: "Tech Ops",
					reportNote: "System and access governance view"
				}
			};
		case "property_manager":
			return {
				title: "Property Manager Workspace",
				note: "Task-oriented property operations with assignment and progress tracking only.",
				cards: [
					{ label: "Assigned Properties", value: "2", note: "Marari Cove and Wayanad Ridge" },
					{ label: "Open Tasks", value: "18", note: "Housekeeping + issue follow-up" },
					{ label: "Task Completion", value: "88%", note: "Current weekly completion rate" }
				],
				headers: ["Task Group", "Owner", "Status", "Next Action"],
				rows: [
					["Check-in Readiness", "Site Team", "6/7 Ready", "Close Wayanad villa prep"],
					["Housekeeping QC", "Property Manager", "On Track", "Complete room audit run"],
					["Minor Repairs", "Maintenance", "3 Open", "Close before weekend demand"],
					["Guest Requests", "Support", "2 Open", "Follow up within SLA"]
				],
				alerts: [
					{ type: "warning", icon: "fa-tools", text: "Three turnaround tasks are due in the next 4 hours." }
				],
				restrictedOverview: {
					value: "18 Open Tasks",
					note: "Current assigned operations workload",
					report: "Operations Snapshot",
					reportNote: "Financial data hidden"
				}
			};
		case "housekeeping":
			return {
				title: "Housekeeping Assignment Workspace",
				note: "Room turnover, cleaning schedules, and task completion updates for assigned shifts.",
				cards: [
					{ label: "Rooms Assigned", value: "11", note: "Today's cleaning roster" },
					{ label: "Turnovers Due", value: "6", note: "Before 2 PM check-ins" },
					{ label: "Completion Rate", value: "82%", note: "Current shift performance" }
				],
				headers: ["Cleaning Task", "Property", "Status", "Next Action"],
				rows: [
					["Checkout Cleaning", "Marari Cove", "4 Done", "Complete 2 remaining suites"],
					["Deep Clean Cycle", "Kadavanthra Suites", "Scheduled", "Run at 4 PM"],
					["Linen Restock", "Marari Cove", "Pending", "Close before evening check-in"],
					["Supervisor Audit", "All Assigned", "Queued", "Submit checklist photos"]
				],
				alerts: [
					{ type: "warning", icon: "fa-broom", text: "2 rooms are nearing late-clean threshold for today." }
				],
				restrictedOverview: {
					value: "11 Rooms",
					note: "Cleaning schedule assigned for this shift",
					report: "Task Sheet",
					reportNote: "Operational-only visibility"
				}
			};
		case "maintenance":
			return {
				title: "Maintenance Task Workspace",
				note: "Repair ticket assignment and closure tracking with before/after update workflow.",
				cards: [
					{ label: "Open Repair Tickets", value: "9", note: "Across assigned properties" },
					{ label: "Critical Issues", value: "2", note: "Immediate response required" },
					{ label: "Avg Closure Time", value: "5.3h", note: "Last 14-day average" }
				],
				headers: ["Issue Type", "Property", "Status", "Next Action"],
				rows: [
					["AC Repair", "Kadavanthra Suites", "In Progress", "Upload completion photos"],
					["Water Pressure", "Marari Cove", "Pending Parts", "Receive valve kit"],
					["Door Lock Fault", "Wayanad Ridge", "Assigned", "Close before check-in"],
					["Lighting Audit", "All Assigned", "Scheduled", "Run preventive check"]
				],
				alerts: [
					{ type: "critical", icon: "fa-exclamation-triangle", text: "Two high-priority repairs are still open at guest-facing units." }
				],
				restrictedOverview: {
					value: "9 Tickets",
					note: "Assigned maintenance issues in queue",
					report: "Repair Log",
					reportNote: "Operational-only visibility"
				}
			};
		case "guest_support":
			return {
				title: "Guest Support Workspace",
				note: "Support queue triage for guest requests, escalation management, and response SLA tracking.",
				cards: [
					{ label: "Open Tickets", value: "13", note: "Guest and booking support issues" },
					{ label: "SLA Compliance", value: "94%", note: "Resolved within SLA window" },
					{ label: "Escalations", value: "3", note: "Requires manager review" }
				],
				headers: ["Support Queue", "Owner", "Status", "Next Action"],
				rows: [
					["Pre-arrival Requests", "Support Desk", "5 Open", "Send confirmations"],
					["Check-in Issues", "Guest Support", "2 Escalated", "Coordinate with operations"],
					["Refund Requests", "Finance Liaison", "In Review", "Update guest timeline"],
					["Post-stay Feedback", "Support Desk", "Ongoing", "Close unresolved threads"]
				],
				alerts: [
					{ type: "warning", icon: "fa-headset", text: "Three guest escalations are nearing SLA breach threshold." }
				],
				restrictedOverview: {
					value: "13 Tickets",
					note: "Support queue currently active",
					report: "Support Queue",
					reportNote: "Financial data hidden"
				}
			};
		case "property_owner":
			return {
				title: "Property Owner Workspace",
				note: "Own-property bookings, revenue summary, commission impact, and maintenance snapshots.",
				cards: [
					{ label: "Booked Nights", value: payload.summary.nights, note: "Current selected cycle" },
					{ label: "Net Revenue", value: payload.revenueStack.net, note: "After operations and reserve" },
					{ label: "Commission Applied", value: "12%", note: "As per management agreement" }
				],
				headers: ["Owner Feed", "Period", "Status", "Next Action"],
				rows: [
					["Monthly Revenue Summary", payload.overview.latestReport, "Published", "Download statement"],
					["Booking Calendar", payload.profile.label, "Healthy", "Review blocked dates"],
					["Guest Reviews", "Current Cycle", "4.7 / 5", "Close response drafts"],
					["Maintenance Updates", "Current Cycle", "2 Open", "Track closure ETA"]
				],
				alerts: [
					{ type: "info", icon: "fa-home", text: "Owner dashboard is restricted to your managed property data only." }
				],
				restrictedOverview: {
					value: payload.revenueStack.net,
					note: "Owner net summary for the selected cycle",
					report: payload.overview.latestReport,
					reportNote: "Own data + commission view"
				}
			};
		case "guest":
			return {
				title: "Guest Account Workspace",
				note: "Booking history, upcoming stays, invoices, and support updates for your account only.",
				cards: [
					{ label: "Upcoming Stay", value: "07 Mar 2026", note: "Everloft Marari Cove - 2 nights" },
					{ label: "Past Bookings", value: "4", note: "Completed stays in your profile" },
					{ label: "Open Support Tickets", value: "1", note: "Resolution ETA: 6 hours" }
				],
				headers: ["Guest Activity", "Reference", "Status", "Next Action"],
				rows: [
					["Booking #EL-G-1024", "07 Mar 2026", "Confirmed", "Download invoice"],
					["Invoice #INV-8891", "Latest Stay", "Issued", "Save PDF copy"],
					["Support Ticket #T-44", "Room Preferences", "Open", "Await support reply"],
					["Profile Verification", "Account", "Complete", "No action required"]
				],
				alerts: [
					{ type: "success", icon: "fa-check-circle", text: "Your next stay is confirmed and pre-arrival details are available." }
				],
				restrictedOverview: {
					value: "Upcoming Stay",
					note: "Guest account view with booking-only scope",
					report: "Guest Access",
					reportNote: "No backend financial visibility"
				}
			};
		default:
			return {
				title: "Investor Workspace",
				note: "Investor-level transparency with revenue, expense, occupancy, and payout visibility.",
				cards: [
					{ label: "Ownership Share", value: "18.0%", note: "In selected property scope" },
					{ label: "Net Profit", value: payload.revenueStack.net, note: "Current selected cycle" },
					{ label: "Occupancy", value: payload.summary.occupancy, note: "Current cycle blended occupancy" }
				],
				headers: ["Investor Feed", "Period", "Status", "Next Action"],
				rows: [
					["Performance Report", payload.overview.latestReport, "Published", "Download statement"],
					["Payout Status", payload.payout.nextCycle, payload.payout.status, "Track settlement"],
					["Expense Breakdown", "Current Cycle", "Available", "Review line items"],
					["Upcoming Bookings", payload.profile.label, "Visible", "Monitor occupancy trend"]
				],
				alerts: [
					{ type: "info", icon: "fa-chart-line", text: "Investor access is restricted to your own property and payout records." }
				],
				restrictedOverview: {
					value: payload.summary.revenue,
					note: "Own-investment cycle performance",
					report: payload.overview.latestReport,
					reportNote: "Investor transparency snapshot"
				}
			};
		}
	};

	const renderRoleWorkspace = function (workspace) {
		if (roleWorkspaceTitleNode) {
			roleWorkspaceTitleNode.textContent = workspace.title;
		}
		if (roleLevelTextNode) {
			roleLevelTextNode.textContent = activeRole.level;
		}
		if (rolePermissionCountNode) {
			rolePermissionCountNode.textContent = "Permissions: " + activeRole.permissions.length;
		}
		if (roleWorkspaceNoteNode) {
			roleWorkspaceNoteNode.textContent = workspace.note;
		}
		if (rolePermissionChipsNode) {
			rolePermissionChipsNode.innerHTML = activeRole.permissions.map(function (permission) {
				return "<li class=\"permission-chip\">" + (permissionLabels[permission] || permission) + "</li>";
			}).join("");
		}
		if (roleSummaryGridNode) {
			roleSummaryGridNode.innerHTML = workspace.cards.map(function (card) {
				return "<article class=\"summary-card\">" +
					"<p class=\"summary-label\">" + card.label + "</p>" +
					"<p class=\"summary-value\">" + card.value + "</p>" +
					"<p class=\"summary-note\">" + card.note + "</p>" +
				"</article>";
			}).join("");
		}
		if (roleActivityHeadNode) {
			roleActivityHeadNode.innerHTML = workspace.headers.map(function (header) {
				return "<th>" + header + "</th>";
			}).join("");
		}
		if (roleActivityBodyNode) {
			roleActivityBodyNode.innerHTML = workspace.rows.map(function (row) {
				return "<tr>" + row.map(function (cell, index) {
					const heading = workspace.headers[index] || "Item";
					return "<td data-label=\"" + heading + "\">" + cell + "</td>";
				}).join("") + "</tr>";
			}).join("");
		}
	};

	if (!sessionStorage.getItem("everloftSessionLoginAt")) {
		sessionStorage.setItem("everloftSessionLoginAt", new Date().toISOString());
	}

	const renderSecuritySummary = function () {
		const previousSuccessfulLogin = localStorage.getItem("everloftPreviousSuccessfulLoginAt");
		const currentSuccessfulLogin = localStorage.getItem("everloftLastSuccessfulLoginAt");
		const lastFailedLogin = localStorage.getItem("everloftLastFailedLoginAt");
		const failedLoginCount = Number(localStorage.getItem("everloftFailedLogins") || "0");
		const sessionStart = sessionStorage.getItem("everloftSessionLoginAt");
		const roleLineNode = document.getElementById("security-role-line");
		if (roleLineNode) {
			roleLineNode.innerHTML = "<span class=\"icon solid fa-user-lock\" aria-hidden=\"true\"></span> " +
				activeRole.label + " session with " + activeRole.permissions.length + " permissions.";
		}

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

	const renderAlerts = function (payload, workspace) {
		if (!alertListNode) {
			return;
		}

		const alerts = [];
		if (workspace && Array.isArray(workspace.alerts)) {
			workspace.alerts.forEach(function (alert) {
				alerts.push(alert);
			});
		}

		if (hasPermission("view_financials")) {
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
		}

		if (hasPermission("assign_task")) {
			alerts.push({
				type: "warning",
				icon: "fa-tasks",
				text: "Task assignment queue has time-bound items that need closure in this cycle."
			});
		}

		if (hasPermission("view_only_own_data")) {
			alerts.push({
				type: "info",
				icon: "fa-user-lock",
				text: "Access is scoped to your own data as per role-based session policy."
			});
		}

		if (!alerts.length) {
			alerts.push({
				type: "info",
				icon: "fa-info-circle",
				text: "No high-priority alerts at the moment for this role."
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
			const buttonRange = button.getAttribute("data-range");
			const isAllowed = allowedRangeKeys.indexOf(buttonRange) !== -1;
			button.hidden = !isAllowed;
			button.classList.toggle("is-active", isAllowed && buttonRange === rangeKey);
		});
	};

	const updateAssetVisibility = function (assetKey) {
		assetCards.forEach(function (card) {
			const cardAssetKey = card.getAttribute("data-asset-key");
			card.hidden = !(assetKey === "all" || cardAssetKey === assetKey);
		});
	};

	const applyFilterAccess = function (state) {
		if (rangeFilterNode) {
			Array.prototype.slice.call(rangeFilterNode.options).forEach(function (option) {
				option.hidden = allowedRangeKeys.indexOf(option.value) === -1;
			});
			if (allowedRangeKeys.indexOf(state.range) === -1) {
				state.range = allowedRangeKeys[0];
			}
			rangeFilterNode.value = state.range;
			rangeFilterNode.disabled = allowedRangeKeys.length <= 1;
		}

		if (assetFilterNode) {
			Array.prototype.slice.call(assetFilterNode.options).forEach(function (option) {
				option.hidden = allowedAssetKeys.indexOf(option.value) === -1;
			});
			if (allowedAssetKeys.indexOf(state.asset) === -1) {
				state.asset = allowedAssetKeys[0];
			}
			assetFilterNode.value = state.asset;
			assetFilterNode.disabled = hasPermission("view_only_own_data") || allowedAssetKeys.length <= 1;
		}
	};

	const state = {
		range: rangeDefinitions[activeRole.defaultRange] ? activeRole.defaultRange : "monthly",
		asset: assetProfiles[activeRole.defaultAsset] ? activeRole.defaultAsset : "all",
		selectedPeriodIndex: null,
		payload: null,
		roleWorkspace: null
	};

	applyPermissionVisibility();
	applyFilterAccess(state);

	let revenueChart = null;
	let mixChart = null;

	const revenueCtx = document.getElementById("revenue-chart");
	const mixCtx = document.getElementById("mix-chart");
	const isCompactScreen = window.matchMedia("(max-width: 736px)").matches;

	if (hasPermission("view_financials") && window.Chart && revenueCtx && mixCtx) {
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
		applyFilterAccess(state);
		const payload = buildPayload(state.range, state.asset);
		const roleWorkspace = buildRoleWorkspace(payload);
		state.payload = payload;
		state.roleWorkspace = roleWorkspace;
		renderRoleWorkspace(roleWorkspace);

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
		setText("overview-source", "Source: " + activeRole.label + " workspace");

		if (!hasPermission("view_financials") && roleWorkspace.restrictedOverview) {
			setText("overview-month-performance", roleWorkspace.restrictedOverview.value);
			setText("overview-performance-note", roleWorkspace.restrictedOverview.note);
			setText("overview-latest-report", roleWorkspace.restrictedOverview.report);
			setText("overview-report-note", roleWorkspace.restrictedOverview.reportNote);
		}

		if (hasPermission("view_property")) {
			const accessSuffix = hasPermission("edit_property") ? " | Edit enabled" : " | Read-only";
			setText("overview-active-note", payload.overview.activeNote + accessSuffix);
		}

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
			if (hasPermission("approve_payout")) {
				const iconClass = isPending ? "fa-clock" : "fa-check-circle";
				payoutStatusChip.className = "status-chip " + (isPending ? "is-pending" : "is-done");
				payoutStatusChip.innerHTML = "<span class=\"icon solid " + iconClass + "\" aria-hidden=\"true\"></span> " + payload.payout.status;
			} else if (hasPermission("view_financials")) {
				payoutStatusChip.className = "status-chip is-done";
				payoutStatusChip.innerHTML = "<span class=\"icon solid fa-eye\" aria-hidden=\"true\"></span> View Only";
			}
		}

		if (payoutNextCycle) {
			payoutNextCycle.textContent = payload.payout.nextCycle;
		}

		if (alertContextNode) {
			alertContextNode.textContent = activeRole.label + " | " + payload.profile.label + " | " + rangeLabels[payload.rangeKey];
		}

		updateAssetVisibility(payload.assetKey);
		renderAlerts(payload, roleWorkspace);
		if (hasPermission("view_financials")) {
			renderDistributionHistory(payload);
			renderDrilldown(payload, state.selectedPeriodIndex);
		}
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
			const selected = rangeFilterNode.value;
			state.range = allowedRangeKeys.indexOf(selected) !== -1 ? selected : allowedRangeKeys[0];
			applyState();
		});
	}

	if (assetFilterNode) {
		assetFilterNode.addEventListener("change", function () {
			const selected = assetFilterNode.value;
			state.asset = allowedAssetKeys.indexOf(selected) !== -1 ? selected : allowedAssetKeys[0];
			applyState();
		});
	}

	rangeButtons.forEach(function (button) {
		button.addEventListener("click", function () {
			const selectedRange = button.getAttribute("data-range");
			if (!rangeDefinitions[selectedRange] || allowedRangeKeys.indexOf(selectedRange) === -1) {
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
	};
})(window);

