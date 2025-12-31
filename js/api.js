/**
 * js/api.js
 * API 服務模組 (apiService)
 * 負責統一封裝 API 呼叫、Auth Token 附加與錯誤處理。
 */

const apiService = {
    /**
     * 呼叫後端 API
     * @param {string} action - 動作名稱
     * @param {Object} data - 資料內容 (將被包裝在 payload 中)
     */
    call: async (action, data = {}) => {
        showLoading(true);
        try {
            if (!CONFIG.API_URL || CONFIG.API_URL.includes('...')) {
                throw new Error('API URL 未設定');
            }

            const user = JSON.parse(localStorage.getItem('travel_user') || 'null');

            // 建構請求本體 (符合後端 Code.gs 要求)
            const requestBody = {
                action: action,
                token: null, // 預設 null
                payload: data // 將資料包裝在 payload 屬性中
            };

            // 自動附加 Token
            // 1. 若是登入動作，Token 通常在 data.credential 中，但為了統一，我們也可以將其視為 payload
            //    不過後端 'login' action 特殊處理，是直接解 token 或從 payload 解?
            //    Code.gs: const token = params.token;
            //    所以我們必須確保 token 放在 root level。

            if (action === 'login') {
                // 登入時，data 裡應該有 credential
                if (data.credential) {
                    requestBody.token = data.credential;
                }
            } else {
                // 一般請求，使用儲存的 credential
                if (user && user.credential) {
                    requestBody.token = user.credential;
                }
            }

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            showLoading(false);

            if (result.status === 'success') {
                return result.data;
            } else {
                // 若 Token 失效，自動登出
                if (result.message === 'Unauthorized' || result.message === 'Invalid Token') {
                    if (action !== 'login') {
                        Auth.logout();
                    }
                }
                throw new Error(result.message || 'API Error');
            }
        } catch (err) {
            showLoading(false);
            console.error('apiService Error:', err);
            showToast(err.message, 'error');
            throw err;
        }
    }
};

// 為了相容性或方便偵錯，掛載到 window
window.apiService = apiService;
