/**
 * Auth.gs
 * 身分驗證服務 (Authentication Service)
 * 
 * 負責處理與 Google Sign-In 相關的驗證邏輯，包含：
 * 1. 驗證前端傳來的 ID Token 真偽。
 * 2. 判斷使用者是否為本系統的註冊用戶。
 * 3. 自動註冊 (Auto-Register) 與資料自動修復 (Self-Healing)。
 * 4. 管理員權限判斷。
 */

/**
 * 驗證 Google ID Token
 * 
 * 呼叫 Google OAuth2 API 來驗證前端傳來的 Token 是否有效。
 * 這是安全性的核心，確保我們只信任 Google 簽發的 Token，而非前端隨意捏造的資料。
 * 
 * @param {string} token - 前端傳來的 Google ID Token (JWT)
 * @returns {Object|null} 若驗證成功回傳 User Profile (payload)，失敗回傳 null
 */
function verifyGoogleToken(token) {
  try {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + token;
    // 使用 UrlFetchApp 發送 HTTP 請求至 Google 驗證伺服器
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    // 檢查 HTTP 狀態碼
    if (response.getResponseCode() !== 200) {
      logToSheet('WARN', 'Token verification failed', { response: response.getContentText() });
      return null;
    }
    
    // 解析回傳的 JSON (包含 sub, email, name, picture 等資訊)
    const payload = JSON.parse(response.getContentText());
    return payload;
  } catch (e) {
    logToSheet('ERROR', 'Error fetching token info', { error: e.toString() });
    return null;
  }
}

/**
 * 驗證並取得/註冊使用者 (Authenticate & Get User)
 * 
 * 這是登入流程的主要邏輯函式。
 * 
 * @param {string} token - Google ID Token
 * @returns {Object} 系統內部的 User 物件 (包含 role, status 等)
 * @throws {Error} 若 Token 無效或使用者被封鎖則拋出錯誤
 */
function authenticateAndGetUser(token) {
  // 1. 先驗證 Token 真偽
  const googleProfile = verifyGoogleToken(token);
  if (!googleProfile) {
    throw new Error('Invalid Token');
  }

  // 2. 取得 Email 並統一轉小寫 (Email Normalization)
  // 避免 v1277... 與 V1277... 被視為不同使用者的問題
  const email = (googleProfile.email || '').toLowerCase();
  
  // 3. 取得名稱 (Fallback 機制)
  // 若 Google Profile 中沒有 name (偶發狀況)，則使用 Email 前綴當作名稱
  const name = googleProfile.name || email.split('@')[0];
  
  // 4. 在資料庫中搜尋此使用者
  let user = UserModel.findByEmail(email);

  if (!user) {
    // === 情境 A：新使用者註冊 (New User Registration) ===
    
    // 判斷是否為預設管理員 (Hardcoded Admins)
    const isAdmin = (email === 'v1277.chen@gmail.com' || email === 'alenchen@stust.edu.tw');
    
    // 建立新使用者物件
    const newUser = {
      user_id: googleProfile.sub, // Google 唯一識別碼 (Subject ID)
      email: email,
      name: name,
      avatar_url: googleProfile.picture || '',
      role: isAdmin ? 'admin' : 'user', // 若符合 Admin 清單則直接賦予權限
      status: 'active'
    };
    
    // 寫入資料庫
    user = UserModel.create(newUser);
    logToSheet('INFO', 'New User Registered', { email: email, role: newUser.role });

  } else {
    // === 情境 B：既有使用者登入 (Existing User Login) ===
    
    // 更新該使用者的最後登入時間
    UserModel.updateLoginTime(email);
    
    // 安全性檢查：若被封鎖則拒絕登入
    if (user.status === 'banned') {
      throw new Error('User Banned');
    }
    
    // 自動晉升檢查 (Auto Promotion)
    // 若特定帳號之前是 user，再次登入時自動修正為 admin
    if ((email === 'v1277.chen@gmail.com' || email === 'alenchen@stust.edu.tw') && user.role !== 'admin') {
      UserModel.updateRole(email, 'admin');
      user.role = 'admin'; 
      logToSheet('INFO', 'User Promoted to Admin', { email: email });
    }
    
    // 資料自動修復 (Self-Healing)
    // 若資料庫中的 name 為空 (可能因舊 bug 導致)，則自動補上
    let needUpdate = false;
    if (!user.name && name) {
        user.name = name;
        UserModel.updateName(email, name); // 同步寫回資料庫
        needUpdate = true;
    }
    if(needUpdate) {
       logToSheet('INFO', 'User Data Synced', { email: email, name: user.name });
    }
  }
  
  // 5. 最終資料完整性檢查
  // 確保回傳給前端的物件不會有 undefined 的欄位，避免前端報錯
  user.name = user.name || name || 'Unknown';
  user.role = user.role || 'user';
  user.status = user.status || 'active';

  // 記錄登入成功日誌
  logToSheet('INFO', 'User Authenticated', { 
    email: user.email, 
    role: user.role, 
    name: user.name,
    status: user.status
  });

  return user;
}
