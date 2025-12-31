/**
 * Admin.gs
 * 管理者服務 - 處理用戶列表與權限管理
 */

function handleAdminListUsers(currentUser, payload) {
  // 1. 權限檢查
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  // 2. 取得列表 (未來可在此實作分頁)
  // Payload 可包含 page, limit
  const users = UserModel.listAll();
  
  // 3. 過濾敏感資料? 目前 admin 可看全部
  return users;
}

function handleAdminUpdateUser(currentUser, payload) {
  // Payload: { targetEmail: '...', action: 'promote|demote|ban|unban' }
  const targetEmail = payload.targetEmail;
  const action = payload.action;

  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  if (!targetEmail || !action) {
    throw new Error('Missing parameters');
  }

  // 防止修改自己 (避免把自己鎖住或降級)
  if (targetEmail === currentUser.email) {
    throw new Error('Cannot modify your own account status');
  }

  const targetUser = UserModel.findByEmail(targetEmail);
  if (!targetUser) {
    throw new Error('User not found');
  }

  let success = false;
  switch (action) {
    case 'promote': // 設為管理員
      success = UserModel.updateRole(targetEmail, 'admin');
      break;
    case 'demote': // 降為一般會員
      success = UserModel.updateRole(targetEmail, 'user');
      break;
    case 'ban': // 封鎖
      success = UserModel.updateStatus(targetEmail, 'banned');
      break;
    case 'unban': // 解除封鎖
      success = UserModel.updateStatus(targetEmail, 'active');
      break;
    default:
      throw new Error('Invalid action');
  }

  if (success) {
    logToSheet('INFO', `Admin [${currentUser.email}] performed [${action}] on [${targetEmail}]`);
    return { success: true, message: `User ${targetEmail} status updated to ${action}` };
  } else {
    throw new Error('Update failed');
  }
}
