/**
 * Setup.gs
 * 負責初始化 Google Sheets 資料庫結構
 */

/**
 * 初始化資料庫
 * 執行此函式會檢查並建立缺少的 Sheets 與欄位
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    {
      name: 'Users',
      headers: ['user_id', 'email', 'name', 'avatar_url', 'role', 'status', 'created_at', 'last_login'],
      description: '使用者資料表'
    },
    {
      name: 'Trips',
      headers: ['trip_id', 'owner_id', 'title', 'start_date', 'end_date', 'cover_image', 'privacy', 'created_at', 'updated_at'],
      description: '行程主檔'
    },
    {
      name: 'TripDays',
      headers: ['day_id', 'trip_id', 'day_number', 'date', 'location_city'],
      description: '每日行程'
    },
    {
      name: 'TripItems',
      headers: ['item_id', 'trip_id', 'day_id', 'start_time', 'end_time', 'type', 'name', 'location_address', 'geo_lat', 'geo_lng', 'cost', 'transport_mode', 'notes', 'link_url'],
      description: '行程細項'
    },
    {
      name: 'Collaborators',
      headers: ['trip_id', 'user_email', 'permission'],
      description: '協作者權限'
    },
    {
      name: 'Logs',
      headers: ['timestamp', 'level', 'message', 'payload'],
      description: '系統日誌'
    }
  ];

  sheets.forEach(schema => {
    let sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
      // 寫入標題列
      sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
      // 凍結第一列
      sheet.setFrozenRows(1);
      // 設定標題樣式
      sheet.getRange(1, 1, 1, schema.headers.length)
           .setFontWeight('bold')
           .setBackground('#EEE')
           .setHorizontalAlignment('center'); 
      Logger.log(`[Created] ${schema.name} - ${schema.description}`);
    } else {
      Logger.log(`[Exists] ${schema.name}`);
    }
  });
}
