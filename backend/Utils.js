/**
 * Utils.js
 * 通用工具函式庫
 */

// 生成 UUID (簡單實作)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 建立成功回應
function createSuccessResponse(data) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'success',
    data: data
  }));
  return output;
}

// 建立錯誤回應
function createErrorResponse(message, code) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'error',
    message: message,
    code: code || 500
  }));
  return output;
}

// 解析請求內容
function parseRequestBody(e) {
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return null;
  }
}
