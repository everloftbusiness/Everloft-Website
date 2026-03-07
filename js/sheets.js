(function (global) {
    var app = global.SuperAdminDashboard = global.SuperAdminDashboard || {};
    var Helpers = app.Helpers;
    var config = global.EVERLOFT_SHEETS_CONFIG || {};
    
    function readSpreadsheetSetting() {
        var queryId = '';
        var localId = '';

        try {
            if (global.location && global.location.search) {
                queryId = new URLSearchParams(global.location.search).get('sheetId') || '';
            }
        } catch (error) {
            queryId = '';
        }

        try {
            if (global.localStorage) {
                localId = global.localStorage.getItem('everloftSpreadsheetId') || '';
            }
        } catch (error) {
            localId = '';
        }

        return config.spreadsheetId || global.EVERLOFT_SPREADSHEET_ID || queryId || localId || '';
    }

    function extractSpreadsheetId(value) {
        var normalized = String(value || '').trim();
        var directMatch;
        var pathMatch;
        var queryMatch;

        if (!normalized || normalized.indexOf('REPLACE_WITH') !== -1) {
            return '';
        }

        directMatch = normalized.match(/^[a-zA-Z0-9-_]{20,}$/);
        if (directMatch) {
            return directMatch[0];
        }

        pathMatch = normalized.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
        if (pathMatch && pathMatch[1]) {
            return pathMatch[1];
        }

        queryMatch = normalized.match(/[?&]id=([a-zA-Z0-9-_]+)/i);
        if (queryMatch && queryMatch[1]) {
            return queryMatch[1];
        }

        return '';
    }

    function detectPayloadError(text) {
        var hasErrorStatus = /"status"\s*:\s*"error"/i.test(text || '');
        var messageMatch;

        if (!hasErrorStatus) {
            return '';
        }

        messageMatch = String(text || '').match(/"message"\s*:\s*"([^"]+)"/i);
        if (messageMatch && messageMatch[1]) {
            return messageMatch[1];
        }

        return 'Google Sheets query returned an error';
    }

    var SPREADSHEET_SOURCE = readSpreadsheetSetting();
    var SPREADSHEET_ID = extractSpreadsheetId(SPREADSHEET_SOURCE);
    var SPREADSHEET_CONFIG_ERROR = '';

    if (!String(SPREADSHEET_SOURCE || '').trim()) {
        SPREADSHEET_CONFIG_ERROR =
            'Spreadsheet ID is missing. Set EVERLOFT_SHEETS_CONFIG.spreadsheetId in js/sheets.config.js.';
    } else if (String(SPREADSHEET_SOURCE).indexOf('REPLACE_WITH') !== -1) {
        SPREADSHEET_CONFIG_ERROR =
            'Spreadsheet ID is still using the placeholder value. Update js/sheets.config.js with your real Google Sheet ID.';
    } else if (!SPREADSHEET_ID) {
        SPREADSHEET_CONFIG_ERROR =
            'Spreadsheet ID format is invalid. Use the raw sheet ID or a full Google Sheets URL.';
    }

    function buildUrl(sheetName) {
        return (
            'https://docs.google.com/spreadsheets/d/' +
            encodeURIComponent(SPREADSHEET_ID) +
            '/gviz/tq?tqx=out:json&sheet=' +
            encodeURIComponent(sheetName)
        );
    }

    function fetchSheetData(sheetName) {
        if (SPREADSHEET_CONFIG_ERROR) {
            return Promise.reject(new Error(SPREADSHEET_CONFIG_ERROR));
        }
        return fetch(buildUrl(sheetName))
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Sheet request failed: ' + response.status);
                }
                return response.text();
            })
            .then(function (text) {
                var queryError = detectPayloadError(text);
                if (queryError) {
                    throw new Error(queryError);
                }
                try {
                    return Helpers.parseSheetData(text);
                } catch (error) {
                    var body = String(text || '').toLowerCase();
                    if (body.indexOf('signin') !== -1 || body.indexOf('accounts.google.com') !== -1) {
                        throw new Error(
                            'Google Sheet requires sign-in. Share it to "Anyone with the link" (Viewer) for this dashboard.'
                        );
                    }
                    throw error;
                }
            })
            .catch(function (error) {
                if (error && error.message === 'Failed to fetch') {
                    throw new Error('Network/CORS blocked the Google Sheets request.');
                }
                throw error;
            });
    }

    app.Sheets = {
        fetchSheetData: fetchSheetData,
        spreadsheetId: SPREADSHEET_ID,
        configError: SPREADSHEET_CONFIG_ERROR,
        formLinks: {
            notes: config.notesFormUrl || '#',
            newAssetsAdd: config.newAssetsAddUrl || config.newAssetsEditUrl || '#',
            newAssetsEdit: config.newAssetsEditUrl || '#',
            newAssetsDelete: config.newAssetsDeleteUrl || config.newAssetsEditUrl || '#'
        },
        sheetNames: [
            'Bookings',
            'Assets',
            'Revenue',
            'Expenses',
            'Maintenance',
            'Payouts',
            'Admin_Signups',
            'Notes',
            'New_Assets'
        ]
    };
})(window);
