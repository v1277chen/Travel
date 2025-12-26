/**
 * Models.js
 * 資料存取層
 */

var Models = {};

(function (ns) {

    // 通用 Helper: 取得 Sheet 物件
    function getSheet(name) {
        return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    }

    // 通用 Helper: 讀取所有資料為物件陣列
    function getRows(sheetName) {
        var sheet = getSheet(sheetName);
        var data = sheet.getDataRange().getValues();
        if (data.length < 2) return [];
        var headers = data[0];
        var rows = data.slice(1);

        return rows.map(function (row) {
            var obj = {};
            headers.forEach(function (header, index) {
                obj[header] = row[index];
            });
            return obj;
        });
    }

    // 通用 Helper: 新增一筆資料
    function addRow(sheetName, item) {
        var sheet = getSheet(sheetName);
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var row = headers.map(function (header) {
            return item[header] || '';
        });
        sheet.appendRow(row);
        return item;
    }

    // User Model
    ns.Users = {
        findByEmail: function (email) {
            var users = getRows('Users');
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === email) return users[i];
            }
            return null;
        },
        findByToken: function (token) {
            if (!token) return null;
            var users = getRows('Users');
            for (var i = 0; i < users.length; i++) {
                if (users[i].auth_token === token) return users[i];
            }
            return null;
        },
        create: function (data) {
            data.id = generateUUID();
            data.created_at = new Date();
            data.updated_at = new Date();
            // Ensure auth_token column exists in sheet effectively, though schema is in Setup.js
            return addRow('Users', data);
        },
        updateToken: function (userId, token) {
            var sheet = getSheet('Users');
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            var colIndex = headers.indexOf('auth_token');

            // If column doesn't exist, we might need to add it, but for now assume Setup.js is handled or we handle it dynamically?
            // Safer to check index
            if (colIndex === -1) {
                // Return false or log error? For now, let's assume valid schema
                // Actually, let's auto-add checking for robustness if possible, but simplicity first due to GAS limitations on column insertion mid-flight implies schema migration best done in Setup.js
                return false;
            }

            for (var i = 1; i < rows.length; i++) {
                var rowId = rows[i][headers.indexOf('id')];
                if (rowId === userId) {
                    sheet.getRange(i + 1, colIndex + 1).setValue(token);
                    return true;
                }
            }
            return false;
        }
    };

    // Trip Model
    ns.Trips = {
        findByOwner: function (ownerId) {
            var trips = getRows('Trips');
            return trips.filter(function (t) { return t.owner_id === ownerId; });
        },
        findById: function (tripId) {
            var trips = getRows('Trips');
            for (var i = 0; i < trips.length; i++) {
                if (trips[i].id === tripId) return trips[i];
            }
            return null;
        },
        create: function (data) {
            data.id = generateUUID();
            data.created_at = new Date();
            data.updated_at = new Date();
            return addRow('Trips', data);
        },
        update: function (tripId, data) {
            var sheet = getSheet('Trips');
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            // Find row index (1-based)
            for (var i = 1; i < rows.length; i++) {
                var rowId = rows[i][headers.indexOf('id')];
                if (rowId === tripId) {
                    // Update logic
                    for (var key in data) {
                        var colIndex = headers.indexOf(key);
                        if (colIndex > -1 && key !== 'id' && key !== 'created_at') { // Protect ID and created_at
                            sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
                        }
                    }
                    sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date());
                    return true;
                }
            }
            return false;
        },
        delete: function (tripId) {
            var sheet = getSheet('Trips');
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            for (var i = 1; i < rows.length; i++) {
                var rowId = rows[i][headers.indexOf('id')];
                if (rowId === tripId) {
                    sheet.deleteRow(i + 1);
                    return true;
                }
            }
            return false;
        }
    };

    // Itinerary Items Model
    ns.ItineraryItems = {
        findByTripId: function (tripId) {
            var items = getRows('Itinerary_Items');
            // 簡單排序，實際應用可能需要更複雜的排序邏輯
            return items.filter(function (item) { return item.trip_id === tripId; })
                .sort(function (a, b) {
                    if (a.day_index === b.day_index) {
                        return a.order_index - b.order_index;
                    }
                    return a.day_index - b.day_index;
                });
        },
        create: function (data) {
            data.id = generateUUID();
            data.created_at = new Date();
            data.updated_at = new Date();
            return addRow('Itinerary_Items', data);
        },
        update: function (itemId, data) {
            var sheet = getSheet('Itinerary_Items');
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            // Find row index (1-based)
            for (var i = 1; i < rows.length; i++) {
                var rowId = rows[i][headers.indexOf('id')];
                if (rowId === itemId) {
                    // Update logic (simplified: update generic fields)
                    for (var key in data) {
                        var colIndex = headers.indexOf(key);
                        if (colIndex > -1) {
                            sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
                        }
                    }
                    sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date());
                    return true;
                }
            }
            return false;
        },
        delete: function (itemId) {
            var sheet = getSheet('Itinerary_Items');
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            for (var i = 1; i < rows.length; i++) { // Skip header
                var rowId = rows[i][headers.indexOf('id')];
                if (rowId === itemId) {
                    sheet.deleteRow(i + 1);
                    return true;
                }
            }
            return false;
        },
        deleteByTripId: function (tripId) {
            var sheet = getSheet('Itinerary_Items');
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            var tripIdIndex = headers.indexOf('trip_id');
            var rowsDeleted = 0;
            // Loop backwards to avoid index shifting issues when deleting
            for (var i = rows.length - 1; i >= 1; i--) {
                if (rows[i][tripIdIndex] === tripId) {
                    sheet.deleteRow(i + 1);
                    rowsDeleted++;
                }
            }
            return rowsDeleted;
        }
    };

})(Models);
