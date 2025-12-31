/**
 * js/api.js
 * API 服務模組 (apiService)
 * 
 * 負責與後端 GAS Web App 進行通訊。
 * 統一封裝了 POST 請求、Token 附加、錯誤處理與 Loading 狀態顯示。
 */

const apiService = {
    /**
     * 呼叫後端 API (Call Backend API)
     * 
     * @param {string} action - 請求動作名稱 (例如 'trip/list')
     * @param {Object} data - 要傳送的資料內容 (Payload)
     * @returns {Promise<Object>} 後端回傳的資料
     */
    call: async (action, data = {}) => {
        // 顯示載入動畫
        showLoading(true);
        try {
            // 檢查 API URL 設定
            if (!CONFIG.API_URL || CONFIG.API_URL.includes('...')) {
                throw new Error('API URL 未設定');
            }

            const user = JSON.parse(localStorage.getItem('travel_user') || 'null');

            // 建構標準請求本體 (Request Body)
            // 符合後端 doPost 的解析格式: { action, token, payload }
            const requestBody = {
                action: action,
                token: null, // 預設 null
                payload: data // 將業務資料包裝在 payload 屬性中
            };

            // 自動附加 Token 邏輯
            if (action === 'login') {
                // 若是登入動作，data 中包含 credential (ID Token)
                // 將其作為本次請求的 token
                if (data.credential) {
                    requestBody.token = data.credential;
                }
            } else {
                // 對於其他動作，使用本地儲存的使用者 Credential
                if (user && user.credential) {
                    requestBody.token = user.credential;
                }
            }

            // 發送 Fetch 請求
            // 必須使用 POST，並將內容轉為字串
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                // GAS Web App 處理 text/plain 較為順暢 (避免 CORS preflight 過多問題)
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            showLoading(false); // 請求結束，隱藏 Loading

            // 檢查後端回傳的狀態 ('success' 或 'error')
            if (result.status === 'success') {
                return result.data;
            } else {
                // === 錯誤處理 ===

                // 若後端回傳 Token 失效 (401)，自動登出導向登入頁
                if (result.message === 'Unauthorized' || result.message === 'Invalid Token') {
                    if (action !== 'login') {
                        Auth.logout();
                    }
                }
                // 拋出後端回傳的錯誤訊息
                throw new Error(result.message || 'API Error');
            }
        } catch (err) {
            showLoading(false);
            console.error('apiService Error:', err);
            showToast(err.message, 'error'); // 以 Toast 顯示錯誤給使用者
            throw err;
        }
    }
};

// 掛載到 window 物件，供其他模組呼叫
window.apiService = apiService;
