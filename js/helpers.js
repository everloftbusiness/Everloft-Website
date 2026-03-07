(function (global) {
    var app = global.SuperAdminDashboard = global.SuperAdminDashboard || {};

    function decodeSheetResponse(text) {
        var start = text.indexOf('{');
        var end = text.lastIndexOf('}');
        if (start === -1 || end === -1) {
            throw new Error('Unexpected sheet payload');
        }
        return JSON.parse(text.slice(start, end + 1));
    }

    function buildRow(cols, row) {
        var result = {};
        cols.forEach(function (col, index) {
            var label = (col.label || col.id || 'column_' + index).trim();
            var cell = row.c && row.c[index];
            result[label] = cell ? cell.v : '';
        });
        return result;
    }

    var helpers = {
        parseSheetData: function (payloadText) {
            var parsed = decodeSheetResponse(payloadText);
            if (!parsed.table) {
                return [];
            }
            var cols = parsed.table.cols || [];
            var rows = parsed.table.rows || [];
            return rows.map(function (row) {
                return buildRow(cols, row);
            });
        },

        parseGoogleSheetResponse: function (payloadText) {
            return helpers.parseSheetData(payloadText);
        },

        getField: function (row, keys, fallback) {
            var index;
            for (index = 0; index < keys.length; index += 1) {
                if (row[keys[index]] !== undefined && row[keys[index]] !== null && row[keys[index]] !== '') {
                    return row[keys[index]];
                }
            }
            return fallback;
        },

        groupData: function (list, key) {
            return list.reduce(function (acc, item) {
                var groupKey = item[key] || item[key && key.toLowerCase()] || item[key && key.toUpperCase()] || 'Unknown';
                if (!acc[groupKey]) {
                    acc[groupKey] = [];
                }
                acc[groupKey].push(item);
                return acc;
            }, {});
        },

        calculateOccupancy: function (bookings, assets) {
            var bookedNights = bookings.reduce(function (sum, booking) {
                var nights = Number(
                    helpers.getField(booking, ['Nights', 'nights', 'BookedNights', 'booked_nights'], 0)
                );
                return sum + (Number.isNaN(nights) ? 0 : nights);
            }, 0);

            var availableNights = assets.reduce(function (sum, asset) {
                var nights = Number(
                    helpers.getField(asset, ['AvailableNights', 'available_nights', 'availableNights'], 0)
                );
                return sum + (Number.isNaN(nights) ? 0 : nights);
            }, 0);

            if (!availableNights) {
                return 0;
            }
            return Math.min(100, Math.round((bookedNights / availableNights) * 100));
        },

        calculateMetrics: function (revenueRows, expenseRows) {
            var totalRevenue = revenueRows.reduce(function (sum, row) {
                var val = Number(helpers.getField(row, ['Revenue', 'revenue', 'Amount', 'amount'], 0));
                return sum + (Number.isNaN(val) ? 0 : val);
            }, 0);

            var totalExpense = expenseRows.reduce(function (sum, row) {
                var val = Number(helpers.getField(row, ['Expense', 'expense', 'Expenses', 'expenses', 'Amount', 'amount'], 0));
                return sum + (Number.isNaN(val) ? 0 : val);
            }, 0);

            return {
                revenue: totalRevenue,
                expenses: totalExpense,
                net: totalRevenue - totalExpense
            };
        },

        formatCurrency: function (value) {
            if (Number.isNaN(Number(value))) {
                return 'INR 0';
            }
            return 'INR ' + Number(value).toLocaleString('en-IN');
        },

        formatDate: function (value) {
            var date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value || '-';
            }
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        },

        summarizeAdministrations: function (rows, pendingKey) {
            return rows.map(function (row) {
                var identity = helpers.getField(row, ['Email', 'email', 'Name', 'name'], Math.random().toString(36));
                return {
                    name: helpers.getField(row, ['Name', 'name', 'FullName', 'full_name'], 'Unknown'),
                    email: helpers.getField(row, ['Email', 'email', 'Contact'], '-'),
                    role: helpers.getField(row, ['Role', 'role'], 'Pending'),
                    status: helpers.getField(row, ['Status', 'status', 'ApprovalStatus'], pendingKey || 'Pending'),
                    id: String(identity).replace(/\s+/g, '-').toLowerCase()
                };
            });
        }
    };

    app.Helpers = helpers;
})(window);
