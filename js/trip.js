/**
 * js/trip.js
 * 行程管理前端模組
 */

const Trip = {
    /**
     * 初始化儀表板 (Dashboard)
     */
    initDashboard: async () => {
        const listContainer = $('#trip-list');
        listContainer.innerHTML = '<div class="spinner"></div>';

        try {
            const trips = await apiService.call('trip/list');
            Trip.renderList(trips);
        } catch (e) {
            console.error(e);
            listContainer.innerHTML = `<p class="text-center text-danger">載入失敗: ${e.message}</p>`;
        }
    },

    /**
     * 渲染行程列表
     */
    renderList: (trips) => {
        const listContainer = $('#trip-list');

        if (!trips || trips.length === 0) {
            listContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <h3 style="margin-bottom: 1rem;">還沒有任何行程</h3>
                    <p style="margin-bottom: 2rem; color: var(--text-muted);">開始規劃您的下一趟旅程吧！</p>
                    <button class="btn btn-primary" onclick="openCreateTripModal()">+ 建立新行程</button>
                </div>`;
            return;
        }

        listContainer.innerHTML = trips.map(t => `
            <div class="card" style="cursor: pointer;" onclick="Trip.openDetail('${t.trip_id}')">
                <div style="height: 120px; background: linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%); border-radius: var(--radius-md); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 3rem;">✈️</span>
                </div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${escapeHtml(t.title)}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${escapeHtml(t.description || '無描述')}
                </p>
                <div class="flex-between" style="font-size: 0.85rem; color: var(--text-muted);">
                    <span>${formatDate(t.start_date)}</span>
                    <span style="background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 99px;">${t.status}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * 處理建立新行程
     */
    handleCreate: async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '建立中...';

        try {
            const getVal = (id) => {
                const el = $(id);
                return el ? el.value : '';
            };

            const data = {
                title: getVal('#new-trip-title'),
                description: getVal('#new-trip-desc'),
                start_date: getVal('#new-trip-date'),
                end_date: getVal('#new-trip-end-date')
            };

            await apiService.call('trip/create', data);
            showToast('行程建立成功！');
            document.getElementById('create-trip-modal').classList.remove('active');
            e.target.reset(); // 清空表單
            Trip.initDashboard(); // 重新整理列表
        } catch (err) {
            showToast('建立失敗: ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },

    /**
     * 開啟行程詳情 (跳轉)
     */
    openDetail: (tripId) => {
        // 先簡單實作跳轉到詳情頁，後續再實作詳情內容載入
        App.currentTripId = tripId;
        App.router.navigate('trip-detail');
        Trip.loadDetail(tripId);
    },

    /**
     * 載入單一行程詳情
     */
    loadDetail: async (tripId) => {
        $('#detail-loading').classList.remove('hidden');
        $('#detail-content').classList.add('hidden');

        try {
            const trip = await apiService.call('trip/get', { trip_id: tripId });
            App.currentTrip = trip;

            // Render Header
            $('#d-title').textContent = trip.title;
            $('#d-meta').textContent = `${formatDate(trip.start_date)} ${trip.end_date ? ' ~ ' + formatDate(trip.end_date) : ''}`;

            // Render Items (TODO in next step)
            $('#itinerary-list').innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-muted);">行程細節功能開發中...</p>';

            $('#detail-loading').classList.add('hidden');
            $('#detail-content').classList.remove('hidden');
        } catch (e) {
            showToast('載入詳情失敗', 'error');
            App.router.navigate('dashboard');
        }
    }
};

// Helper
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-TW');
}

window.Trip = Trip;
window.handleCreateTrip = Trip.handleCreate;
