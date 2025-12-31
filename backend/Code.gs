/**
 * Code.gs
 * API 進入點與路由分發
 */

/**
 * 處理 POST 請求
 * 前端所有請求皆透過 POST 發送至此
 */
function doPost(e) {
  try {
    // 1. 檢查是否有內容
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse('Missing postData', 'INVALID_REQUEST');
    }

    // 2. 解析 Payload
    const params = JSON.parse(e.postData.contents);
    const action = params.action; // 'login', 'admin/listUsers', etc.
    const token = params.token;   // Google ID Token
    const payload = params.payload || {};

    if (!action) {
      return errorResponse('Missing action parameter', 'INVALID_REQUEST');
    }

    // 3. 處理 'login' 動作 (不需要先有 User 物件)
    if (action === 'login') {
      try {
        const user = authenticateAndGetUser(token);
        return jsonResponse({
          success: true,
          user: user
        });
      } catch (err) {
        return errorResponse(err.message, 'AUTH_FAILED');
      }
    }

    // 4. 其他動作需先驗證並取得當前 User
    var currentUser;
    try {
      if (!token) throw new Error('Token required');
      currentUser = authenticateAndGetUser(token); // 這裡也會自動 update last_login
    } catch (err) {
      return errorResponse('Authentication failed: ' + err.message, 'UNAUTHORIZED');
    }

    // 5. 路由分發 (Router)
    var result = null;
    switch (action) {
      // --- Admin Routes ---
      case 'admin/getUsers':
        result = handleAdminListUsers(currentUser, payload);
        break;
      case 'admin/updateUser':
        result = handleAdminUpdateUser(currentUser, payload);
        break;
        
      // --- Trip Routes ---
      case 'trip/create': result = TripService.create(currentUser, payload); break;
      case 'trip/list':   result = TripService.listByUser(currentUser); break;
      case 'trip/get':    result = TripService.getDetails(currentUser, payload); break;
      case 'trip/delete': result = TripService.deleteTrip(currentUser, payload); break;
      
      default:
        return errorResponse('Unknown action: ' + action, 'NOT_FOUND');
    }

    return jsonResponse(result);

  } catch (error) {
    logToSheet('ERROR', 'System Error', { msg: error.toString(), stack: error.stack });
    return errorResponse('Server Error: ' + error.toString());
  }
}

/**
 * 測試 POST 函式 (用於開發階段模擬)
 */
function testDoPost() {
  const e = {
    postData: {
      contents: JSON.stringify({
        action: 'login',
        token: 'MOCK_TOKEN_FOR_TESTING' // 這在實際環境會失敗，除非 mock auth
      })
    }
  };
  // Logger.log(doPost(e).getContent());
}
