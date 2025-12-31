/**
 * js/admin.js
 * 管理員面板模組 (Admin Module)
 * 
 * 負責管理員功能的 UI 呈現與邏輯，包含：
 * 1. 使用者列表的讀取與渲染。
 * 2. 權限變更 (升/降級)。
 * 3. 狀態變更 (封鎖/解鎖)。
 */

const Admin = {
    /**
     * 初始化管理員面板
     * 綁定事件監聽器等。
     */
    init: () => {
        // 目前無特殊初始化邏輯，預留擴充空間
        console.log('Admin Module Initialized');
    },

    /**
     * 載入使用者列表 (Load Users)
     * 從後端 API 取得所有使用者資料並渲染至表格。
     */
    loadUsers: async () => {
        try {
            const tableBody = $('#user-table-body');
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">載入中...</td></tr>';

            // 呼叫後端 'admin/getUsers'
            const users = await apiService.call('admin/getUsers');

            // 渲染表格
            Admin.renderUserTable(users);
        } catch (e) {
            console.error(e);
            showToast('載入使用者失敗: ' + e.message, 'error');
        }
    },

    /**
     * 渲染使用者表格 (Render User Table)
     * 
     * @param {Array<Object>} users - 使用者物件陣列
     */
    renderUserTable: (users) => {
        const tableBody = $('#user-table-body');
        tableBody.innerHTML = ''; // 清空目前內容

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';

            // 根據使用者資料產生 HTML
            // 使用 escapeHtml 防止 XSS
            tr.innerHTML = `
                <td class="p-3">
                    <div class="flex items-center gap-2">
                        <img src="${escapeHtml(user.avatar_url)}" class="w-8 h-8 rounded-full" onerror="this.src='https://via.placeholder.com/32'">
                        <span>${escapeHtml(user.name)}</span>
                    </div>
                </td>
                <td class="p-3 text-gray-600">${escapeHtml(user.email)}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                        ${escapeHtml(user.role)}
                    </span>
                </td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${escapeHtml(user.status)}
                    </span>
                </td>
                <td class="p-3">
                    <div class="flex gap-2">
                        ${Admin.getActionButtons(user)}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    },

    /**
     * 產生操作按鈕 (Generate Action Buttons)
     * 根據使用者目前的狀態與角色，產生對應的可執行按鈕。
     * 防止對自己進行操作。
     * 
     * @param {Object} user - 目標使用者
     * @returns {string} HTML 按鈕字串
     */
    getActionButtons: (user) => {
        // 禁止修改自己
        if (user.email === App.user.email) return '<span class="text-gray-400 text-xs">自己</span>';

        let buttons = '';

        // 角色變更按鈕 (Promote/Demote)
        if (user.role === 'user') {
            buttons += `<button onclick="Admin.updateUser('${user.email}', 'promote')" class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">設為 Admin</button>`;
        } else {
            buttons += `<button onclick="Admin.updateUser('${user.email}', 'demote')" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">降為 User</button>`;
        }

        // 狀態變更按鈕 (Ban/Unban)
        if (user.status === 'active') {
            buttons += `<button onclick="Admin.updateUser('${user.email}', 'ban')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">封鎖</button>`;
        } else {
            buttons += `<button onclick="Admin.updateUser('${user.email}', 'unban')" class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200">解除</button>`;
        }

        return buttons;
    },

    /**
     * 更新使用者 (Update User)
     * 發送 API 請求變更權限或狀態。
     * 
     * @param {string} email - 目標 Email
     * @param {string} action - 動作 (promote, demote, ban, unban)
     */
    updateUser: async (email, action) => {
        if (!confirm(`確定要對 ${email} 執行 ${action} 嗎？`)) return;

        try {
            await apiService.call('admin/updateUser', {
                targetEmail: email,
                action: action
            });

            showToast('更新成功');
            Admin.loadUsers(); // 重新整理列表
        } catch (e) {
            console.error(e);
            showToast('更新失敗: ' + e.message, 'error');
        }
    }
};

// 掛載到 window 供 onclick 呼叫
window.Admin = Admin;
