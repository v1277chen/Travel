/**
 * js/utils.js
 * 前端工具函式庫 (Frontend Utilities)
 * 
 * 提供 DOM 操作、安全性處理 (XSS)、UI 提示等共用功能。
 */

// 簡化 document.querySelector (DOM 選取器)
const $ = (selector) => document.querySelector(selector);
const $all = (selector) => document.querySelectorAll(selector);

/**
 * 防止 XSS 攻擊的脫逸函式 (HTML Escape)
 * 將 HTML 特殊字元轉換為編碼，避免惡意腳本執行。
 * 在渲染使用者輸入內容到 innerHTML 時務必使用。
 * 
 * @param {string} unsafe - 未處理的字串
 * @returns {string} 安全的 HTML 字串
 */
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    // 確保轉換為字串，避免非字串類型導致 replace is not a function 錯誤
    const str = String(unsafe);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 顯示 Toast 通知訊息
 * 
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 ('success' | 'error')，預設為 success
 */
function showToast(message, type = 'success') {
    // 建立 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 設定樣式
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: type === 'error' ? '#ef4444' : '#10b981',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '9999',
        animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(toast);

    // 3秒後自動移除
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 290);
    }, 3000);
}

/**
 * 顯示/隱藏全域載入轉圈圈 (Global Loading Spinner)
 * 用於 API 請求期間阻擋操作。
 * 
 * @param {boolean} show - true 顯示，false 隱藏
 */
function showLoading(show) {
    const loader = document.getElementById('global-loader');
    if (loader) {
        if (show) loader.classList.remove('hidden');
        else loader.classList.add('hidden');
    }
}
