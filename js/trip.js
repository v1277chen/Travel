/**
 * js/trip.js
 * 行程功能模組 (Trip Module)
 * 
 * 負責行程相關的 UI 互動與邏輯，包含：
 * 1. 儀表板行程列表 (Dashboard List)。
 * 2. 建立新行程 (Create Trip)。
 * 3. 行程詳情頁面渲染 (Details View)。
 * 4. 日期格式化等輔助功能。
 */

const Trip = {
    /**
     * 資料快取 (Cache)
     * 用於暫存目前的行程列表與當前檢視的行程，減少重複請求。
     */
    state: {
        trips: [],      // 行程列表
        currentTrip: null // 目前檢視的行程
    },

    /**
     * 初始化儀表板 (Initialize Dashboard)
     * 載入並顯示使用者的行程列表。
     */
    initDashboard: async () => {
        // 綁定「建立行程」表單提交事件
        const createForm = $('#create-trip-form');
        // 確保不重複綁定
        if (createForm && !createForm.dataset.bound) {
            createForm.addEventListener('submit', Trip.handleCreate);
            createForm.dataset.bound = 'true';
        }

        // 載入行程列表
        await Trip.loadList();
    },

    /**
     * 載入行程列表 (Load Trip List)
     * 從後端 API 取得資料並渲染。
     */
    loadList: async () => {
        const container = $('#trip-list-container');
        container.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">載入中...</div>';

        try {
            // 呼叫 API: trip/list
            const trips = await apiService.call('trip/list');
            Trip.state.trips = trips; // 更新快取
            Trip.renderList(trips);   // 渲染畫面
        } catch (e) {
            console.error(e);
            container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">載入失敗: ${e.message}</div>`;
        }
    },

    /**
     * 渲染行程卡片列表 (Render List)
     * 
     * @param {Array<Object>} trips - 行程陣列
     */
    renderList: (trips) => {
        const container = $('#trip-list-container');
        container.innerHTML = '';

        if (trips.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                    <p class="text-gray-500 mb-4">目前還沒有任何行程</p>
                    <button onclick="document.getElementById('create-trip-modal').classList.remove('hidden')" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                        立即建立第一個行程
                    </button>
                </div>
            `;
            return;
        }

        // 產生每個行程的卡片 HTML
        trips.forEach(trip => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border border-gray-100';
            card.onclick = () => Trip.openDetail(trip.trip_id); // 點擊進入詳情

            // 計算天數 duration
            const duration = (new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24) + 1;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold text-gray-800">${escapeHtml(trip.title)}</h3>
                    <span class="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        ${trip.status}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${escapeHtml(trip.description || '沒有描述')}</p>
                
                <div class="flex items-center text-sm text-gray-500 gap-4">
                    <div class="flex items-center">
                        <i class="fas fa-calendar-alt mr-1"></i>
                        <span>${Trip.formatDate(trip.start_date)}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        <span>${Math.max(1, Math.round(duration))} 天</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * 處理建立行程 (Handle Create Trip)
     * 表單提交後的處理邏輯。
     * 
     * @param {Event} e - 事件物件
     */
    handleCreate: async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '建立中...';

        try {
            // 取得表單資料
            const title = $('#new-trip-title').value; // 直接使用 selector 確保 id 正確
            const startDate = $('#new-trip-start-date').value;
            const endDate = $('#new-trip-end-date')?.value || startDate; // 若無結束日期預設同開始日期
            const desc = $('#new-trip-desc').value;

            const payload = {
                title: title,
                start_date: startDate,
                end_date: endDate,
                description: desc
            };

            // 呼叫 API: trip/create
            await apiService.call('trip/create', payload);

            showToast('建立成功');

            // 關閉 Modal 並重置表單
            $('#create-trip-modal').classList.add('hidden');
            e.target.reset();

            // 重新載入列表
            Trip.loadList();

        } catch (err) {
            console.error(err);
            showToast('建立失敗: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },

    /**
     * 開啟行程詳情 (Open Detail)
     * 切換路由至詳細頁面。
     * 
     * @param {string} tripId 
     */
    openDetail: (tripId) => {
        App.router.navigate('trip-detail', tripId);
    },

    /**
     * 載入並渲染詳細資料 (Load Detail)
     * 
     * @param {string} tripId 
     */
    loadDetail: async (tripId) => {
        const container = $('#trip-detail-content');
        container.innerHTML = '<div class="text-center py-10">載入中...</div>';

        try {
            // 呼叫 API: trip/get
            const trip = await apiService.call('trip/get', { trip_id: tripId });
            Trip.state.currentTrip = trip;

            // 渲染 Header
            $('#trip-detail-title').textContent = trip.title;
            $('#trip-detail-dates').textContent = `${Trip.formatDate(trip.start_date)} - ${Trip.formatDate(trip.end_date)}`;

            // 渲染內容區塊 (暫時僅顯示基本資訊)
            container.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 class="text-lg font-bold mb-2">行程簡介</h3>
                    <p class="text-gray-700">${escapeHtml(trip.description || '無')}</p>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-bold mb-4">每日行程</h3>
                    <p class="text-gray-500 italic">行程細節功能開發中...</p>
                    <!-- TODO: 這裡未來會整合 TripDays 和 TripItems -->
                </div>
            `;

        } catch (e) {
            console.error(e);
            container.innerHTML = `<div class="text-center py-10 text-red-500">載入失敗: ${e.message}</div>`;
        }
    },

    /**
     * 日期格式化 helper
     * 將 YYYY-MM-DD 轉為較易讀的格式
     */
    formatDate: (dateStr) => {
        if (!dateStr) return '';
        // 簡單處理，只取前 10 碼 (YYYY-MM-DD)
        return dateStr.substring(0, 10);
    }
};

// 全域掛載
window.Trip = Trip;

// 讓 HTML 中的 onclick 可以呼叫 handleCreateTrip (Legacy Support / Convenience)
window.handleCreateTrip = (e) => {
    // 這裡通常不會被執行到，因為我們在 initDashboard 已綁定 submit listener
    // 但保留以防萬一
    console.warn('Direct call to handleCreateTrip');
};
