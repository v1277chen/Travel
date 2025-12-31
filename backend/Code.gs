/**
 * Code.gs
 * API 進入點與路由分發 (API Entry Point & Router)
 * 
 * 此檔案是 Google Apps Script Web App 的主要進入點。
 * 負責接收前端發送的 POST 請求，進行初步的參數驗證、身分驗證，
 * 並根據 `action` 參數將請求分發 (Route) 給對應的服務函式處理。
 */

/**
 * 處理 POST 請求 (Handle POST Request)
 * 
 * GAS Web App 預設會呼叫此函式來處理 HTTP POST 請求。
 * 前端所有的 API 呼叫 (Login, Get Data, Update, etc.) 統一透過此入口。
 * 
 * @param {Object} e - 事件物件 (Event Object)，包含請求的參數與內容。
 * @param {Object} e.postData - 請求的主體資料。
 * @param {string} e.postData.contents - JSON 格式的字串，包含前端傳來的資料。
 * @returns {TextOutput} 回傳 JSON 格式的回應結果。
 */
function doPost(e) {
  try {
    // 1. 檢查請求格式
    // 確保請求包含 postData 且有內容，否則視為無效請求。
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse('Missing postData', 'INVALID_REQUEST');
    }

    // 2. 解析 Payload (JSON Parse)
    // 前端傳來的資料應為 JSON 字串，需解析為 JavaScript 物件。
    // 預期結構: { action: "...", token: "...", payload: { ... } }
    const params = JSON.parse(e.postData.contents);
    const action = params.action; // 請求動作名稱 (例如: 'login', 'trip/create')
    const token = params.token;   // Google ID Token (用於身分驗證)
    const payload = params.payload || {}; // 實際業務資料 (例如: 行程標題、日期等)

    // 檢查是否有指定動作
    if (!action) {
      return errorResponse('Missing action parameter', 'INVALID_REQUEST');
    }

    // 3. 特殊路由處理 - 登入 (Login)
    // 'login' 動作不需要先驗證 User 是否存在 (因為正在登入)，直接呼叫驗證函式。
    if (action === 'login') {
      try {
        // 驗證 Token 並取得/註冊使用者
        const user = authenticateAndGetUser(token);
        
        // 回傳成功訊息與使用者資料
        return jsonResponse({
          success: true,
          user: user
        });
      } catch (err) {
        // 登入失敗 (Token 無效或被封鎖)
        return errorResponse(err.message, 'AUTH_FAILED');
      }
    }

    // 4. 身分驗證 (Authentication) - 對於非登入請求
    // 所有其他 API 動作都需要先確保使用者已登入且 Token 有效。
    var currentUser;
    try {
      if (!token) throw new Error('Token required'); // Token 為必填
      
      // 呼叫 Auth.gs 中的驗證函式
      // 此函式會驗證 Google Token，並從資料庫讀取使用者資料
      // 若 Token 無效或使用者被封鎖，會拋出錯誤
      currentUser = authenticateAndGetUser(token); 
    } catch (err) {
      return errorResponse('Authentication failed: ' + err.message, 'UNAUTHORIZED');
    }

    // 5. 路由分發 (Router)
    // 根據 action 名稱，呼叫對應的 Service 函式
    var result = null;
    switch (action) {
      // === 管理員相關功能 (Admin Module) ===
      case 'admin/getUsers':
        // 取得使用者列表 (需 Admin 權限)
        result = handleAdminListUsers(currentUser, payload);
        break;
      case 'admin/updateUser':
        // 更新使用者狀態或權限 (需 Admin 權限)
        result = handleAdminUpdateUser(currentUser, payload);
        break;
        
      // === 行程管理功能 (Trip Module) ===
      case 'trip/create': 
        // 建立新行程
        result = TripService.create(currentUser, payload); 
        break;
      case 'trip/list':   
        // 取得使用者的所有行程
        result = TripService.listByUser(currentUser); 
        break;
      case 'trip/get':    
        // 取得單一行程詳情
        result = TripService.getDetails(currentUser, payload); 
        break;
      case 'trip/delete': 
        // 刪除行程
        result = TripService.deleteTrip(currentUser, payload); 
        break;
      
      // === 行程項目功能 (Trip Item Module) ===
      case 'trip/addItem': 
        // 新增行程項目
        result = TripService.addItem(currentUser, payload); 
        break;
      case 'trip/updateItem': 
        // 更新行程項目
        result = TripService.updateItem(currentUser, payload); 
        break;
      case 'trip/deleteItem': 
        // 刪除行程項目
        result = TripService.deleteItem(currentUser, payload); 
        break;
      
      default:
        // 若找不到對應的 action，回傳 404 錯誤
        return errorResponse('Unknown action: ' + action, 'NOT_FOUND');
    }

    // 6. 回傳執行結果
    // 將 Service 回傳的物件包裝成標準 JSON 回應
    return jsonResponse(result);

  } catch (error) {
    // 7. 全域錯誤處理 (Global Error Handling)
    // 捕捉所有未處理的異常，記錄詳細日誌，並回傳 500 錯誤
    logToSheet('ERROR', 'System Error', { msg: error.toString(), stack: error.stack });
    return errorResponse('Server Error: ' + error.toString());
  }
}
