/**
 * js/api.js
 * API 通訊層
 */

const api = {
    /**
     * 呼叫後端 API
     */
    call: async (action, data = {}) => {
        showLoading(true);
        try {
            if (!CONFIG.API_URL || CONFIG.API_URL.includes('...')) {
                throw new Error('API URL 未設定');
            }

            const user = JSON.parse(localStorage.getItem('travel_user') || 'null');
            const token = user ? user.auth_token : null;

            // 這裡假設後端接收的是 ID Token (Credential)
            // 在 Google Identity Services 流程中，登入時會拿到 credential
            // 但後續 API 呼叫，我們應該使用該 credential (如果未過期) 或者後端發的 session token?
            // 為了簡化，本範例中，後端 verifyGoogleToken 需要 ID Token。
            // 但 ID Token 有效期短 (1小時)。
            // **修正策略**：登入時後端回傳 user 物件。
            // 實務上應該要有一套 Session 機制。
            // 這裡暫時假設：每次操作「不」重新驗證 Google Token，或是 User 物件裡存有可用 Token。
            // (註：正規做法是前端 Silent Refresh 取得新 ID Token，或後端發自定義 Token)

            // 為了讓範例能跑，我們假設 request payload 裡攜帶的 token 是 user.credential (存在 localStorage)
            // 注意：這在 token 過期後會失效。

            const payload = { ...data, action };
            if (user && user.credential) {
                payload.token = user.credential;
            }

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            showLoading(false);

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'API Error');
            }
        } catch (err) {
            showLoading(false);
            console.error('API Call Error:', err);
            showToast(err.message, 'error');
            throw err;
        }
    }
};
