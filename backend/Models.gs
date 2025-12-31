/**
 * Models.gs
 * 資料模型層 (Data Model Layer)
 * 
 * 負責直接與 Google Sheets 資料庫進行互動 (CRUD 操作)。
 * 每個 Model 對應一張工作表 (Sheet)，封裝了對該表的讀寫邏輯。
 */

// === Helper Functions (輔助函式) === //

/**
 * 取得指定名稱的工作表物件
 * @param {string} name - 工作表名稱
 * @returns {Sheet} Google Sheet 物件
 */
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/**
 * 讀取工作表的所有資料，並轉換為物件陣列
 * 
 * @param {string} sheetName - 工作表名稱
 * @returns {Array<Object>} 包含每一列資料的物件陣列，Key 為標題列名稱
 */
function getDataRows(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  
  const startRow = 2; // 資料從第 2 列開始 (第 1 列為標題)
  const lastRow = sheet.getLastRow();
  const numRows = lastRow - 1; // 資料總列數
  
  if (numRows <= 0) return []; // 若無資料則回傳空陣列
  
  // 1. 讀取標題列 (Header)
  // `getRange(row, col, numRows, numCols)`
  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // 處理標題：轉字串並去除前後空白，避免 Key 比對錯誤
  const headers = rawHeaders.map(h => h.toString().trim());
  
  // 除錯紀錄：為了確認讀取到的 Header 是否正確 (特別是 Users 表)
  if (sheetName === 'Users') {
    Logger.log(`[Models] Headers for ${sheetName}: ${JSON.stringify(headers)}`);
  }

  // 2. 讀取所有資料列
  const data = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
  
  // 3. 將二維陣列映射為物件陣列 (Map Array onto Objects)
  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // 確保 header 有值才建立屬性
      if (header) { 
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

// === User Model (使用者模型) === //
/**
 * 對應 'Users' 工作表
 * 欄位: user_id, email, name, avatar_url, role, status, created_at, last_login
 */
const UserModel = {
  SHEET_NAME: 'Users',

  /**
   * 建立新使用者
   * @param {Object} user - 使用者物件
   * @returns {Object} 建立後的使用者資料 (含資料庫最新狀態)
   */
  create: function(user) {
    const sheet = getSheet(this.SHEET_NAME);
    const row = [
      user.user_id,
      user.email,
      user.name,
      user.avatar_url,
      user.role || 'user',    // 預設角色: user
      user.status || 'active', // 預設狀態: active
      new Date().toISOString(), // 建立時間
      new Date().toISOString()  // 最後登入時間
    ];
    sheet.appendRow(row);
    // 建立後重新讀取一次，確保回傳格式一致
    return this.findByEmail(user.email);
  },

  /**
   * 根據 Email 搜尋使用者
   * @param {string} email 
   * @returns {Object|undefined} 找到的使用者物件，或 undefined
   */
  findByEmail: function(email) {
    const users = getDataRows(this.SHEET_NAME);
    return users.find(u => u.email === email);
  },
  
  /**
   * 根據 User ID 搜尋使用者
   * @param {string} userId 
   * @returns {Object|undefined}
   */
  findById: function(userId) {
    const users = getDataRows(this.SHEET_NAME);
    return users.find(u => u.user_id === userId);
  },

  /**
   * 更新使用者的最後登入時間
   * @param {string} email 
   */
  updateLoginTime: function(email) {
    const sheet = getSheet(this.SHEET_NAME);
    const users = sheet.getDataRange().getValues(); // 讀取整張表
    const headers = users[0];
    const emailIdx = headers.indexOf('email');
    const loginIdx = headers.indexOf('last_login');
    
    if (emailIdx === -1 || loginIdx === -1) return;

    // 遍歷尋找對應 Email 的列 (從第 1 列開始，跳過 Header)
    for (let i = 1; i < users.length; i++) {
        if (users[i][emailIdx] === email) {
            // 更新該格資料 (Row index 為 i+1 因為 sheet 是 1-based)
            sheet.getRange(i + 1, loginIdx + 1).setValue(new Date().toISOString());
            break;
        }
    }
  },

  /**
   * 更新使用者狀態 (封鎖/解鎖)
   * @param {string} email 
   * @param {string} status - 'active' 或 'banned'
   * @returns {boolean} 是否更新成功
   */
  updateStatus: function(email, status) {
     const sheet = getSheet(this.SHEET_NAME);
     const data = sheet.getDataRange().getValues();
     const headers = data[0];
     const emailIdx = headers.indexOf('email');
     const statusIdx = headers.indexOf('status');
     
     if (emailIdx === -1 || statusIdx === -1) return false;
     
     for(let i=1; i<data.length; i++){
         if(data[i][emailIdx] === email){
             sheet.getRange(i+1, statusIdx+1).setValue(status);
             return true;
         }
     }
     return false;
  },

  /**
   * 更新使用者角色 (升級/降級)
   * @param {string} email 
   * @param {string} role - 'user' 或 'admin'
   * @returns {boolean} 是否更新成功
   */
  updateRole: function(email, role) {
     const sheet = getSheet(this.SHEET_NAME);
     const data = sheet.getDataRange().getValues();
     const headers = data[0];
     const emailIdx = headers.indexOf('email');
     const roleIdx = headers.indexOf('role');
     
     if (emailIdx === -1 || roleIdx === -1) return false;
     
     for(let i=1; i<data.length; i++){
         if(data[i][emailIdx] === email){
             sheet.getRange(i+1, roleIdx+1).setValue(role);
             return true;
         }
     }
     return false;
  },

  /**
   * 更新使用者名稱 (用於自動修復資料)
   * @param {string} email 
   * @param {string} name 
   * @returns {boolean}
   */
  updateName: function(email, name) {
     const sheet = getSheet(this.SHEET_NAME);
     const data = sheet.getDataRange().getValues();
     const headers = data[0];
     const emailIdx = headers.indexOf('email');
     const nameIdx = headers.indexOf('name');
     
     if (emailIdx === -1 || nameIdx === -1) return false;
     
     for(let i=1; i<data.length; i++){
         if(data[i][emailIdx] === email){
             sheet.getRange(i+1, nameIdx+1).setValue(name);
             return true;
         }
     }
     return false;
  },

  /**
   * 列出所有使用者
   * @returns {Array<Object>}
   */
  listAll: function() {
      return getDataRows(this.SHEET_NAME);
  }
};

// === Trip Model (行程模型) === //
/**
 * 對應 'Trips' 工作表
 * 欄位: trip_id, user_id, title, description, start_date, end_date, status...
 */
const TripModel = {
  SHEET_NAME: 'Trips',
  
  /**
   * 建立新行程
   * @param {Object} trip - 行程物件
   */
  create: function(trip) {
    const sheet = getSheet(this.SHEET_NAME);
    const row = [
      trip.trip_id,
      trip.user_id,
      trip.title,
      trip.description || '',
      trip.start_date || '',
      trip.end_date || '',
      trip.status || 'planning', // 預設狀態
      trip.created_at,
      trip.updated_at
    ];
    sheet.appendRow(row);
    return trip;
  },
  
  /**
   * 取得特定使用者的所有行程 (未刪除的)
   * @param {string} userId 
   */
  findByUserId: function(userId) {
    const allTrips = getDataRows(this.SHEET_NAME);
    // 過濾使用者的行程，且排除已刪除 (soft delete) 的資料
    return allTrips.filter(t => t.user_id === userId && t.status !== 'deleted');
  },
  
  /**
   * 根據 ID 取得行程
   * @param {string} tripId 
   */
  findById: function(tripId) {
    const allTrips = getDataRows(this.SHEET_NAME);
    return allTrips.find(t => t.trip_id === tripId);
  },
  
  /**
   * 更新行程資料
   * @param {string} tripId 
   * @param {Object} updates - 要更新的欄位與值，例如 { title: 'New', status: 'active' }
   */
  update: function(tripId, updates) {
    const sheet = getSheet(this.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('trip_id');
    
    if (idIdx === -1) return null;
    
    // 線性搜尋 ID (若資料量大可考慮 TextFinder 或 Cache)
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === tripId) {
        // 逐一更新指定的欄位
        for (const [key, value] of Object.entries(updates)) {
          const colIdx = headers.indexOf(key);
          if (colIdx !== -1) {
             sheet.getRange(i + 1, colIdx + 1).setValue(value);
          }
        }
        return true;
      }
    }
    return false;
  }
};

// === Trip Day Model (行程天數模型) === //
/**
 * 對應 'TripDays' 工作表
 * 儲存行程中的每一天資訊
 */
const TripDayModel = {
  SHEET_NAME: 'TripDays',
  
  /**
   * 批次建立天數資料 (Create Batch)
   * 建立行程時，根據日期範圍一次寫入多天
   * @param {Array<Object>} days 
   */
  createBatch: function(days) {
    const sheet = getSheet(this.SHEET_NAME);
    // 轉換為二維陣列以便一次寫入
    const rows = days.map(d => [
      d.day_id,
      d.trip_id,
      d.date,
      d.day_order,
      d.weather_info || ''
    ]);
    if (rows.length > 0) {
      // 批次寫入：提高效能
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
  },
  
  /**
   * 取得特定行程的所有天數，並按順序排列
   * @param {string} tripId 
   */
  findByTripId: function(tripId) {
    const all = getDataRows(this.SHEET_NAME);
    return all.filter(d => d.trip_id === tripId).sort((a,b) => a.day_order - b.day_order);
  }
};

// === Trip Item Model (行程細項模型) === //
/**
 * 對應 'TripItems' 工作表
 * 儲存具體的景點、餐廳、交通等項目
 */
const TripItemModel = {
  SHEET_NAME: 'TripItems',
  
  /**
   * 建立新項目
   * @param {Object} item 
   */
  create: function(item) {
    const sheet = getSheet(this.SHEET_NAME);
    const row = [
      item.item_id,
      item.trip_id,
      item.day_id,
      item.type,
      item.name,
      item.location || '',
      item.start_time || '',
      item.end_time || '',
      item.notes || '',
      item.cost || 0,
      item.status || 'active'
    ];
    sheet.appendRow(row);
    return item;
  },
  
  /**
   * 取得特定行程的所有項目 (未刪除的)
   * @param {string} tripId 
   */
  findByTripId: function(tripId) {
    const all = getDataRows(this.SHEET_NAME);
    return all.filter(i => i.trip_id === tripId && i.status !== 'deleted');
  },
  
  /**
   * 更新項目
   */
  update: function(itemId, updates) {
    const sheet = getSheet(this.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('item_id');
    
    if (idIdx === -1) return null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === itemId) {
        for (const [key, value] of Object.entries(updates)) {
          const colIdx = headers.indexOf(key);
          if (colIdx !== -1) {
             sheet.getRange(i + 1, colIdx + 1).setValue(value);
          }
        }
        return true;
      }
    }
    return false;
  },

  /**
   * 刪除項目 (Soft Delete)
   * 將狀態設為 'deleted' (邏輯刪除)
   */
  delete: function(itemId) {
      return this.update(itemId, { status: 'deleted' });
  }
};
