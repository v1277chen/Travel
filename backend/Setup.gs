/**
 * Setup.gs
 * 資料庫初始化與安裝腳本 (Database Initialization Script)
 * 
 * 用於在 Google Sheets 中自動建立所需的 Tables (Worksheets) 與標題列。
 * 執行此腳本 (initDatabase) 可完成後端資料庫的建置。
 */

/**
 * 初始化資料庫
 * 依序檢查並建立系統所需的各個工作表。
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Users Sheet (使用者表)
  createSheetIfNotExists(ss, 'Users', [
    'user_id',      // Google Subject ID (Unique Key)
    'email',        // Email
    'name',         // 顯示名稱
    'avatar_url',   // 頭像連結
    'role',         // 角色權限 (admin/user)
    'status',       // 帳號狀態 (active/banned)
    'created_at',   // 註冊時間
    'last_login'    // 最後登入時間
  ]);
  
  // 2. Trips Sheet (行程主表)
  createSheetIfNotExists(ss, 'Trips', [
    'trip_id',      // 行程唯一碼 (UUID)
    'user_id',      // 擁有者 ID (Foreign Key -> Users)
    'title',        // 行程標題
    'description',  // 行程描述
    'start_date',   // 開始日期
    'end_date',     // 結束日期
    'status',       // 狀態 (planning/active/completed/deleted)
    'created_at',   // 建立時間
    'updated_at'    // 更新時間
  ]);
  
  // 3. TripDays Sheet (行程天數表 - 每一天的資訊)
  createSheetIfNotExists(ss, 'TripDays', [
    'day_id',       // 天數唯一碼 (UUID)
    'trip_id',      // 所屬行程 (Foreign Key -> Trips)
    'date',         // 是哪一天 (YYYY-MM-DD)
    'day_order',    // 第幾天 (1, 2, 3...)
    'weather_info'  // 天氣資訊 (預留)
  ]);

  // 4. TripItems Sheet (行程細項表 - 景點/活動)
  createSheetIfNotExists(ss, 'TripItems', [
    'item_id',      // 項目唯一碼 (UUID)
    'trip_id',      // 所屬行程
    'day_id',       // 所屬天數 (Foreign Key -> TripDays)
    'type',         // 類型 (attraction, food, transport, hotel, other)
    'name',         // 地點/活動名稱
    'location',     // 地點資訊 (地址或座標)
    'start_time',   // 開始時間
    'end_time',     // 結束時間
    'notes',        // 備註
    'cost',         // 預估花費
    'status'        // 狀態 (active/deleted)
  ]);
  
  // 5. Collaborators Sheet (共用權限表 - 協作者)
  createSheetIfNotExists(ss, 'Collaborators', [
    'trip_id',
    'user_id',
    'role',         // owner, editor, viewer
    'status'        // active, pending
  ]);

  // 6. Logs Sheet (系統日誌表)
  createSheetIfNotExists(ss, 'Logs', [
    'timestamp',    // 發生時間
    'level',        // 等級 (INFO/WARN/ERROR)
    'message',      // 訊息內容
    'payload'       // 詳細資料 JSON
  ]);
}

/**
 * 建立工作表 (若不存在)
 * 
 * @param {Spreadsheet} ss - 試算表物件
 * @param {string} name - 工作表名稱
 * @param {Array<string>} headers - 標題列陣列
 */
function createSheetIfNotExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    // 若不存在則建立
    sheet = ss.insertSheet(name);
    // 寫入標題列
    sheet.appendRow(headers);
    // 凍結第一列 (方便查看)
    sheet.setFrozenRows(1);
    // 將標題列設為粗體
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    Logger.log('Created sheet: ' + name);
  } else {
    // 若已存在，僅記錄日誌 (不自動覆蓋，以免遺失資料)
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`Sheet ${name} exists. Headers: ${JSON.stringify(currentHeaders)}`);
  }
}
