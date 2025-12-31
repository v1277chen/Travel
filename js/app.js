/**
 * js/app.js
 * 應用程式主入口 (Application Main Entry)
 * 
 * 負責：
 * 1. 路由管理 (Routing): 切換頁面視圖。
 * 2. 應用程式初始化 (Initialization)。
 * 3. 使用者介面更新 (UI Updates): 如導航列狀態。
 */

const App = {
    // 當前登入的使用者資料
    user: null,

    // 路由對應表 (Route Map)
    // Key: 路由名稱, Value: 頁面元素 ID
    routes: {
        'login': 'login-view',
        'dashboard': 'dashboard-view',
        'trip-detail': 'trip-detail-view',
        'admin': 'admin-view'
    },

    /**
     * 路由控制器 (Router)
     */
    router: {
        /**
         * 頁面導航 (Navigate)
         * 切換顯示的頁面區塊，並執行該頁面的初始化邏輯。
         * 
         * @param {string} page - 目標頁面名稱 (key of routes)
         * @param {any} params - 傳遞給頁面的參數 (例如 tripId)
         */
        navigate: (page, params) => {
            // 1. 隱藏所有視圖
            Object.values(App.routes).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            // 2. 顯示目標視圖
            const targetId = App.routes[page];
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.classList.remove('hidden');
            } else {
                console.warn(`Route ${page} not found`);
                // 預設導向 dashboard 或 login
                return App.router.navigate(App.user ? 'dashboard' : 'login');
            }

            // 3. 更新導航列狀態
            App.updateNavbar();

            // 4. 路由守衛 (Route Guard)
            // 檢查權限，若未登入且嘗試存取保護頁面，強制轉到登入頁
            if (page !== 'login' && !App.user) {
                return App.router.navigate('login');
            }

            // 檢查 Admin 權限
            if (page === 'admin' && App.user.role !== 'admin') {
                showToast('權限不足', 'error');
                return App.router.navigate('dashboard');
            }

            // 5. 執行各頁面的初始化 (Lifecycle Hooks)
            switch (page) {
                case 'dashboard':
                    Trip.initDashboard(); // 初始化儀表板
                    break;
                case 'admin':
                    Admin.loadUsers(); // 載入使用者列表
                    break;
                case 'trip-detail':
                    if (params) {
                        TripDetail.init(params); // 改用 TripDetail 模組初始化
                    }
                    break;
            }
        }
    },

    /**
     * 初始化應用程式 (Initialize App)
     * 在 DOMContentLoaded 時執行。
     */
    init: () => {
        // 檢查是否有儲存的登入狀態
        if (Auth.checkLogin()) {
            // 若已登入，導向儀表板
            App.router.navigate('dashboard');
        } else {
            // 否則導向登入頁
            App.router.navigate('login');
        }

        // 綁定導航列登出按鈕
        const logoutBtn = $('#btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }
    },

    /**
     * 更新導航列 UI (Update Navbar)
     * 根據登入狀態控制導航列顯示。
     */
    updateNavbar: () => {
        const nav = $('#main-nav');
        const adminLink = $('#nav-admin-link');
        const userAvatar = $('#nav-user-avatar');
        const userName = $('#nav-user-name');

        if (App.user) {
            // 顯示導航列
            nav.classList.remove('hidden');

            // 設定使用者資訊
            if (userName) userName.textContent = App.user.name;
            if (userAvatar) userAvatar.src = App.user.avatar_url || 'https://via.placeholder.com/32';

            // 判斷是否顯示「系統管理」連結
            if (App.user.role === 'admin') {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        } else {
            // 隱藏導航列 (登入頁模式)
            nav.classList.add('hidden');
        }
    }
};

// 當 DOM 載入完成後啟動 App
document.addEventListener('DOMContentLoaded', App.init);
