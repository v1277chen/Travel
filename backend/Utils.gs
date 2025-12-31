/**
 * Utils.gs
 * 工具函式庫 (回應格式、日誌記錄)
 */

/**
 * 建立成功回應 (JSON)
 * @param {Object} data - 回傳的資料物件
 * @returns {TextOutput}
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 建立錯誤回應 (JSON)
 * @param {string} message - 錯誤訊息
 * @param {string} code - 錯誤代碼 (預設 500)
 * @returns {TextOutput}
 */
function errorResponse(message, code = 'INTERNAL_ERROR') {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    code: code,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 記錄日誌到 'Logs' Sheet
 * @param {string} level - INFO, WARN, ERROR
 * @param {string} message - 訊息內容
 * @param {Object} payload - 詳細資料 (選填)
 */
function logToSheet(level, message, payload = {}) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Logs');
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(),
        level,
        message,
        JSON.stringify(payload)
      ]);
    }
  } catch (e) {
    Logger.log('Logging failed: ' + e.toString());
  }
}

/**
 * 產生 UUID
 * @returns {string}
 */
function generateUUID() {
  return Utilities.getUuid();
}
