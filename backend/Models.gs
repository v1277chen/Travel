/**
 * Models.gs
 * 資料模型層 - 負責與 Google Sheets 進行 CRUD 操作
 */

// === Helper Functions === //

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function getDataRows(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const startRow = 2;
  const lastRow = sheet.getLastRow();
  const numRows = lastRow - 1;
  if (numRows <= 0) return [];
  
  // 讀取 Header 並去除空白
  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = rawHeaders.map(h => h.toString().trim());
  
  // 除錯：記錄讀取到的 Headers
  if (sheetName === 'Users') {
    Logger.log(`[Models] Headers for ${sheetName}: ${JSON.stringify(headers)}`);
  }

  const data = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
  
  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // 確保 Key 為字串且不含空白
      if (header) { 
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

// === User Model === //

const UserModel = {
  SHEET_NAME: 'Users',

  create: function(user) {
    const sheet = getSheet(this.SHEET_NAME);
    const row = [
      user.user_id,
      user.email,
      user.name,
      user.avatar_url,
      user.role || 'user',
      user.status || 'active',
      new Date().toISOString(), // night_created_at
      new Date().toISOString()  // last_login
    ];
    sheet.appendRow(row);
    return this.findByEmail(user.email);
  },

  findByEmail: function(email) {
    const users = getDataRows(this.SHEET_NAME);
    return users.find(u => u.email === email);
  },
  
  findById: function(userId) {
    const users = getDataRows(this.SHEET_NAME);
    return users.find(u => u.user_id === userId);
  },

  updateLoginTime: function(email) {
    const sheet = getSheet(this.SHEET_NAME);
    const users = sheet.getDataRange().getValues();
    // header is row 1 (index 0), data starts index 1
    // headers: user_id(0), email(1), ..., last_login(7)
    // we assume headers are fixed as per Setup.gs
    
    // Find column index for email and last_login dynamically to be safe
    const headers = users[0];
    const emailIdx = headers.indexOf('email');
    const loginIdx = headers.indexOf('last_login');
    
    if (emailIdx === -1 || loginIdx === -1) return;

    for (let i = 1; i < users.length; i++) {
        if (users[i][emailIdx] === email) {
            sheet.getRange(i + 1, loginIdx + 1).setValue(new Date().toISOString());
            break;
        }
    }
  },

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

  listAll: function() {
      // For Admin, return all fields
      return getDataRows(this.SHEET_NAME);
  }
};
