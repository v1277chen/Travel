/**
 * js/auth.js
 * 前端身分驗證模組 (Authentication Module)
 * 
 * 負責處理 Google Sign-In 的回調、登入狀態管理、登出等邏輯。
 */

const Auth = {
    /**
     * Google 登入回調函式 (Google Sign-In Callback)
     * 當使用者在 Google 登入按鈕完成認證後，Google 會呼叫此函式。
     * 
     * @param {Object} response - Google 回傳的認證回應，包含 credential (ID Token)
     */
    handleGoogleLogin: async (response) => {
        try {
            const credential = response.credential;

            // 呼叫後端 'login' API 進行驗證與取得使用者資料
            // responseData 格式: { user: {...} }
            const responseData = await apiService.call('login', { credential: credential });

            // 從包裝中取出 user 物件
            const user = responseData.user;

            if (!user) {
                throw new Error('無法取得使用者資料');
            }

            // 重要：將 credential (ID Token) 補回 user 物件中
            // 因為後續所有 API 呼叫都需要這個 Token 來證明身分
            user.credential = credential;

            // 將使用者資料存入 localStorage (持久化登入狀態)
            localStorage.setItem('travel_user', JSON.stringify(user));

            // 更新全域 App 狀態
            App.user = user;

            showToast(`歡迎回來，${user.name}`);

            // 跳轉至儀表板頁面
            App.router.navigate('dashboard');

        } catch (e) {
            console.error(e);
            showToast('登入失敗: ' + e.message, 'error');
        }
    },

    /**
     * 登出 (Logout)
     * 清除本地資料並導回登入頁。
     */
    logout: () => {
        // 清除 localStorage
        localStorage.removeItem('travel_user');
        App.user = null;

        // 通知 Google Identity Services 取消自動選取 (避免下次自動登入)
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }

        // 導回登入頁
        App.router.navigate('login');
        showToast('已登出');
    },

    /**
     * 檢查登入狀態 (Check Login Status)
     * 應用程式啟動時呼叫，確認是否有儲存的 Session。
     * 
     * @returns {boolean} 是否已登入
     */
    checkLogin: () => {
        const stored = localStorage.getItem('travel_user');
        if (stored) {
            // 若有資料，還原到 App.user
            App.user = JSON.parse(stored);
            return true;
        }
        return false;
    }
};

// 將 handleGoogleLogin 掛載到 window，因為 Google Sign-In data-callback 需要全域函式
window.handleGoogleLogin = Auth.handleGoogleLogin;
