/**
 * Utils.gs
 * 工具函式庫 (Utilities)
 * 
 * 提供全域通用的輔助函式，例如：
 * 1. 標準化 JSON 回應格式 (Response Helper)。
 * 2. 系統日誌記錄 (Logging)。
 * 3. UUID 生成。
 */

/**
 * 建立成功回應物件 (Success Response)
 * 統一 API 的成功回傳格式。
 * 
 * @param {Object} data - 要回傳的資料
 * @returns {TextOutput} Google Apps Script 的 TextOutput 物件 (MIME: JSON)
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 建立錯誤回應物件 (Error Response)
 * 統一 API 的錯誤回傳格式。
 * 
 * @param {string} message - 錯誤訊息描述
 * @param {string} code - 錯誤代碼 (例如: 'AUTH_FAILED', 'INVALID_REQUEST')
 * @returns {TextOutput} Google Apps Script 的 TextOutput 物件 (MIME: JSON)
 */
function errorResponse(message, code = 'INTERNAL_ERROR') {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    code: code,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 記錄日誌到 Google Sheets (Log to Sheet)
 * 將系統的重要事件或錯誤寫入 'Logs' 工作表，方便開發者排查問題。
 * 
 * @param {string} level - 日誌等級 (INFO, WARN, ERROR)
 * @param {string} message - 主要訊息
 * @param {Object} payload - 詳細資料 (會被轉為 JSON 字串存入)
 */
function logToSheet(level, message, payload = {}) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Logs');
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(), // Timestamp
        level,                    // Level
        message,                  // Message
        JSON.stringify(payload)   // Payload (JSON String)
      ]);
    }
  } catch (e) {
    // 若記錄日誌本身失敗 (例如 Sheet 不存在)，則僅輸出到 GAS 控制台，避免造成無窮迴圈
    Logger.log('Logging failed: ' + e.toString());
  }
}

/**
 * 產生 UUID (Universally Unique Identifier)
 * 使用 GAS 內建的 Utilities 產生標準 UUID。
 * 用於 User ID, Trip ID 等唯一識別碼。
 * 
 * @returns {string} UUID 字串
 */
function generateUUID() {
  return Utilities.getUuid();
}
