/**
 * js/utils.js
 * 通用工具函式庫
 */

const $ = (s) => document.querySelector(s);
const $all = (s) => document.querySelectorAll(s);

/**
 * XSS 防護處理
 */
const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * 顯示提示訊息 (Toast)
 * @param {string} msg 
 * @param {'success' | 'error'} type 
 */
function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white; padding: 1rem 2rem; border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
        opacity: 0; transform: translateY(20px); transition: all 0.3s;
    `;
    el.textContent = msg;
    document.body.appendChild(el);

    // Animation
    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function showLoading(show) {
    const loader = document.getElementById('global-loader');
    if (loader) {
        if (show) loader.classList.remove('hidden');
        else loader.classList.add('hidden');
    }
}
