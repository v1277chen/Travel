/**
 * js/app.js
 * 應用程式主入口
 */

const App = {
    user: null,
    currentTrip: null,

    init: () => {
        // 檢查登入狀態
        if (Auth.checkLogin()) {
            App.router.navigate('dashboard');
        } else {
            App.router.navigate('login');
        }
    },

    router: {
        navigate: (viewId) => {
            // 隱藏所有視圖
            $all('.view-section').forEach(el => el.classList.add('hidden'));

            // 權限檢查
            if (viewId !== 'login' && !App.user) {
                App.router.navigate('login');
                return;
            }

            // 顯示目標視圖
            const target = $(`#view-${viewId}`);
            if (target) {
                target.classList.remove('hidden');

                // 觸發頁面載入邏輯
                if (viewId === 'dashboard') Dashboard.init();
                if (viewId === 'admin') Admin.init();
            }

            App.updateNav();
        }
    },

    updateNav: () => {
        if (App.user) {
            $('#nav-user-name').textContent = App.user.name || App.user.email;
            if (App.user.role === 'admin') {
                $('#nav-user-name').textContent += ' (管理者)';
                // 顯示 Admin Link
                $('#nav-admin-link').classList.remove('hidden');
            } else {
                $('#nav-admin-link').classList.add('hidden');
            }
            $('#nav-links').classList.remove('hidden');
        } else {
            $('#nav-links').classList.add('hidden');
        }
    }
};

// --- Dashboard Logic (Moved from inline) ---
const Dashboard = {
    init: async () => {
        $('#trip-list').innerHTML = '<div class="spinner"></div>';
        try {
            // const trips = await api.call('getTrips'); // 尚未實作
            // 先放假資料測試
            const trips = [];
            Dashboard.render(trips);
        } catch (e) {
            $('#trip-list').innerHTML = '<p class="text-center">載入失敗</p>';
        }
    },

    render: (trips) => {
        const container = $('#trip-list');
        if (trips.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p>目前沒有任何行程。</p>
                    <button class="btn btn-primary" onclick="openCreateTripModal()">建立新行程</button>
                </div>`;
            return;
        }
        // ... rendering logic
    }
};

// 讓 HTML onclick 可以存取
window.App = App;
window.logout = Auth.logout;
window.navigateTo = App.router.navigate;

// 啟動
document.addEventListener('DOMContentLoaded', App.init);
