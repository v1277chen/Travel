/**
 * Auth.gs
 * 身分驗證服務
 */

/**
 * 驗證 Google ID Token
 * @param {string} token 
 * @returns {Object|null} Google User Profile or null if invalid
 */
function verifyGoogleToken(token) {
  try {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + token;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      logToSheet('WARN', 'Token verification failed', { response: response.getContentText() });
      return null;
    }
    
    const payload = JSON.parse(response.getContentText());
    
    // 檢查 aud (Client ID) 是否匹配 (雖然 GAS 隱藏了這部分，但最好還是檢查)
    // const EXPECTED_CLIENT_ID = 'YOUR_CLIENT_ID'; 
    // if (payload.aud !== EXPECTED_CLIENT_ID) return null;
    
    return payload;
  } catch (e) {
    logToSheet('ERROR', 'Error fetching token info', { error: e.toString() });
    return null;
  }
}

/**
 * 處理登入/驗證請求
 * 若使用者不存在則自動註冊
 */
function authenticateAndGetUser(token) {
  const googleProfile = verifyGoogleToken(token);
  if (!googleProfile) {
    throw new Error('Invalid Token');
  }

  // 強制轉小寫以避免大小寫導致的比對失敗
  const email = (googleProfile.email || '').toLowerCase();
  
  // 若 name 為 undefined，嘗試用 email 前綴當作名稱
  const name = googleProfile.name || email.split('@')[0];
  
  // 詳細記錄 Profile 以便偵錯
  logToSheet('INFO', 'User Login Attempt', { 
    email: email, 
    sub: googleProfile.sub, 
    nameFromGoogle: googleProfile.name,
    finalName: name
  });

  let user = UserModel.findByEmail(email);

  // 用戶不存在，進行註冊
  if (!user) {
    const isAdmin = (email === 'v1277.chen@gmail.com' || email === 'alenchen@stust.edu.tw');
    const newUser = {
      user_id: googleProfile.sub, // Google Subject ID
      email: email,
      name: name,
      avatar_url: googleProfile.picture || '',
      role: isAdmin ? 'admin' : 'user',
      status: 'active'
    };
    user = UserModel.create(newUser);
    logToSheet('INFO', 'New User Registered', { email: email, role: newUser.role });
  } else {
    // 每次登入更新 Last Login
    UserModel.updateLoginTime(email);
    
    // 檢查是否被封鎖
    if (user.status === 'banned') {
      throw new Error('User Banned');
    }
    
    // 若特定信箱尚未成為 admin (可能是舊資料)，補上權限
    if ((email === 'v1277.chen@gmail.com' || email === 'alenchen@stust.edu.tw') && user.role !== 'admin') {
      UserModel.updateRole(email, 'admin');
      user.role = 'admin'; 
      logToSheet('INFO', 'User Promoted to Admin', { email: email });
    }
    
    // [Fix] 自動補全缺失的 Name 與 Avatar
    let needUpdate = false;
    if (!user.name && name) {
        user.name = name;
        UserModel.updateName(email, name);
        needUpdate = true;
    }
    // 這裡可以順便補 avatar，暫時略過
    if(needUpdate) {
       logToSheet('INFO', 'User Data Synced', { email: email, name: user.name });
    }
  }
  
  // 最終保險：確保回傳給前端的物件一定有值 (避免 undefined)
  user.name = user.name || name || 'Unknown';
  user.role = user.role || 'user';
  user.status = user.status || 'active';

  logToSheet('INFO', 'User Authenticated', { 
    email: user.email, 
    role: user.role, 
    name: user.name,
    status: user.status
  });

  return user;
}
