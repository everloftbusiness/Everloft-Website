(function (global) {
	var app = global.EverloftMVP;
	if (!app || !app.Widgets || !app.Widgets.dashboard) {
		return;
	}

	var roles = app.Widgets.dashboard.roles = app.Widgets.dashboard.roles || {};
	var HOUSEKEEPING_FALLBACK_USER_ID = "EL-HKP-001";

	var housekeepingRole = {
		isolatedView: true,
		getMaintenanceIssueStorageKey: function () {
			return "everloftMaintenanceIssueQueue";
		},
		getProperties: function () {
			return {
				pinnacle_apartment: {
					name: "Pinnacle Apartment",
					location: "Kakkanad, Kochi",
					address: "Tower A, Flat A-402, Pinnacle Apartment, Kakkanad, Kochi",
					entryInstructions: "Collect housekeeping key from security desk and sign access register.",
					emergencyContact: "+91 94470 11223"
				},
				villa_green_nest: {
					name: "Villa Green Nest",
					location: "Panampilly Nagar, Kochi",
					address: "Block B, Villa Green Nest, Panampilly Nagar, Kochi",
					entryInstructions: "Use side service entry; caretaker unlocks utility area.",
					emergencyContact: "+91 94470 44556"
				}
			};
		},
		getTaskTemplate: function () {
			return [
				{
					id: "hkp-1001",
					assignedTo: "EL-HKP-001",
					taskType: "cleaning",
					time: "09:30 AM",
					propertyKey: "pinnacle_apartment",
					unit: "Flat A-402",
					floorFlat: "Floor 4 | Flat A-402",
					cleaningType: "Checkout Cleaning",
					priority: "High",
					status: "Pending",
					guestCheckoutTime: "10:00 AM",
					nextGuestCheckinTime: "2:30 PM",
					specialInstructions: "Extra focus on balcony glass and AC filter wipe.",
					notesFromOps: "VIP check-in expected. Use premium linen set.",
					checklist: {
						Bedroom: ["Change bedsheets", "Dust surfaces", "Check wardrobe"],
						Bathroom: ["Clean toilet", "Replace toiletries", "Mop floor"],
						Kitchen: ["Wash utensils", "Clean stove", "Check gas"]
					},
					checklistState: {},
					photos: {
						livingRoom: "",
						bedroom: "",
						bathroom: "",
						kitchen: ""
					},
					startedAt: "",
					endedAt: "",
					durationMinutes: 0,
					completedAt: ""
				},
				{
					id: "hkp-1002",
					assignedTo: "EL-HKP-001",
					taskType: "cleaning",
					time: "11:30 AM",
					propertyKey: "villa_green_nest",
					unit: "Villa B-07",
					floorFlat: "Ground Floor | Villa B-07",
					cleaningType: "Stay-over Cleaning",
					priority: "Medium",
					status: "In Progress",
					guestCheckoutTime: "N/A (Stay-over)",
					nextGuestCheckinTime: "Current guest in-house",
					specialInstructions: "Do not disturb study room area before 12 PM.",
					notesFromOps: "Guest requested extra towels and quick bathroom refresh.",
					checklist: {
						Bedroom: ["Make beds", "Dust surfaces", "Refill water bottles"],
						Bathroom: ["Refresh toiletries", "Clean sink", "Mop floor"],
						Kitchen: ["Clean countertop", "Wash cups", "Clear trash"]
					},
					checklistState: {},
					photos: {
						livingRoom: "",
						bedroom: "",
						bathroom: "",
						kitchen: ""
					},
					startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
					endedAt: "",
					durationMinutes: 0,
					completedAt: ""
				},
				{
					id: "hkp-1003",
					assignedTo: "EL-HKP-001",
					taskType: "cleaning",
					time: "2:00 PM",
					propertyKey: "pinnacle_apartment",
					unit: "Flat C-210",
					floorFlat: "Floor 2 | Flat C-210",
					cleaningType: "Deep Cleaning",
					priority: "Low",
					status: "Completed",
					guestCheckoutTime: "11:00 AM",
					nextGuestCheckinTime: "6:00 PM",
					specialInstructions: "Deep clean behind furniture and window rails.",
					notesFromOps: "Completed and inspected by floor supervisor.",
					checklist: {
						Bedroom: ["Change bedsheets", "Dust surfaces", "Check wardrobe"],
						Bathroom: ["Clean toilet", "Replace toiletries", "Mop floor"],
						Kitchen: ["Wash utensils", "Clean stove", "Check gas"]
					},
					checklistState: {
						"Bedroom::0": true,
						"Bedroom::1": true,
						"Bedroom::2": true,
						"Bathroom::0": true,
						"Bathroom::1": true,
						"Bathroom::2": true,
						"Kitchen::0": true,
						"Kitchen::1": true,
						"Kitchen::2": true
					},
					photos: {
						livingRoom: "living-room.jpg",
						bedroom: "bedroom.jpg",
						bathroom: "bathroom.jpg",
						kitchen: "kitchen.jpg"
					},
					startedAt: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
					endedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
					durationMinutes: 65,
					completedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString()
				},
				{
					id: "hkp-1004",
					assignedTo: "EL-HKP-001",
					taskType: "cleaning",
					time: "4:30 PM",
					propertyKey: "villa_green_nest",
					unit: "Villa D-11",
					floorFlat: "First Floor | Villa D-11",
					cleaningType: "Emergency Cleaning",
					priority: "Urgent",
					status: "Pending",
					guestCheckoutTime: "Immediate request",
					nextGuestCheckinTime: "5:30 PM",
					specialInstructions: "Bathroom spill clean-up and fast turnaround.",
					notesFromOps: "Handle immediately after current in-progress task.",
					checklist: {
						Bedroom: ["Quick bed reset", "Spot clean surfaces", "Replace used linen"],
						Bathroom: ["Sanitize toilet", "Mop floor", "Restock toiletries"],
						Kitchen: ["Clear sink", "Wipe stove", "Remove trash"]
					},
					checklistState: {},
					photos: {
						livingRoom: "",
						bedroom: "",
						bathroom: "",
						kitchen: ""
					},
					startedAt: "",
					endedAt: "",
					durationMinutes: 0,
					completedAt: ""
				}
			];
		},
		buildWorkspace: function () {
			return {
				title: "Housekeeping Assignment Workspace",
				note: "Room turnover, cleaning schedules, and completion updates for assigned tasks.",
				cards: [
					{ label: "Today's Cleaning Tasks", value: "4", note: "Assigned to current shift" },
					{ label: "In Progress", value: "1", note: "Tasks currently underway" },
					{ label: "Completed Today", value: "1", note: "Closed with checklist evidence" }
				],
				headers: ["Cleaning Task", "Property", "Status", "Next Action"],
				rows: [
					["Checkout Cleaning", "Pinnacle Apartment", "Pending", "Start before next check-in"],
					["Stay-over Cleaning", "Villa Green Nest", "In Progress", "Complete checklist + photos"],
					["Deep Cleaning", "Pinnacle Apartment", "Completed", "No action required"],
					["Emergency Cleaning", "Villa Green Nest", "Pending", "Prioritize immediately"]
				],
				alerts: [
					{ type: "warning", icon: "fa-broom", text: "One urgent emergency-cleaning task is pending closure." }
				],
				restrictedOverview: {
					value: "Cleaning Queue Active",
					note: "Assigned housekeeping workflow only",
					report: "Housekeeping Task Sheet",
					reportNote: "No financial visibility"
				}
			};
		}
	};

	roles.housekeeping = housekeepingRole;

	var normalize = function (value) {
		return String(value || "").trim().toLowerCase();
	};

	var escapeHtml = function (value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	};

	var setFeedback = function (node, message, tone) {
		if (!node) {
			return;
		}
		node.textContent = message;
		node.classList.remove("is-success", "is-error");
		if (tone === "success") {
			node.classList.add("is-success");
		}
		if (tone === "error") {
			node.classList.add("is-error");
		}
	};

	var formatDateTime = function (rawValue) {
		if (!rawValue) {
			return "--";
		}
		var parsedDate = new Date(rawValue);
		if (Number.isNaN(parsedDate.getTime())) {
			return "--";
		}
		return parsedDate.toLocaleString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	var formatDuration = function (minutes) {
		var total = Number(minutes || 0);
		if (!(total > 0)) {
			return "--";
		}
		var hours = Math.floor(total / 60);
		var remainingMinutes = total % 60;
		if (hours > 0) {
			return hours + "h " + remainingMinutes + "m";
		}
		return remainingMinutes + "m";
	};

	var getStatusClass = function (status) {
		var normalized = normalize(status);
		if (normalized === "in progress") {
			return "in-progress";
		}
		if (normalized === "completed") {
			return "completed";
		}
		if (normalized === "waiting for parts") {
			return "waiting";
		}
		return "pending";
	};

	var getPriorityClass = function (priority) {
		var normalized = normalize(priority);
		if (normalized === "high") {
			return "high";
		}
		if (normalized === "urgent") {
			return "urgent";
		}
		if (normalized === "low") {
			return "low";
		}
		return "medium";
	};

	var cloneTask = function (task) {
		var clonedChecklist = {};
		Object.keys(task.checklist || {}).forEach(function (section) {
			clonedChecklist[section] = (task.checklist[section] || []).slice();
		});

		return {
			id: task.id,
			assignedTo: task.assignedTo,
			taskType: task.taskType,
			time: task.time,
			propertyKey: task.propertyKey,
			unit: task.unit,
			floorFlat: task.floorFlat,
			cleaningType: task.cleaningType,
			priority: task.priority,
			status: task.status,
			guestCheckoutTime: task.guestCheckoutTime,
			nextGuestCheckinTime: task.nextGuestCheckinTime,
			specialInstructions: task.specialInstructions,
			notesFromOps: task.notesFromOps,
			checklist: clonedChecklist,
			checklistState: Object.assign({}, task.checklistState || {}),
			photos: Object.assign({}, task.photos || {}),
			startedAt: task.startedAt || "",
			endedAt: task.endedAt || "",
			durationMinutes: Number(task.durationMinutes || 0),
			completedAt: task.completedAt || ""
		};
	};

	var isSameDay = function (dateValue, nowDate) {
		if (!dateValue) {
			return false;
		}
		var parsed = new Date(dateValue);
		if (Number.isNaN(parsed.getTime())) {
			return false;
		}
		return parsed.getDate() === nowDate.getDate() &&
			parsed.getMonth() === nowDate.getMonth() &&
			parsed.getFullYear() === nowDate.getFullYear();
	};

	var initHousekeepingConsole = function () {
		var body = document.body;
		if (!body || String(body.getAttribute("data-force-role") || "") !== "housekeeping") {
			return;
		}

		var taskBodyNode = document.getElementById("housekeeping-task-body");
		if (!taskBodyNode) {
			return;
		}

		var properties = housekeepingRole.getProperties();
		var loggedInUserId = String(sessionStorage.getItem("everloftUserId") || "").trim() || HOUSEKEEPING_FALLBACK_USER_ID;
		var templateTasks = housekeepingRole.getTaskTemplate().map(cloneTask);
		var userTasks = templateTasks.filter(function (task) {
			return normalize(task.taskType) === "cleaning" && task.assignedTo === loggedInUserId;
		});
		if (!userTasks.length) {
			userTasks = templateTasks.filter(function (task) {
				return normalize(task.taskType) === "cleaning" && task.assignedTo === HOUSEKEEPING_FALLBACK_USER_ID;
			});
		}

		var state = {
			tasks: userTasks,
			selectedTaskId: userTasks.length ? userTasks[0].id : ""
		};

		var checkoutNode = document.getElementById("housekeeping-checkouts-today");
		var cleaningTodayNode = document.getElementById("housekeeping-cleaning-today");
		var inProgressNode = document.getElementById("housekeeping-inprogress");
		var completedTodayNode = document.getElementById("housekeeping-completed-today");

		var taskReferenceNode = document.getElementById("housekeeping-task-reference");
		var taskPropertyNode = document.getElementById("housekeeping-task-property");
		var taskAddressNode = document.getElementById("housekeeping-task-address");
		var taskFloorNode = document.getElementById("housekeeping-task-floor");
		var taskCheckoutNode = document.getElementById("housekeeping-task-checkout");
		var taskCheckinNode = document.getElementById("housekeeping-task-checkin");
		var taskInstructionsNode = document.getElementById("housekeeping-task-instructions");
		var taskOpsNotesNode = document.getElementById("housekeeping-task-ops-notes");

		var checklistBodyNode = document.getElementById("housekeeping-checklist-body");

		var livingRoomPhotoNode = document.getElementById("housekeeping-photo-living");
		var bedroomPhotoNode = document.getElementById("housekeeping-photo-bedroom");
		var bathroomPhotoNode = document.getElementById("housekeeping-photo-bathroom");
		var kitchenPhotoNode = document.getElementById("housekeeping-photo-kitchen");

		var timeStartNode = document.getElementById("housekeeping-time-start");
		var timeEndNode = document.getElementById("housekeeping-time-end");
		var timeDurationNode = document.getElementById("housekeeping-time-duration");

		var startTaskButton = document.getElementById("housekeeping-start-task-btn");
		var endTaskButton = document.getElementById("housekeeping-end-task-btn");
		var markCompleteButton = document.getElementById("housekeeping-mark-complete-btn");

		var issueTypeNode = document.getElementById("housekeeping-issue-type");
		var issueDescriptionNode = document.getElementById("housekeeping-issue-description");
		var reportIssueButton = document.getElementById("housekeeping-report-issue-btn");

		var propertyNameNode = document.getElementById("housekeeping-property-name");
		var propertyLocationNode = document.getElementById("housekeeping-property-location");
		var propertyEntryNode = document.getElementById("housekeeping-property-entry");
		var propertyEmergencyNode = document.getElementById("housekeeping-property-emergency");

		var taskFeedbackNode = document.getElementById("housekeeping-task-feedback");
		var photoFeedbackNode = document.getElementById("housekeeping-photo-feedback");
		var issueFeedbackNode = document.getElementById("housekeeping-issue-feedback");

		var getTaskById = function (taskId) {
			for (var index = 0; index < state.tasks.length; index += 1) {
				if (state.tasks[index].id === taskId) {
					return state.tasks[index];
				}
			}
			return null;
		};

		var getSelectedTask = function () {
			return getTaskById(state.selectedTaskId);
		};

		var getAllChecklistKeys = function (task) {
			var keys = [];
			Object.keys(task.checklist || {}).forEach(function (sectionName) {
				(task.checklist[sectionName] || []).forEach(function (_item, index) {
					keys.push(sectionName + "::" + index);
				});
			});
			return keys;
		};

		var isChecklistCompleted = function (task) {
			var keys = getAllChecklistKeys(task);
			if (!keys.length) {
				return false;
			}
			for (var index = 0; index < keys.length; index += 1) {
				if (!task.checklistState[keys[index]]) {
					return false;
				}
			}
			return true;
		};

		var readPhotoSelection = function () {
			var selection = {
				livingRoom: livingRoomPhotoNode && livingRoomPhotoNode.files && livingRoomPhotoNode.files[0] ? livingRoomPhotoNode.files[0].name : "",
				bedroom: bedroomPhotoNode && bedroomPhotoNode.files && bedroomPhotoNode.files[0] ? bedroomPhotoNode.files[0].name : "",
				bathroom: bathroomPhotoNode && bathroomPhotoNode.files && bathroomPhotoNode.files[0] ? bathroomPhotoNode.files[0].name : "",
				kitchen: kitchenPhotoNode && kitchenPhotoNode.files && kitchenPhotoNode.files[0] ? kitchenPhotoNode.files[0].name : ""
			};
			return selection;
		};

		var hasMandatoryPhotos = function (task, selection) {
			var merged = {
				livingRoom: selection.livingRoom || task.photos.livingRoom,
				bedroom: selection.bedroom || task.photos.bedroom,
				bathroom: selection.bathroom || task.photos.bathroom,
				kitchen: selection.kitchen || task.photos.kitchen
			};
			return Boolean(merged.livingRoom && merged.bedroom && merged.bathroom && merged.kitchen);
		};

		var applyPhotoSelectionToTask = function (task, selection) {
			if (selection.livingRoom) {
				task.photos.livingRoom = selection.livingRoom;
			}
			if (selection.bedroom) {
				task.photos.bedroom = selection.bedroom;
			}
			if (selection.bathroom) {
				task.photos.bathroom = selection.bathroom;
			}
			if (selection.kitchen) {
				task.photos.kitchen = selection.kitchen;
			}
		};

		var clearPhotoInputs = function () {
			if (livingRoomPhotoNode) {
				livingRoomPhotoNode.value = "";
			}
			if (bedroomPhotoNode) {
				bedroomPhotoNode.value = "";
			}
			if (bathroomPhotoNode) {
				bathroomPhotoNode.value = "";
			}
			if (kitchenPhotoNode) {
				kitchenPhotoNode.value = "";
			}
		};

		var renderSummary = function () {
			var now = new Date();
			var summary = state.tasks.reduce(function (acc, task) {
				acc.cleaningToday += 1;
				if (normalize(task.cleaningType) === "checkout cleaning") {
					acc.checkouts += 1;
				}
				if (normalize(task.status) === "in progress") {
					acc.inProgress += 1;
				}
				if (normalize(task.status) === "completed" && isSameDay(task.completedAt, now)) {
					acc.completedToday += 1;
				}
				return acc;
			}, {
				checkouts: 0,
				cleaningToday: 0,
				inProgress: 0,
				completedToday: 0
			});

			if (checkoutNode) checkoutNode.textContent = String(summary.checkouts);
			if (cleaningTodayNode) cleaningTodayNode.textContent = String(summary.cleaningToday);
			if (inProgressNode) inProgressNode.textContent = String(summary.inProgress);
			if (completedTodayNode) completedTodayNode.textContent = String(summary.completedToday);
		};

		var renderSchedule = function () {
			taskBodyNode.innerHTML = state.tasks.map(function (task) {
				var property = properties[task.propertyKey] || {};
				var isSelected = task.id === state.selectedTaskId;
				var priorityClass = getPriorityClass(task.priority);
				var statusClass = getStatusClass(task.status);

				return "<tr class=\"housekeeping-task-row" + (isSelected ? " is-selected" : "") + "\">" +
					"<td data-label=\"Time\">" + escapeHtml(task.time) + "</td>" +
					"<td data-label=\"Property\">" + escapeHtml(property.name || "--") + "</td>" +
					"<td data-label=\"Unit\">" + escapeHtml(task.unit) + "</td>" +
					"<td data-label=\"Type\">" + escapeHtml(task.cleaningType) + "</td>" +
					"<td data-label=\"Priority\"><span class=\"maintenance-priority-pill is-" + priorityClass + "\">" + escapeHtml(task.priority) + "</span></td>" +
					"<td data-label=\"Status\"><span class=\"maintenance-status-pill is-" + statusClass + "\">" + escapeHtml(task.status) + "</span></td>" +
					"<td data-label=\"Action\"><button type=\"button\" class=\"button small housekeeping-view-task-btn\" data-housekeeping-task-id=\"" + escapeHtml(task.id) + "\">View Task</button></td>" +
				"</tr>";
			}).join("");
		};

		var renderChecklist = function (task) {
			if (!checklistBodyNode) {
				return;
			}
			if (!task) {
				checklistBodyNode.innerHTML = "<p class=\"maintenance-section-note\">Select a task to load checklist.</p>";
				return;
			}

			var sections = Object.keys(task.checklist || {});
			checklistBodyNode.innerHTML = sections.map(function (sectionName) {
				var items = task.checklist[sectionName] || [];
				var itemMarkup = items.map(function (itemLabel, index) {
					var key = sectionName + "::" + index;
					var isChecked = Boolean(task.checklistState[key]);
					return "<label class=\"housekeeping-check-item\">" +
						"<input type=\"checkbox\" data-check-key=\"" + escapeHtml(key) + "\"" + (isChecked ? " checked" : "") + " />" +
						"<span>" + escapeHtml(itemLabel) + "</span>" +
					"</label>";
				}).join("");

				return "<article class=\"housekeeping-checklist-block\">" +
					"<h3>" + escapeHtml(sectionName) + "</h3>" +
					"<div class=\"housekeeping-checklist-items\">" + itemMarkup + "</div>" +
				"</article>";
			}).join("");
		};

		var renderTaskDetail = function () {
			var task = getSelectedTask();
			if (!task) {
				if (taskReferenceNode) taskReferenceNode.textContent = "Select a task to view details.";
				if (taskPropertyNode) taskPropertyNode.textContent = "--";
				if (taskAddressNode) taskAddressNode.textContent = "--";
				if (taskFloorNode) taskFloorNode.textContent = "--";
				if (taskCheckoutNode) taskCheckoutNode.textContent = "--";
				if (taskCheckinNode) taskCheckinNode.textContent = "--";
				if (taskInstructionsNode) taskInstructionsNode.textContent = "--";
				if (taskOpsNotesNode) taskOpsNotesNode.textContent = "--";
				renderChecklist(null);
				return;
			}

			var property = properties[task.propertyKey] || {};
			if (taskReferenceNode) taskReferenceNode.textContent = task.id + " | " + (property.name || "Property") + " | " + task.unit;
			if (taskPropertyNode) taskPropertyNode.textContent = property.name || "--";
			if (taskAddressNode) taskAddressNode.textContent = property.address || "--";
			if (taskFloorNode) taskFloorNode.textContent = task.floorFlat || "--";
			if (taskCheckoutNode) taskCheckoutNode.textContent = task.guestCheckoutTime || "--";
			if (taskCheckinNode) taskCheckinNode.textContent = task.nextGuestCheckinTime || "--";
			if (taskInstructionsNode) taskInstructionsNode.textContent = task.specialInstructions || "--";
			if (taskOpsNotesNode) taskOpsNotesNode.textContent = task.notesFromOps || "--";

			renderChecklist(task);
		};

		var renderTimeTracking = function () {
			var task = getSelectedTask();
			if (!task) {
				if (timeStartNode) timeStartNode.textContent = "--";
				if (timeEndNode) timeEndNode.textContent = "--";
				if (timeDurationNode) timeDurationNode.textContent = "--";
				return;
			}

			if (timeStartNode) {
				timeStartNode.textContent = formatDateTime(task.startedAt);
			}
			if (timeEndNode) {
				timeEndNode.textContent = formatDateTime(task.endedAt);
			}

			if (task.startedAt && task.endedAt) {
				var minutes = Math.max(0, Math.round((new Date(task.endedAt).getTime() - new Date(task.startedAt).getTime()) / 60000));
				task.durationMinutes = minutes;
			}
			if (timeDurationNode) {
				timeDurationNode.textContent = formatDuration(task.durationMinutes);
			}
		};

		var renderPropertyInfo = function () {
			var task = getSelectedTask();
			var property = task ? (properties[task.propertyKey] || {}) : {};
			if (propertyNameNode) propertyNameNode.textContent = property.name || "--";
			if (propertyLocationNode) propertyLocationNode.textContent = property.location || "--";
			if (propertyEntryNode) propertyEntryNode.textContent = property.entryInstructions || "--";
			if (propertyEmergencyNode) propertyEmergencyNode.textContent = property.emergencyContact || "--";
		};

		var renderAll = function () {
			renderSummary();
			renderSchedule();
			renderTaskDetail();
			renderTimeTracking();
			renderPropertyInfo();
		};

		taskBodyNode.addEventListener("click", function (event) {
			var trigger = event.target.closest("[data-housekeeping-task-id]");
			if (!trigger) {
				return;
			}
			state.selectedTaskId = trigger.getAttribute("data-housekeeping-task-id") || "";
			setFeedback(taskFeedbackNode, "Task loaded. Update checklist and timings before completion.");
			renderAll();
		});

		if (checklistBodyNode) {
			checklistBodyNode.addEventListener("change", function (event) {
				var checkbox = event.target.closest("[data-check-key]");
				if (!checkbox) {
					return;
				}
				var task = getSelectedTask();
				if (!task) {
					return;
				}
				var checkKey = checkbox.getAttribute("data-check-key");
				task.checklistState[checkKey] = checkbox.checked;
			});
		}

		if (startTaskButton) {
			startTaskButton.addEventListener("click", function () {
				var task = getSelectedTask();
				if (!task) {
					setFeedback(taskFeedbackNode, "Select a task first.", "error");
					return;
				}
				if (!task.startedAt) {
					task.startedAt = new Date().toISOString();
				}
				if (normalize(task.status) === "pending") {
					task.status = "In Progress";
				}
				setFeedback(taskFeedbackNode, "Task timer started for " + task.id + ".", "success");
				renderAll();
			});
		}

		if (endTaskButton) {
			endTaskButton.addEventListener("click", function () {
				var task = getSelectedTask();
				if (!task) {
					setFeedback(taskFeedbackNode, "Select a task first.", "error");
					return;
				}
				if (!task.startedAt) {
					setFeedback(taskFeedbackNode, "Start the task timer before ending the task.", "error");
					return;
				}
				task.endedAt = new Date().toISOString();
				var duration = Math.max(0, Math.round((new Date(task.endedAt).getTime() - new Date(task.startedAt).getTime()) / 60000));
				task.durationMinutes = duration;
				setFeedback(taskFeedbackNode, "Task end time recorded.", "success");
				renderAll();
			});
		}

		if (markCompleteButton) {
			markCompleteButton.addEventListener("click", function () {
				var task = getSelectedTask();
				if (!task) {
					setFeedback(taskFeedbackNode, "Select a task first.", "error");
					return;
				}

				if (!task.startedAt) {
					setFeedback(taskFeedbackNode, "Start task timing before marking complete.", "error");
					return;
				}

				if (!isChecklistCompleted(task)) {
					setFeedback(taskFeedbackNode, "Complete all checklist items before marking the task complete.", "error");
					return;
				}

				var photoSelection = readPhotoSelection();
				if (!hasMandatoryPhotos(task, photoSelection)) {
					setFeedback(photoFeedbackNode, "All four photos are mandatory: living room, bedroom, bathroom, kitchen.", "error");
					return;
				}

				applyPhotoSelectionToTask(task, photoSelection);
				clearPhotoInputs();

				if (!task.endedAt) {
					task.endedAt = new Date().toISOString();
				}
				task.durationMinutes = Math.max(0, Math.round((new Date(task.endedAt).getTime() - new Date(task.startedAt).getTime()) / 60000));
				task.status = "Completed";
				task.completedAt = new Date().toISOString();

				setFeedback(taskFeedbackNode, "Task " + task.id + " marked completed.", "success");
				setFeedback(photoFeedbackNode, "Mandatory photo evidence recorded for quality control.", "success");
				renderAll();
			});
		}

		if (reportIssueButton) {
			reportIssueButton.addEventListener("click", function () {
				var task = getSelectedTask();
				if (!task) {
					setFeedback(issueFeedbackNode, "Select a task before reporting an issue.", "error");
					return;
				}

				var selectedType = issueTypeNode ? String(issueTypeNode.value || "").trim() : "";
				var issueDescription = issueDescriptionNode ? String(issueDescriptionNode.value || "").trim() : "";

				if (!selectedType) {
					setFeedback(issueFeedbackNode, "Select issue type before submitting.", "error");
					return;
				}

				var storageKey = housekeepingRole.getMaintenanceIssueStorageKey();
				var existing = [];
				try {
					existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
					if (!Array.isArray(existing)) {
						existing = [];
					}
				} catch (_error) {
					existing = [];
				}

				existing.push({
					issueId: "mnt-issue-" + Date.now(),
					sourceTaskId: task.id,
					reportedByUserId: loggedInUserId,
					propertyKey: task.propertyKey,
					unit: task.unit,
					issueType: selectedType,
					description: issueDescription,
					assignedRole: "maintenance_staff",
					status: "Pending",
					createdAt: new Date().toISOString(),
					taskType: "maintenance"
				});

				localStorage.setItem(storageKey, JSON.stringify(existing));
				if (issueDescriptionNode) {
					issueDescriptionNode.value = "";
				}
				if (issueTypeNode) {
					issueTypeNode.value = "";
				}

				setFeedback(issueFeedbackNode, "Maintenance issue created and routed to maintenance_staff.", "success");
			});
		}

		renderAll();
		setFeedback(taskFeedbackNode, "Showing assigned cleaning tasks for user " + loggedInUserId + ".");
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initHousekeepingConsole);
	} else {
		initHousekeepingConsole();
	}
})(window);