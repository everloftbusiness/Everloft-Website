(function (global) {
    var app = global.SuperAdminDashboard = global.SuperAdminDashboard || {};
    var Sheets = app.Sheets;
    var Helpers = app.Helpers;
    var Charts = app.Charts;

    var state = {
        raw: {},
        failedSheets: [],
        failedSheetErrors: {},
        filters: {
            month: 'all',
            asset: 'all',
            city: 'all'
        }
    };

    function normalizeRole(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function roleToDashboardPath(roleKey) {
        var map = {
            super_admin: 'super-admin',
            finance_admin: 'finance-admin',
            operations_manager: 'operations-manager',
            tech_admin: 'tech-admin',
            property_manager: 'property-manager',
            housekeeping: 'housekeeping',
            maintenance: 'maintenance',
            guest_support: 'guest-support',
            property_owner: 'property-owner',
            guest: 'guest',
            investor: 'investor'
        };

        var slug = map[normalizeRole(roleKey)] || 'investor';
        return '/dashboard/roles/' + slug + '/';
    }

    function enforceAuthAndRole() {
        if (sessionStorage.getItem('everloftAuth') !== '1') {
            window.location.replace('/login/');
            return false;
        }

        var sessionRole = normalizeRole(
            sessionStorage.getItem('everloftUserRole') ||
                sessionStorage.getItem('everloftUserRoleLabel') ||
                localStorage.getItem('everloftLastResolvedRole')
        );

        if (!sessionRole) {
            window.location.replace('/login/');
            return false;
        }

        if (sessionRole && sessionRole !== 'super_admin') {
            window.location.replace(roleToDashboardPath(sessionRole));
            return false;
        }

        return true;
    }

    function parseDate(value) {
        var date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDateTime(value) {
        var date = parseDate(value);
        if (!date) {
            return value || 'Not available';
        }
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function toMonthKey(dateValue) {
        var date = parseDate(dateValue);
        if (!date) {
            return null;
        }
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    }

    function monthLabel(monthKey) {
        if (!monthKey || monthKey.indexOf('-') === -1) {
            return monthKey || '-';
        }
        var parts = monthKey.split('-');
        var date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    }

    function readField(row, keys, fallback) {
        return Helpers.getField(row, keys, fallback);
    }

    function toNumber(value) {
        var number = Number(value);
        return Number.isNaN(number) ? 0 : number;
    }

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setNodeText(nodeId, value) {
        var node = document.getElementById(nodeId);
        if (node) {
            node.textContent = value;
        }
    }

    function renderCards(containerId, cards) {
        var container = document.getElementById(containerId);
        if (!container) {
            return;
        }
        if (!cards.length) {
            container.innerHTML = [
                '<article class="summary-card">',
                '<p class="summary-label">No data</p>',
                '<p class="summary-value">0</p>',
                '<p class="summary-note">No records available for the selected filters.</p>',
                '</article>'
            ].join('');
            return;
        }
        container.innerHTML = cards
            .map(function (card) {
                var iconMarkup = card.iconClass
                    ? '<span class="icon solid ' + escapeHtml(card.iconClass) + '" aria-hidden="true"></span> '
                    : '';
                return [
                    '<article class="summary-card">',
                    '<p class="summary-label">' + iconMarkup + escapeHtml(card.label) + '</p>',
                    '<p class="summary-value">' + escapeHtml(card.value) + '</p>',
                    card.description ? '<p class="summary-note">' + escapeHtml(card.description) + '</p>' : '<p class="summary-note">Live summary from sheet data.</p>',
                    '</article>'
                ].join('');
            })
            .join('');
    }

    function renderAlertList(items) {
        var list = document.getElementById('dashboard-alert-list');
        if (!list) {
            return;
        }
        if (!items.length) {
            list.innerHTML =
                '<li class="alert-item is-info"><span class="icon solid fa-info-circle" aria-hidden="true"></span>No alerts found for the selected filters.</li>';
            return;
        }
        list.innerHTML = items
            .map(function (item) {
                var tone = item.tone || 'info';
                var iconClass = item.iconClass || 'fa-info-circle';
                return (
                    '<li class="alert-item is-' +
                    escapeHtml(tone) +
                    '"><span class="icon solid ' +
                    escapeHtml(iconClass) +
                    '" aria-hidden="true"></span>' +
                    escapeHtml(item.text) +
                    '</li>'
                );
            })
            .join('');
    }

    function renderTable(bodyId, rows, columns) {
        var body = document.getElementById(bodyId);
        if (!body) {
            return;
        }
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="' + columns.length + '">No records found.</td></tr>';
            return;
        }
        body.innerHTML = rows
            .map(function (row) {
                return (
                    '<tr>' +
                    columns
                        .map(function (column) {
                            var value = column.render ? column.render(row) : row[column.key];
                            var label = column.label || column.key || 'Value';
                            var content = value === undefined || value === null ? '-' : value;
                            if (!column.render) {
                                content = escapeHtml(content);
                            }
                            return '<td data-label="' + escapeHtml(label) + '">' + content + '</td>';
                        })
                        .join('') +
                    '</tr>'
                );
            })
            .join('');
    }

    function collectFilterOptions() {
        var bookings = state.raw.Bookings || [];
        var revenue = state.raw.Revenue || [];
        var expenses = state.raw.Expenses || [];
        var assets = state.raw.Assets || [];

        var monthMap = {};
        bookings.forEach(function (row) {
            var key = toMonthKey(readField(row, ['ArrivalDate', 'Date', 'CheckIn', 'Month'], null));
            if (key) {
                monthMap[key] = monthLabel(key);
            }
        });
        revenue.forEach(function (row) {
            var key = toMonthKey(readField(row, ['Month', 'Date', 'Period'], null));
            if (key) {
                monthMap[key] = monthLabel(key);
            }
        });
        expenses.forEach(function (row) {
            var key = toMonthKey(readField(row, ['Month', 'Date', 'Period'], null));
            if (key) {
                monthMap[key] = monthLabel(key);
            }
        });

        var assetSet = {};
        assets.forEach(function (row) {
            var assetName = readField(row, ['Asset', 'AssetName', 'Name'], null);
            if (assetName) {
                assetSet[assetName] = true;
            }
        });

        var citySet = {};
        assets.forEach(function (row) {
            var city = readField(row, ['City', 'city', 'Location'], null);
            if (city) {
                citySet[city] = true;
            }
        });

        return {
            months: Object.keys(monthMap).sort(),
            monthMap: monthMap,
            assets: Object.keys(assetSet).sort(),
            cities: Object.keys(citySet).sort()
        };
    }

    function populateSelect(selectId, items, mapFn) {
        var select = document.getElementById(selectId);
        if (!select) {
            return;
        }
        var current = select.value || 'all';
        select.innerHTML = '';
        select.appendChild(new Option('All', 'all'));
        items.forEach(function (item) {
            select.appendChild(new Option(mapFn ? mapFn(item) : item, item));
        });
        select.value = items.indexOf(current) !== -1 ? current : 'all';
    }

    function getAssetMeta(assetName) {
        var assets = state.raw.Assets || [];
        var found = assets.find(function (row) {
            return readField(row, ['Asset', 'AssetName', 'Name'], '') === assetName;
        });
        if (!found) {
            return { city: null };
        }
        return {
            city: readField(found, ['City', 'city', 'Location'], null)
        };
    }

    function passesGlobalFilter(rowAsset, rowDate) {
        var monthFilter = state.filters.month;
        var assetFilter = state.filters.asset;
        var cityFilter = state.filters.city;
        var rowMonth = toMonthKey(rowDate);
        var assetMeta = getAssetMeta(rowAsset);

        var monthOk = monthFilter === 'all' || (rowMonth && rowMonth === monthFilter);
        var assetOk = assetFilter === 'all' || rowAsset === assetFilter;
        var cityOk = cityFilter === 'all' || (assetMeta.city && assetMeta.city === cityFilter);
        return monthOk && assetOk && cityOk;
    }

    function filteredRows(list, mapping) {
        return list.filter(function (row) {
            var asset = readField(row, mapping.assetKeys, 'Unknown');
            var date = readField(row, mapping.dateKeys, null);
            return passesGlobalFilter(asset, date);
        });
    }

    function filterContextLabel() {
        var monthText = state.filters.month === 'all' ? 'All Months' : monthLabel(state.filters.month);
        var assetText = state.filters.asset === 'all' ? 'All Assets' : state.filters.asset;
        var cityText = state.filters.city === 'all' ? 'All Cities' : state.filters.city;
        return [assetText, cityText, monthText].join(' | ');
    }

    function approvalStatusMarkup(value) {
        var normalized = String(value || 'Pending').toLowerCase();
        var chipClass = normalized.indexOf('approved') !== -1 || normalized.indexOf('processed') !== -1 ? 'is-done' : 'is-pending';
        return '<span class="status-chip ' + chipClass + '">' + escapeHtml(value || 'Pending') + '</span>';
    }

    function maintenancePriorityMarkup(value) {
        var normalized = String(value || 'Low').toLowerCase();
        var chipClass = normalized.indexOf('urgent') !== -1
            ? 'is-urgent'
            : normalized.indexOf('high') !== -1
                ? 'is-high'
                : normalized.indexOf('medium') !== -1
                    ? 'is-medium'
                    : 'is-low';
        return '<span class="maintenance-priority-pill ' + chipClass + '">' + escapeHtml(value || 'Low') + '</span>';
    }

    function maintenanceStatusMarkup(value) {
        var normalized = String(value || 'Pending').toLowerCase();
        var chipClass = normalized.indexOf('completed') !== -1
            ? 'is-completed'
            : normalized.indexOf('progress') !== -1
                ? 'is-in-progress'
                : normalized.indexOf('waiting') !== -1
                    ? 'is-waiting'
                    : 'is-pending';
        return '<span class="maintenance-status-pill ' + chipClass + '">' + escapeHtml(value || 'Pending') + '</span>';
    }

    function opportunityStatusMarkup(value) {
        var normalized = String(value || 'Pipeline').toLowerCase();
        var chipClass = normalized.indexOf('negotiation') !== -1 ? 'is-negotiation' : normalized.indexOf('closed') !== -1 ? 'is-closed' : 'is-pipeline';
        return '<span class="opportunity-status ' + chipClass + '">' + escapeHtml(value || 'Pipeline') + '</span>';
    }

    function loadAlerts() {
        var bookings = state.raw.Bookings || [];
        var maintenance = state.raw.Maintenance || [];
        var signups = state.raw.Admin_Signups || [];
        var payouts = state.raw.Payouts || [];
        var today = todayKey();

        var arrivals = bookings.filter(function (row) {
            var date = parseDate(readField(row, ['ArrivalDate', 'CheckIn', 'Date'], null));
            return date && date.toISOString().slice(0, 10) === today;
        }).length;

        var maintenanceToday = maintenance.filter(function (row) {
            var date = parseDate(readField(row, ['DueDate', 'Date'], null));
            var status = String(readField(row, ['Status', 'status'], '')).toLowerCase();
            return date && date.toISOString().slice(0, 10) === today && status.indexOf('completed') === -1;
        }).length;

        var housekeepingToday = maintenance.filter(function (row) {
            var date = parseDate(readField(row, ['DueDate', 'Date'], null));
            var type = String(readField(row, ['Team', 'Type', 'Department'], '')).toLowerCase();
            return date && date.toISOString().slice(0, 10) === today && type.indexOf('housekeeping') !== -1;
        }).length;

        var pendingSignups = signups.filter(function (row) {
            return String(readField(row, ['Status', 'ApprovalStatus'], '')).toLowerCase().indexOf('pending') !== -1;
        }).length;

        var pendingPayouts = payouts.filter(function (row) {
            return String(readField(row, ['Status', 'ApprovalStatus'], '')).toLowerCase().indexOf('pending') !== -1;
        }).length;

        setNodeText('alert-context', filterContextLabel());

        renderAlertList([
            {
                tone: arrivals > 0 ? 'warning' : 'success',
                iconClass: arrivals > 0 ? 'fa-door-open' : 'fa-check-circle',
                text: arrivals > 0 ? arrivals + ' arrival(s) scheduled for today.' : 'No arrival pressure for today.'
            },
            {
                tone: maintenanceToday > 0 ? 'critical' : 'success',
                iconClass: maintenanceToday > 0 ? 'fa-tools' : 'fa-check-circle',
                text: maintenanceToday > 0 ? maintenanceToday + ' maintenance item(s) need attention today.' : 'No urgent maintenance tasks due today.'
            },
            {
                tone: housekeepingToday > 0 ? 'info' : 'success',
                iconClass: housekeepingToday > 0 ? 'fa-broom' : 'fa-bed',
                text: housekeepingToday > 0 ? housekeepingToday + ' housekeeping assignment(s) are active today.' : 'Housekeeping queue is currently clear.'
            },
            {
                tone: pendingSignups > 0 ? 'warning' : 'success',
                iconClass: pendingSignups > 0 ? 'fa-user-check' : 'fa-user-shield',
                text: pendingSignups > 0 ? pendingSignups + ' admin signup request(s) are awaiting review.' : 'No pending admin signup approvals.'
            },
            {
                tone: pendingPayouts > 0 ? 'warning' : 'info',
                iconClass: pendingPayouts > 0 ? 'fa-coins' : 'fa-wallet',
                text: pendingPayouts > 0 ? pendingPayouts + ' payout approval request(s) are still pending.' : 'No pending payout approvals in queue.'
            }
        ]);
    }

    function loadOverview() {
        var bookings = filteredRows(state.raw.Bookings || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['ArrivalDate', 'CheckIn', 'Date']
        });
        var revenue = filteredRows(state.raw.Revenue || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['Month', 'Date', 'Period']
        });
        var expenses = filteredRows(state.raw.Expenses || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['Month', 'Date', 'Period']
        });
        var assets = state.filters.asset === 'all'
            ? state.raw.Assets || []
            : (state.raw.Assets || []).filter(function (row) {
                  return readField(row, ['Asset', 'AssetName', 'Name'], '') === state.filters.asset;
              });

        if (state.filters.city !== 'all') {
            assets = assets.filter(function (row) {
                return readField(row, ['City', 'city', 'Location'], '') === state.filters.city;
            });
        }

        var occupancy = Helpers.calculateOccupancy(bookings, assets);
        var metrics = Helpers.calculateMetrics(revenue, expenses);
        var revenueLabel = state.filters.month === 'all' ? 'Filtered Revenue' : monthLabel(state.filters.month) + ' Revenue';
        var netLabel = state.filters.month === 'all' ? 'Filtered Net Profit' : monthLabel(state.filters.month) + ' Net Profit';

        setNodeText('overview-freshness', filterContextLabel());
        setNodeText('overview-source', 'Source: Google Sheets');

        renderCards('overview-cards', [
            {
                iconClass: 'fa-hotel',
                value: assets.length,
                label: 'Active Assets',
                description: 'Assets currently visible under the selected filters.'
            },
            {
                iconClass: 'fa-percent',
                value: occupancy + '%',
                label: 'Occupancy',
                description: 'Blended occupancy across filtered booked nights.'
            },
            {
                iconClass: 'fa-money-bill-wave',
                value: Helpers.formatCurrency(metrics.revenue),
                label: revenueLabel,
                description: 'Revenue total aggregated from the Revenue sheet.'
            },
            {
                iconClass: 'fa-chart-line',
                value: Helpers.formatCurrency(metrics.net),
                label: netLabel,
                description: 'Net result after subtracting tracked expenses.'
            }
        ]);
    }

    function loadPerformance() {
        var revenueRows = filteredRows(state.raw.Revenue || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['Month', 'Date', 'Period']
        });
        var bookingRows = filteredRows(state.raw.Bookings || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['ArrivalDate', 'CheckIn', 'Date']
        });
        var assetRows = state.raw.Assets || [];

        var revenueByMonth = {};
        var occupancyByMonth = {};
        var totalRevenue = 0;
        var totalNights = 0;

        revenueRows.forEach(function (row) {
            var monthKey = toMonthKey(readField(row, ['Month', 'Date', 'Period'], null));
            if (!monthKey) {
                monthKey = String(readField(row, ['MonthName', 'Label'], 'Unknown'));
            }
            if (!revenueByMonth[monthKey]) {
                revenueByMonth[monthKey] = 0;
            }
            revenueByMonth[monthKey] += toNumber(readField(row, ['Revenue', 'Amount'], 0));
            totalRevenue += toNumber(readField(row, ['Revenue', 'Amount'], 0));
        });

        bookingRows.forEach(function (row) {
            var monthKey = toMonthKey(readField(row, ['ArrivalDate', 'CheckIn', 'Date'], null));
            var nights = toNumber(readField(row, ['Nights', 'BookedNights'], 1));
            if (!monthKey) {
                return;
            }
            if (!occupancyByMonth[monthKey]) {
                occupancyByMonth[monthKey] = 0;
            }
            occupancyByMonth[monthKey] += nights;
            totalNights += nights;
        });

        var labels = Object.keys(revenueByMonth).sort().slice(-12);
        if (!labels.length) {
            labels = ['2026-01', '2026-02', '2026-03'];
        }

        var revenue = labels.map(function (label) {
            return Math.round(revenueByMonth[label] || 0);
        });
        var occupancy = labels.map(function (label) {
            var available = Math.max(assetRows.length * 30, 30);
            var booked = occupancyByMonth[label] || 0;
            return Math.min(100, Math.round((booked / available) * 100));
        });
        var averageOccupancy = occupancy.length
            ? Math.round(
                  occupancy.reduce(function (sum, value) {
                      return sum + value;
                  }, 0) / occupancy.length
              )
            : 0;
        var adr = totalNights ? Math.round(totalRevenue / totalNights) : 0;
        var latestPeriod = labels.length ? monthLabel(labels[labels.length - 1]) : 'Latest Period';

        Charts.renderCharts({
            labels: labels.map(monthLabel),
            revenue: revenue,
            occupancy: occupancy
        });

        setNodeText('performance-freshness', latestPeriod);
        setNodeText('performance-source', 'Source: Revenue + Bookings sheets');
        setNodeText('perf-kpi-nights', totalNights || 0);
        setNodeText('perf-kpi-adr', Helpers.formatCurrency(adr));
        setNodeText('perf-kpi-occupancy', averageOccupancy + '%');
        setNodeText('perf-kpi-revenue', Helpers.formatCurrency(totalRevenue));

        var revenueMeta = document.getElementById('revenue-chart-meta');
        var occupancyMeta = document.getElementById('occupancy-chart-meta');
        var chartNote = document.getElementById('chart-note');
        var periodSummary = document.getElementById('period-summary');
        if (revenueMeta) {
            revenueMeta.textContent = 'Monthly revenue trend from the Revenue sheet.';
        }
        if (occupancyMeta) {
            occupancyMeta.textContent = 'Monthly occupancy trend based on booked nights.';
        }
        if (chartNote) {
            chartNote.textContent =
                totalRevenue > 0
                    ? 'Revenue and occupancy are shown for the filtered months available in Google Sheets.'
                    : 'Revenue insight will appear once matching rows are available for the active filters.';
        }
        if (periodSummary) {
            periodSummary.innerHTML = [
                '<p><strong>Total Revenue:</strong> ' + escapeHtml(Helpers.formatCurrency(totalRevenue)) + '</p>',
                '<p><strong>Average Occupancy:</strong> ' + escapeHtml(averageOccupancy + '%') + '</p>',
                '<p><strong>Tracked Months:</strong> ' + escapeHtml(String(labels.length || 0)) + '</p>'
            ].join('');
        }
    }

    function loadRevenue() {
        var revenueRows = filteredRows(state.raw.Revenue || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['Month', 'Date', 'Period']
        });
        var expenseRows = filteredRows(state.raw.Expenses || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['Month', 'Date', 'Period']
        });

        var groupedRevenue = Helpers.groupData(
            revenueRows.map(function (row) {
                return {
                    Asset: readField(row, ['Asset', 'AssetName', 'Property'], 'Unknown'),
                    Revenue: toNumber(readField(row, ['Revenue', 'Amount'], 0))
                };
            }),
            'Asset'
        );

        var groupedExpenses = Helpers.groupData(
            expenseRows.map(function (row) {
                return {
                    Asset: readField(row, ['Asset', 'AssetName', 'Property'], 'Unknown'),
                    Expense: toNumber(readField(row, ['Expense', 'Expenses', 'Amount'], 0))
                };
            }),
            'Asset'
        );

        var assets = Object.keys(groupedRevenue);
        Object.keys(groupedExpenses).forEach(function (asset) {
            if (assets.indexOf(asset) === -1) {
                assets.push(asset);
            }
        });

        var rows = assets.map(function (asset) {
            var revenue = (groupedRevenue[asset] || []).reduce(function (sum, row) {
                return sum + toNumber(row.Revenue);
            }, 0);
            var expense = (groupedExpenses[asset] || []).reduce(function (sum, row) {
                return sum + toNumber(row.Expense);
            }, 0);
            var net = revenue - expense;
            return {
                asset: asset,
                revenueRaw: revenue,
                expenseRaw: expense,
                revenue: Helpers.formatCurrency(revenue),
                expense: Helpers.formatCurrency(expense),
                net: net
            };
        });

        var totals = rows.reduce(
            function (acc, row) {
                acc.revenue += toNumber(row.revenueRaw);
                acc.expense += toNumber(row.expenseRaw);
                acc.net += toNumber(row.net);
                return acc;
            },
            { revenue: 0, expense: 0, net: 0 }
        );
        var margin = totals.revenue ? Math.round((totals.net / totals.revenue) * 100) + '%' : '0%';

        setNodeText('revenue-generated-total', Helpers.formatCurrency(totals.revenue));
        setNodeText('revenue-expense-total', Helpers.formatCurrency(totals.expense));
        setNodeText('revenue-margin-total', margin);
        setNodeText('revenue-net-total', Helpers.formatCurrency(totals.net));

        renderTable('revenue-table-body', rows, [
            { key: 'asset', label: 'Asset' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'expense', label: 'Expenses' },
            {
                key: 'net',
                label: 'Net profit',
                render: function (row) {
                    var cls = row.net >= 0 ? 'rank-positive' : 'rank-negative';
                    return '<span class="' + cls + '">' + Helpers.formatCurrency(row.net) + '</span>';
                }
            }
        ]);
    }

    function renderActionButtons(rowId) {
        return [
            '<button type="button" class="button small primary" data-action="approve" data-row-id="' + rowId + '">Approve</button>',
            '<button type="button" class="button small" data-action="reject" data-row-id="' + rowId + '">Reject</button>'
        ].join('');
    }

    function loadExecutive() {
        var signupRows = Helpers.summarizeAdministrations(state.raw.Admin_Signups || [], 'Pending');
        var payoutRows = Helpers.summarizeAdministrations(state.raw.Payouts || [], 'Pending');

        renderTable('admin-signups-body', signupRows, [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            {
                key: 'status',
                label: 'Status',
                render: function (row) {
                    return approvalStatusMarkup(row.status);
                }
            },
            {
                key: 'actions',
                label: 'Actions',
                render: function (row) {
                    return renderActionButtons('admin-' + row.id);
                }
            }
        ]);

        renderTable('payout-approvals-body', payoutRows, [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            {
                key: 'status',
                label: 'Status',
                render: function (row) {
                    return approvalStatusMarkup(row.status);
                }
            },
            {
                key: 'actions',
                label: 'Actions',
                render: function (row) {
                    return renderActionButtons('payout-' + row.id);
                }
            }
        ]);
    }

    function loadMaintenance() {
        var tasks = filteredRows(state.raw.Maintenance || [], {
            assetKeys: ['Asset', 'AssetName', 'Property'],
            dateKeys: ['DueDate', 'Date', 'Month']
        });

        var monthOptions = {};
        var statusOptions = {};
        tasks.forEach(function (task) {
            var month = toMonthKey(readField(task, ['DueDate', 'Date', 'Month'], null));
            var status = readField(task, ['Status', 'status'], 'Pending');
            if (month) {
                monthOptions[month] = true;
            }
            statusOptions[status] = true;
        });

        populateSelect('maintenance-month-filter', Object.keys(monthOptions).sort(), monthLabel);
        populateSelect('maintenance-status-filter', Object.keys(statusOptions).sort(), null);

        var monthFilter = document.getElementById('maintenance-month-filter');
        var statusFilter = document.getElementById('maintenance-status-filter');
        var selectedMonth = monthFilter ? monthFilter.value : 'all';
        var selectedStatus = statusFilter ? statusFilter.value : 'all';

        var filtered = tasks.filter(function (task) {
            var month = toMonthKey(readField(task, ['DueDate', 'Date', 'Month'], null));
            var status = readField(task, ['Status', 'status'], 'Pending');
            var monthOk = selectedMonth === 'all' || month === selectedMonth;
            var statusOk = selectedStatus === 'all' || status === selectedStatus;
            return monthOk && statusOk;
        });

        var rows = filtered.map(function (task) {
            var priority = String(readField(task, ['Priority', 'priority'], 'Low'));
            return {
                asset: readField(task, ['Asset', 'AssetName', 'Property'], 'Unknown'),
                task: readField(task, ['Task', 'Description', 'TaskDescription'], '-'),
                priority: maintenancePriorityMarkup(priority),
                assigned: readField(task, ['Assigned', 'AssignedStaff', 'Staff'], '-'),
                status: maintenanceStatusMarkup(readField(task, ['Status', 'status'], 'Pending'))
            };
        });

        renderTable('maintenance-table-body', rows, [
            { key: 'asset', label: 'Asset' },
            { key: 'task', label: 'Task description' },
            { key: 'priority', label: 'Priority', render: function (row) { return row.priority; } },
            { key: 'assigned', label: 'Assigned staff' },
            { key: 'status', label: 'Status', render: function (row) { return row.status; } }
        ]);
    }

    function loadNotes() {
        var notes = state.raw.Notes || [];
        var container = document.getElementById('notes-list');
        if (!container) {
            return;
        }
        if (!notes.length) {
            container.innerHTML = '<article><h3>No notes found</h3><p>Add a note from the Notes sheet or the local note button.</p></article>';
            return;
        }
        container.innerHTML = notes
            .map(function (note) {
                return [
                    '<article>',
                    '<h3>' + escapeHtml(readField(note, ['Title', 'title'], 'Untitled')) + '</h3>',
                    '<p>' + escapeHtml(readField(note, ['Description', 'Content', 'Note'], '-')) + '</p>',
                    '<p><strong>Assigned Role:</strong> ' + escapeHtml(readField(note, ['AssignedRole', 'Role', 'Assigned'], 'Super Admin')) + '</p>',
                    '<p><strong>Date:</strong> ' + escapeHtml(Helpers.formatDate(readField(note, ['Date', 'Created', 'CreatedDate'], '-'))) + '</p>',
                    '</article>'
                ].join('');
            })
            .join('');
    }

    function makeOpportunityId(row) {
        return [
            readField(row, ['AssetName', 'Asset', 'Name'], ''),
            readField(row, ['City', 'city'], ''),
            readField(row, ['CreatedDate', 'Date'], ''),
            readField(row, ['Status', 'status'], '')
        ]
            .join('|')
            .toLowerCase();
    }

    function loadAssets() {
        var rows = filteredRows(state.raw.New_Assets || [], {
            assetKeys: ['AssetName', 'Asset', 'Name'],
            dateKeys: ['Date', 'CreatedDate']
        });

        renderTable('opportunities-body', rows.map(function (row) {
            var status = String(readField(row, ['Status', 'status'], 'Pipeline'));
            var addUrl = Sheets.formLinks.newAssetsAdd || '#';
            var editUrl = Sheets.formLinks.newAssetsEdit || '#';
            var deleteUrl = Sheets.formLinks.newAssetsDelete || '#';
            var rowId = encodeURIComponent(makeOpportunityId(row));
            return {
                id: rowId,
                asset: readField(row, ['AssetName', 'Asset', 'Name'], 'Unknown'),
                city: readField(row, ['City', 'city'], '-'),
                investment: readField(row, ['Investment', 'EstimatedInvestment'], '-'),
                expected: readField(row, ['ExpectedReturn', 'Return'], '-'),
                status:
                    opportunityStatusMarkup(status) +
                    '<a class="button small primary" href="' + addUrl + '" target="_blank" rel="noopener">Add</a>' +
                    '<a class="button small" href="' + editUrl + '" target="_blank" rel="noopener">Edit</a>' +
                    '<a class="button small" href="' + deleteUrl + '" target="_blank" rel="noopener">Delete Sheet</a>' +
                    '<button type="button" class="button small" data-opportunity-delete="1" data-opportunity-id="' + rowId + '">Delete UI</button>'
            };
        }), [
            { key: 'asset', label: 'Asset name' },
            { key: 'city', label: 'City' },
            { key: 'investment', label: 'Estimated investment' },
            { key: 'expected', label: 'Expected return' },
            { key: 'status', label: 'Status', render: function (row) { return row.status; } }
        ]);
    }

    function loadSessionIdentity() {
        var userName =
            sessionStorage.getItem('everloftUserName') ||
            sessionStorage.getItem('everloftLoginUsername') ||
            'Super Admin';
        setNodeText('dashboard-user-name', userName);
    }

    function loadSecurity() {
        var previousSuccessfulLogin =
            localStorage.getItem('everloftPreviousSuccessfulLoginAt') ||
            localStorage.getItem('previousLogin');
        var currentSuccessfulLogin =
            localStorage.getItem('everloftLastLogin') ||
            localStorage.getItem('lastLogin') ||
            localStorage.getItem('everloftLastSuccessfulLoginAt') ||
            'Not available';
        var lastLogin = previousSuccessfulLogin || currentSuccessfulLogin;
        var sessionStart =
            sessionStorage.getItem('everloftSessionLoginAt') ||
            localStorage.getItem('sessionStart') ||
            localStorage.getItem('everloftSessionStart') ||
            'Not available';

        var lastNode = document.getElementById('security-last-login');
        var sessionNode = document.getElementById('security-session-start');
        if (lastNode) {
            lastNode.textContent =
                lastLogin === 'Not available' ? 'No login saved yet' : formatDateTime(lastLogin);
        }
        if (sessionNode) {
            sessionNode.textContent =
                sessionStart === 'Not available' ? 'Session not started yet' : formatDateTime(sessionStart);
        }
    }

    function bindExecutiveActions() {
        ['admin-signups-body', 'payout-approvals-body'].forEach(function (id) {
            var body = document.getElementById(id);
            if (!body || body.dataset.bound === '1') {
                return;
            }
            body.dataset.bound = '1';
            body.addEventListener('click', function (event) {
                var button = event.target.closest('button[data-action]');
                if (!button) {
                    return;
                }
                var row = button.closest('tr');
                if (!row) {
                    return;
                }
                var statusCell = row.children[3];
                if (!statusCell) {
                    return;
                }
                statusCell.innerHTML = approvalStatusMarkup(
                    button.getAttribute('data-action') === 'approve' ? 'Approved (UI only)' : 'Rejected (UI only)'
                );
            });
        });
    }

    function bindOpportunityActions() {
        var body = document.getElementById('opportunities-body');
        if (!body || body.dataset.bound === '1') {
            return;
        }
        body.dataset.bound = '1';
        body.addEventListener('click', function (event) {
            var button = event.target.closest('button[data-opportunity-delete]');
            if (!button) {
                return;
            }

            var targetId = button.getAttribute('data-opportunity-id');
            if (!targetId) {
                return;
            }

            state.raw.New_Assets = (state.raw.New_Assets || []).filter(function (row) {
                return encodeURIComponent(makeOpportunityId(row)) !== targetId;
            });
            loadAssets();
            bindOpportunityActions();
        });
    }

    function clearSession() {
        [
            'everloftAuth',
            'everloftUserName',
            'everloftLoginUsername',
            'everloftUserRole',
            'everloftUserRoleLabel',
            'everloftUserId',
            'everloftSessionLoginAt'
        ].forEach(function (key) {
            sessionStorage.removeItem(key);
        });
    }

    function bindLogout() {
        var logoutNode = document.getElementById('dashboard-logout');
        if (!logoutNode || logoutNode.dataset.bound === '1') {
            return;
        }
        logoutNode.dataset.bound = '1';
        logoutNode.addEventListener('click', function (event) {
            event.preventDefault();
            clearSession();
            window.location.replace('/login/');
        });
    }

    function bindFilters() {
        var globalMonth = document.getElementById('global-month-filter');
        var globalAsset = document.getElementById('global-asset-filter');
        var globalCity = document.getElementById('global-city-filter');
        var maintenanceMonth = document.getElementById('maintenance-month-filter');
        var maintenanceStatus = document.getElementById('maintenance-status-filter');
        var notesButton = document.getElementById('notes-add-btn');
        var notesFormLink = document.getElementById('notes-form-link');

        if (notesFormLink && Sheets.formLinks.notes) {
            notesFormLink.href = Sheets.formLinks.notes;
        }

        [globalMonth, globalAsset, globalCity].forEach(function (node) {
            if (!node || node.dataset.bound === '1') {
                return;
            }
            node.dataset.bound = '1';
            node.addEventListener('change', function () {
                state.filters.month = globalMonth ? globalMonth.value : 'all';
                state.filters.asset = globalAsset ? globalAsset.value : 'all';
                state.filters.city = globalCity ? globalCity.value : 'all';
                rerenderAll();
            });
        });

        [maintenanceMonth, maintenanceStatus].forEach(function (node) {
            if (!node || node.dataset.bound === '1') {
                return;
            }
            node.dataset.bound = '1';
            node.addEventListener('change', function () {
                loadMaintenance();
            });
        });

        if (notesButton && notesButton.dataset.bound !== '1') {
            notesButton.dataset.bound = '1';
            notesButton.addEventListener('click', function () {
                var notes = state.raw.Notes || [];
                notes.unshift({
                    Title: 'Local note',
                    Description: 'Added from UI (local only).',
                    AssignedRole: 'Super Admin',
                    Date: new Date().toISOString()
                });
                state.raw.Notes = notes;
                loadNotes();
            });
        }
    }

    function setupGlobalFilters() {
        var options = collectFilterOptions();
        if (state.filters.month === 'all' && options.months.length) {
            state.filters.month = options.months[options.months.length - 1];
        }

        populateSelect('global-month-filter', options.months, function (value) {
            return options.monthMap[value] || value;
        });
        populateSelect('global-asset-filter', options.assets, null);
        populateSelect('global-city-filter', options.cities, null);

        var monthNode = document.getElementById('global-month-filter');
        var assetNode = document.getElementById('global-asset-filter');
        var cityNode = document.getElementById('global-city-filter');

        if (monthNode) {
            monthNode.value = options.months.indexOf(state.filters.month) !== -1 ? state.filters.month : 'all';
            state.filters.month = monthNode.value;
        }
        if (assetNode) {
            assetNode.value = options.assets.indexOf(state.filters.asset) !== -1 ? state.filters.asset : 'all';
            state.filters.asset = assetNode.value;
        }
        if (cityNode) {
            cityNode.value = options.cities.indexOf(state.filters.city) !== -1 ? state.filters.city : 'all';
            state.filters.city = cityNode.value;
        }
    }

    function cleanFailureMessage(message) {
        return String(message || 'Unknown fetch error')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[.]+$/, '');
    }

    function showDataWarning() {
        var warningNode = document.getElementById('dashboard-warning');
        var detailMap = {};
        var details = [];
        var warningText;

        if (!warningNode) {
            return;
        }

        if (!state.failedSheets.length) {
            warningNode.hidden = true;
            warningNode.textContent = '';
            return;
        }

        state.failedSheets.forEach(function (sheetName) {
            var detail = state.failedSheetErrors[sheetName];
            if (detail && !detailMap[detail]) {
                detailMap[detail] = true;
                details.push(detail);
            }
        });

        warningText =
            'Warning: Could not load data from sheet tab(s): ' +
            state.failedSheets.join(', ') +
            '.';
        if (details.length === 1) {
            warningText += ' Cause: ' + details[0] + '.';
        } else if (details.length > 1) {
            warningText += ' Causes: ' + details.slice(0, 3).join(' | ');
            if (details.length > 3) {
                warningText += ' | +' + (details.length - 3) + ' more';
            }
            warningText += '.';
        }
        warningText += ' Check spreadsheet ID, sharing permissions, and tab names.';

        warningNode.hidden = false;
        warningNode.textContent = warningText;
    }

    function rerenderAll() {
        showDataWarning();
        loadAlerts();
        loadOverview();
        loadPerformance();
        loadRevenue();
        loadExecutive();
        loadMaintenance();
        loadNotes();
        loadAssets();
        loadSecurity();
        bindExecutiveActions();
        bindOpportunityActions();
        bindLogout();
        bindFilters();
    }

    function loadData() {
        var fetches = Sheets.sheetNames.map(function (sheetName) {
            return Sheets.fetchSheetData(sheetName)
                .then(function (rows) {
                    return { sheetName: sheetName, rows: rows };
                })
                .catch(function (error) {
                    return {
                        sheetName: sheetName,
                        rows: [],
                        failed: true,
                        error: error && error.message ? error.message : 'Unknown fetch error'
                    };
                });
        });

        return Promise.all(fetches).then(function (result) {
            var data = {};
            var failedSheets = [];
            var failedSheetErrors = {};
            result.forEach(function (entry) {
                data[entry.sheetName] = entry.rows;
                if (entry.failed) {
                    var errorMessage = cleanFailureMessage(entry.error);
                    failedSheets.push(entry.sheetName);
                    failedSheetErrors[entry.sheetName] = errorMessage;
                    console.warn('Sheet load failed for "' + entry.sheetName + '": ' + errorMessage);
                }
            });
            state.failedSheets = failedSheets;
            state.failedSheetErrors = failedSheetErrors;
            return data;
        });
    }

    function hideLoader() {
        var loader = document.getElementById('dashboard-loading');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    window.onload = async function () {
        if (!enforceAuthAndRole()) {
            return;
        }
        loadSessionIdentity();
        loadSecurity();
        try {
            state.raw = await loadData();
            setupGlobalFilters();
            rerenderAll();
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };
})(window);
