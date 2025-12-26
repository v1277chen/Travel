/**
 * Setup.js
 * 用於初始化 Google Sheets 資料表與欄位
 * 請手動執行 `initDatabase` 函式一次
 */

function initDatabase() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 定義資料表結構
    var schemas = {
        'Users': ['id', 'email', 'password_hash', 'display_name', 'avatar_url', 'created_at', 'updated_at'],
        'Trips': ['id', 'owner_id', 'title', 'start_date', 'end_date', 'destination', 'cover_image_url', 'privacy', 'currency', 'created_at', 'updated_at'],
        'Trip_Collaborators': ['trip_id', 'user_id', 'role', 'created_at'],
        'Itinerary_Items': ['id', 'trip_id', 'day_index', 'order_index', 'place_id', 'name', 'location_json', 'start_time', 'duration', 'transport_type', 'notes', 'cost_estimated', 'cost_actual', 'created_at', 'updated_at'],
        'Checklists': ['id', 'trip_id', 'category', 'item_name', 'is_checked', 'created_at']
    };

    for (var sheetName in schemas) {
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            // 寫入標題列
            sheet.getRange(1, 1, 1, schemas[sheetName].length).setValues([schemas[sheetName]]);
            // 凍結第一列
            sheet.setFrozenRows(1);
            // 加粗字體
            sheet.getRange(1, 1, 1, schemas[sheetName].length).setFontWeight("bold");
            Logger.log('Created sheet: ' + sheetName);
        } else {
            Logger.log('Sheet already exists: ' + sheetName);
            // 可選擇性更新標題 (如果需要)
        }
    }
}
