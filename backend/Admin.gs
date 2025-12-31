/**
 * Admin.gs
 * 管理員功能服務 (Admin Services)
 * 
 * 包含僅限管理員 (role='admin') 執行的操作邏輯。
 */

/**
 * 處理管理員列出所有使用者的請求
 * 
 * @param {Object} currentUser - 當前登入的使用者
 * @param {Object} payload - 請求參數 (此 API 無需額外參數)
 * @returns {Array<Object>} 所有使用者的列表
 * @throws {Error} 若非管理員則拋出權限錯誤
 */
function handleAdminListUsers(currentUser, payload) {
  // 權限檢查 (Permission Check)
  if (currentUser.role !== 'admin') {
    throw new Error('Admin permission required');
  }
  // 呼叫 Model 取得全站使用者
  return UserModel.listAll();
}

/**
 * 處理管理員更新使用者狀態/角色的請求
 * 
 * 支援動作：
 * - promote: 升為管理員
 * - demote: 降為一般用戶
 * - ban: 封鎖帳號
 * - unban: 解除封鎖
 * 
 * @param {Object} currentUser - 當前登入的使用者 (必須是 Admin)
 * @param {Object} payload - 請求參數 { targetEmail, action }
 * @returns {Object} { success: true }
 */
function handleAdminUpdateUser(currentUser, payload) {
  // 1. 權限檢查
  if (currentUser.role !== 'admin') {
    throw new Error('Admin permission required');
  }
  
  const targetEmail = payload.targetEmail; // 目標使用者的 Email
  const action = payload.action;           // 要執行的動作
  
  // 2. 參數驗證
  if (!targetEmail || !action) throw new Error('Invalid arguments');
  
  // 3. 安全性檢查：防止自我操作 (例如自己降級自己，或自己封鎖自己)
  if (targetEmail === currentUser.email) throw new Error('Cannot modify yourself');
  
  // 4. 確認目標使用者存在
  const targetUser = UserModel.findByEmail(targetEmail);
  if (!targetUser) throw new Error('User not found');
  
  // 5. 執行對應動作
  switch (action) {
    case 'promote':
      UserModel.updateRole(targetEmail, 'admin');
      break;
    case 'demote':
      UserModel.updateRole(targetEmail, 'user');
      break;
    case 'ban':
      UserModel.updateStatus(targetEmail, 'banned');
      break;
    case 'unban':
      UserModel.updateStatus(targetEmail, 'active');
      break;
    default:
      throw new Error('Unknown action');
  }
  
  // 6. 記錄操作日誌 (Audit Log)
  logToSheet('INFO', 'Admin Action', { 
    admin: currentUser.email, 
    action: action, 
    target: targetEmail 
  });
  
  return { success: true };
}
