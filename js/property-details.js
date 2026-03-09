(function (global) {
    var app = global.SuperAdminDashboard = global.SuperAdminDashboard || {};
    var Sheets = app.Sheets;
    var Helpers = app.Helpers;
    var revenueChart = null;

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

        if (sessionRole !== 'super_admin') {
            window.location.replace(roleToDashboardPath(sessionRole));
            return false;
        }

        return true;
    }

    function parseDate(value) {
        var date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function startOfDay(value) {
        var date = parseDate(value || new Date());
        if (!date) {
            return null;
        }
        date = new Date(date.getTime());
        date.setHours(0, 0, 0, 0);
        return date;
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

    function fetchSheet(sheetName) {
        return Sheets.fetchSheetData(sheetName);
    }

    function currentMonthKey() {
        var today = startOfDay(new Date());
        return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    }

    function revenueMonthKey(row) {
        var month = toNumber(readField(row, ['Month'], 0));
        var year = toNumber(readField(row, ['Year'], 0));

        if (month && year) {
            return year + '-' + String(month).padStart(2, '0');
        }

        return null;
    }

    function monthLabel(monthKey) {
        if (!monthKey || monthKey.indexOf('-') === -1) {
            return monthKey || '-';
        }
        var parts = monthKey.split('-');
        var date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    }

    function buildStatusMarkup(value) {
        var label = value || 'Unknown';
        var normalized = String(label).toLowerCase();
        var chipClass =
            normalized.indexOf('active') !== -1 ||
            normalized.indexOf('confirm') !== -1 ||
            normalized.indexOf('complete') !== -1
                ? 'is-done'
                : 'is-pending';
        return '<span class="status-chip ' + chipClass + '">' + escapeHtml(label) + '</span>';
    }

    function renderCards(containerId, cards) {
        var container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        container.innerHTML = cards
            .map(function (card) {
                return [
                    '<article class="summary-card">',
                    '<p class="summary-label">' + escapeHtml(card.label) + '</p>',
                    '<p class="summary-value">' + escapeHtml(card.value) + '</p>',
                    '<p class="summary-note">' + escapeHtml(card.description) + '</p>',
                    '</article>'
                ].join('');
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
                            var content = value === undefined || value === null ? '-' : value;
                            if (!column.render) {
                                content = escapeHtml(content);
                            }
                            return '<td data-label="' + escapeHtml(column.label) + '">' + content + '</td>';
                        })
                        .join('') +
                    '</tr>'
                );
            })
            .join('');
    }

    function showWarning(message) {
        var warningNode = document.getElementById('property-details-warning');
        if (!warningNode) {
            return;
        }
        warningNode.hidden = false;
        warningNode.textContent = message;
    }

    function hideWarning() {
        var warningNode = document.getElementById('property-details-warning');
        if (!warningNode) {
            return;
        }
        warningNode.hidden = true;
        warningNode.textContent = '';
    }

    function hideLoader() {
        var loader = document.getElementById('property-details-loading');
        if (loader) {
            loader.style.display = 'none';
        }
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
        var logoutNode = document.getElementById('property-dashboard-logout');
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

    function renderPropertyInfo(asset, assetId) {
        var propertyName = readField(asset, ['Property_Name', 'PropertyName'], 'Unnamed Property');
        var city = readField(asset, ['City'], '-');
        var address = readField(asset, ['Address'], '-');
        var status = readField(asset, ['Status'], 'Unknown');
        var totalRooms = readField(asset, ['Total_Rooms', 'TotalRooms'], '-');

        setNodeText('property-title', propertyName);
        setNodeText('property-subtitle', city === '-' ? 'Asset ID: ' + assetId : city + ' | Asset ID: ' + assetId);
        setNodeText('property-info-id', 'Asset ID: ' + assetId);
        setNodeText('property-info-meta', 'Source: Assets sheet');

        renderCards('property-summary-cards', [
            {
                label: 'Property Name',
                value: propertyName,
                description: 'Primary property record from the Assets sheet.'
            },
            {
                label: 'City',
                value: city,
                description: 'Location assigned to this managed property.'
            },
            {
                label: 'Address',
                value: address,
                description: 'Street or landmark address from the sheet.'
            },
            {
                label: 'Status',
                value: status,
                description: 'Current operational status of the property.'
            },
            {
                label: 'Total Rooms',
                value: String(totalRooms),
                description: 'Room inventory currently recorded for this asset.'
            }
        ]);
    }

    function renderBookings(bookings) {
        var sorted = bookings.slice().sort(function (left, right) {
            var leftDate = parseDate(readField(left, ['Checkin_Date'], null));
            var rightDate = parseDate(readField(right, ['Checkin_Date'], null));
            if (!leftDate && !rightDate) {
                return 0;
            }
            if (!leftDate) {
                return 1;
            }
            if (!rightDate) {
                return -1;
            }
            return leftDate - rightDate;
        });

        setNodeText('property-bookings-meta', sorted.length === 1 ? '1 booking found' : sorted.length + ' bookings found');

        renderTable(
            'property-bookings-body',
            sorted.map(function (row) {
                return {
                    guest: readField(row, ['Guest_Name', 'GuestName'], '-'),
                    checkin: Helpers.formatDate(readField(row, ['Checkin_Date'], '-')),
                    checkout: Helpers.formatDate(readField(row, ['Checkout_Date'], '-')),
                    source: readField(row, ['Booking_Source', 'BookingSource'], '-'),
                    amount: Helpers.formatCurrency(toNumber(readField(row, ['Amount'], 0))),
                    status: buildStatusMarkup(readField(row, ['Status'], 'Unknown'))
                };
            }),
            [
                { key: 'guest', label: 'Guest Name' },
                { key: 'checkin', label: 'Checkin Date' },
                { key: 'checkout', label: 'Checkout Date' },
                { key: 'source', label: 'Source' },
                { key: 'amount', label: 'Amount' },
                {
                    key: 'status',
                    label: 'Status',
                    render: function (row) {
                        return row.status;
                    }
                }
            ]
        );
    }

    function renderRevenueChart(labels, values) {
        var canvas = document.getElementById('property-revenue-chart');
        var chartNote = document.getElementById('property-revenue-chart-note');

        if (!canvas) {
            return;
        }

        if (!global.Chart) {
            if (chartNote) {
                chartNote.textContent = 'Chart.js failed to load, so the revenue chart is unavailable.';
            }
            return;
        }

        if (revenueChart) {
            revenueChart.destroy();
        }

        revenueChart = new global.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Net Revenue',
                        data: values,
                        backgroundColor: ['#5e42a6', '#6a57c7', '#b74e91', '#f3d9a2', '#7b8fd6', '#c48dc7'],
                        borderRadius: 10,
                        borderSkipped: false,
                        maxBarThickness: 42
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Net Revenue: ' + Helpers.formatCurrency(context.parsed.y || 0);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#637892'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#637892',
                            callback: function (value) {
                                return 'INR ' + Number(value).toLocaleString('en-IN');
                            }
                        },
                        grid: {
                            color: 'rgba(99, 120, 146, 0.12)'
                        }
                    }
                }
            }
        });
    }

    function renderRevenue(rows) {
        var grouped = {};
        var labels;
        var values;
        var currentKey = currentMonthKey();
        var latestKey;
        var currentRevenue;
        var totalRevenue;

        rows.forEach(function (row) {
            var key = revenueMonthKey(row);
            if (!key) {
                return;
            }
            if (!grouped[key]) {
                grouped[key] = 0;
            }
            grouped[key] += toNumber(readField(row, ['Net_Amount', 'NetAmount', 'Net'], 0));
        });

        labels = Object.keys(grouped).sort();
        values = labels.map(function (label) {
            return grouped[label];
        });
        latestKey = labels.length ? labels[labels.length - 1] : null;
        currentRevenue = grouped[currentKey] || 0;
        totalRevenue = values.reduce(function (sum, value) {
            return sum + value;
        }, 0);

        setNodeText('property-revenue-current', Helpers.formatCurrency(currentRevenue));
        setNodeText('property-revenue-total', Helpers.formatCurrency(totalRevenue));
        setNodeText('property-revenue-months', String(labels.length));
        setNodeText('property-revenue-latest', latestKey ? monthLabel(latestKey) : 'No revenue data');
        setNodeText('property-revenue-chart-meta', labels.length ? 'Net revenue tracked across ' + labels.length + ' month(s).' : 'No revenue rows found for this property.');
        setNodeText(
            'property-revenue-chart-note',
            labels.length
                ? 'Current month revenue is shown separately above, and the chart uses Revenue.Net_Amount grouped by month.'
                : 'Add Revenue rows for this Asset_ID to populate the chart.'
        );

        renderRevenueChart(
            labels.map(function (label) {
                return monthLabel(label);
            }),
            values
        );
    }

    async function loadPropertyDetails() {
        var params = new URLSearchParams(window.location.search);
        var assetId = params.get('id');
        var assetRows;
        var bookingRows;
        var revenueRows;
        var asset;

        bindLogout();
        hideWarning();

        if (!assetId) {
            showWarning('Property id is missing from the URL. Open this page with a link like property-details.html?id=PROP001.');
            hideLoader();
            return;
        }

        try {
            assetRows = await fetchSheet('Assets');
            bookingRows = await fetchSheet('Bookings');
            revenueRows = await fetchSheet('Revenue');

            asset = (assetRows || []).find(function (row) {
                return String(readField(row, ['Asset_ID', 'AssetId', 'ID'], '')).trim() === assetId;
            });

            if (!asset) {
                showWarning('No property was found for Asset_ID ' + assetId + '.');
                return;
            }

            renderPropertyInfo(asset, assetId);
            renderBookings(
                (bookingRows || []).filter(function (row) {
                    return String(readField(row, ['Asset_ID', 'AssetId', 'Property_ID'], '')).trim() === assetId;
                })
            );
            renderRevenue(
                (revenueRows || []).filter(function (row) {
                    return String(readField(row, ['Asset_ID', 'AssetId', 'Property_ID'], '')).trim() === assetId;
                })
            );
        } catch (error) {
            console.error(error);
            showWarning(error && error.message ? error.message : 'Unable to load property details.');
        } finally {
            hideLoader();
        }
    }

    window.onload = function () {
        if (!enforceAuthAndRole()) {
            return;
        }
        loadPropertyDetails();
    };
})(window);
