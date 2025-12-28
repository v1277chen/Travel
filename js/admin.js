/**
 * js/admin.js
 * 管理員功能模組
 */

const Admin = {
    init: async () => {
        // 渲染管理員面板結構
        const container = $('#admin-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex-between mb-4">
                <h2>使用者管理</h2>
                <button class="btn btn-secondary" onclick="Admin.loadUsers()">重新整理</button>
            </div>
            <div class="card" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="text-align: left; padding: 1rem;">使用者</th>
                            <th style="text-align: left; padding: 1rem;">Email</th>
                            <th style="text-align: left; padding: 1rem;">角色</th>
                            <th style="text-align: left; padding: 1rem;">狀態</th>
                            <th style="text-align: right; padding: 1rem;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="user-list-body">
                        <tr><td colspan="5" style="padding:2rem; text-align:center;">載入中...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        await Admin.loadUsers();
    },

    loadUsers: async () => {
        try {
            const users = await api.call('admin/getUsers');
            Admin.renderUsers(users);
        } catch (e) {
            $('#user-list-body').innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">載入失敗: ${e.message}</td></tr>`;
        }
    },

    renderUsers: (users) => {
        const tbody = $('#user-list-body');
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">無使用者資料</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const isMe = (u.email === App.user.email);
            return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <img src="${u.avatar_url}" style="width:32px; height:32px; border-radius:50%;">
                        ${escapeHtml(u.name)}
                    </div>
                </td>
                <td style="padding: 1rem;">${escapeHtml(u.email)}</td>
                <td style="padding: 1rem;">
                    <span style="padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.8rem; background: ${u.role === 'admin' ? '#e0e7ff' : '#f3f4f6'}; color: ${u.role === 'admin' ? '#4338ca' : '#374151'};">
                        ${u.role}
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <span style="color: ${u.status === 'active' ? 'green' : 'red'}">${u.status}</span>
                </td>
                <td style="padding: 1rem; text-align: right;">
                    ${isMe ? '<span style="color:#9ca3af; font-size:0.9rem;">(本人)</span>' : `
                        ${u.status === 'active'
                        ? `<button class="btn btn-danger btn-sm" onclick="Admin.updateUser('${u.email}', 'ban')">封鎖</button>`
                        : `<button class="btn btn-success btn-sm" onclick="Admin.updateUser('${u.email}', 'unban')">解鎖</button>`
                    }
                        ${u.role === 'user'
                        ? `<button class="btn btn-secondary btn-sm" onclick="Admin.updateUser('${u.email}', 'promote')">設為管理員</button>`
                        : `<button class="btn btn-secondary btn-sm" onclick="Admin.updateUser('${u.email}', 'demote')">降為一般用戶</button>`
                    }
                    `}
                </td>
            </tr>
            `;
        }).join('');
    },

    updateUser: async (email, action) => {
        if (!confirm(`確定要對 ${email} 執行 ${action} 嗎？`)) return;

        try {
            await api.call('admin/updateUser', { targetEmail: email, action: action });
            showToast('更新成功');
            Admin.loadUsers();
        } catch (e) {
            showToast('更新失敗', 'error');
        }
    }
};

// 掛載到 window 以便 onclick 呼叫
window.Admin = Admin;
