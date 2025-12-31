/**
 * js/auth.js
 * 身分驗證邏輯
 */

const Auth = {
    /**
     * Google 登入回調
     */
    handleGoogleLogin: async (response) => {
        try {
            const credential = response.credential;
            // 呼叫後端登入
            // 注意：這裡傳入 credential，apiService 會將其放入 root token
            const user = await apiService.call('login', { credential: credential });

            // 補上 credential 以便後續 API 呼叫使用
            user.credential = credential;

            localStorage.setItem('travel_user', JSON.stringify(user));
            App.user = user;

            showToast(`歡迎回來，${user.name}`);
            App.router.navigate('dashboard');

        } catch (e) {
            console.error(e);
            showToast('登入失敗: ' + e.message, 'error');
        }
    },

    logout: () => {
        localStorage.removeItem('travel_user');
        App.user = null;
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }
        App.router.navigate('login');
        showToast('已登出');
    },

    checkLogin: () => {
        const stored = localStorage.getItem('travel_user');
        if (stored) {
            App.user = JSON.parse(stored);
            return true;
        }
        return false;
    }
};

window.handleGoogleLogin = Auth.handleGoogleLogin;
