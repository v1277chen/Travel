/**
 * js/trip-detail.js
 * 行程詳細頁面模組 (Trip Detail Module)
 * 
 * 負責處理行程詳細頁面的邏輯，包含：
 * 1. 顯示行程基本資訊。
 * 2. 顯示並切換每日行程 Tab (Days)。
 * 3. 顯示每日的行程細項列表 (Items)。
 * 4. 新增/編輯/刪除行程細項的操作。
 */

const TripDetail = {
    // 狀態暫存
    state: {
        tripId: null,
        trip: null,
        days: [],
        items: [], // Flat list of items
        activeDayId: null // 當前選取的天數 ID
    },

    /**
     * 初始化並載入詳細資料 (Initialize & Load)
     * 從 App router 被呼叫。
     * 
     * @param {string} tripId 
     */
    init: async (tripId) => {
        TripDetail.state.tripId = tripId;
        const container = $('#trip-detail-content');
        container.innerHTML = '<div class="text-center py-10"><div class="loader mx-auto mb-4"></div><p class="text-gray-500">正在載入行程細節...</p></div>';

        try {
            // 呼叫 API: trip/get (回傳 { trip, days, items })
            const data = await apiService.call('trip/get', { trip_id: tripId });

            // 更新狀態
            TripDetail.state.trip = data.trip;
            TripDetail.state.days = data.days || [];
            TripDetail.state.items = data.items || [];

            // 預設選取第一天
            if (TripDetail.state.days.length > 0) {
                TripDetail.state.activeDayId = TripDetail.state.days[0].day_id;
            }

            // 渲染完整頁面
            TripDetail.render();

        } catch (e) {
            console.error(e);
            container.innerHTML = `<div class="text-center py-10 text-red-500">載入失敗: ${e.message}</div>`;
        }
    },

    /**
     * 渲染主畫面
     */
    render: () => {
        const { trip, days } = TripDetail.state;

        // 1. 更新 Header 資訊 (標題, 日期)
        // 1. 更新 Header 資訊 (標題, 日期, 刪除按鈕)
        const headerContainer = document.getElementById('trip-detail-header-info'); // 假設 HTML 有此 ID，若無則需動態建立
        // 由於 HTML 結構較簡單，我們直接修改 #trip-detail-content 內部的渲染邏輯

        // 這裡我們不直接操作 #trip-detail-title，而是連同 Header 一起重新渲染在 Content Area 上方，或者更新既有 DOM
        // 為了簡單起見，我們假設 #trip-detail-title 和 #trip-detail-dates 是在 index.html 的固定位置
        // 1. 更新 Header 資訊 (標題, 日期, 編輯/刪除按鈕)
        // 使用 innerHTML 更新 Title 區域，包含按鈕
        $('#trip-detail-title').innerHTML = `
            <div class="flex items-center">
                <span>${escapeHtml(trip.title)}</span>
                <div class="ml-4 flex gap-2 text-base">
                    <button onclick="TripDetail.openEditModal()" class="text-gray-400 hover:text-indigo-600 p-1" title="編輯行程">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="TripDetail.deleteTrip()" class="text-gray-400 hover:text-red-500 p-1" title="刪除行程">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        $('#trip-detail-dates').textContent = `${Trip.formatDate(trip.start_date)} - ${Trip.formatDate(trip.end_date)}`;

        const container = $('#trip-detail-content');
        container.innerHTML = '';

        // 2. 渲染行程簡介區塊
        const infoSection = document.createElement('div');
        infoSection.className = 'bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6';
        infoSection.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-2">行程簡介</h3>
            <p class="text-gray-600">${escapeHtml(trip.description || '暫無描述')}</p>
        `;
        container.appendChild(infoSection);

        // 3. 渲染天數 Tabs 與內容區
        if (days.length === 0) {
            container.innerHTML += `<div class="text-center py-10 text-gray-500">此行程尚未產生天數資料，請檢查建立流程。</div>`;
            return;
        }

        // 建立 Tabs 容器
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'mb-6 flex overflow-x-auto space-x-2 pb-2';

        days.forEach(day => {
            const btn = document.createElement('button');
            const isActive = day.day_id === TripDetail.state.activeDayId;
            btn.className = `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`;
            // 顯示 Day N (MM/DD)
            // 安全處理日期: 若為 Date 物件則轉字串，否則直接取用
            let dateStr = '';
            if (day.date instanceof Date) {
                dateStr = day.date.toISOString();
            } else {
                dateStr = String(day.date);
            }
            // 只取 MM/DD (5-10)
            dateStr = dateStr.substring(5, 10).replace('-', '/');

            btn.textContent = `Day ${day.day_order} (${dateStr})`;
            btn.onclick = () => TripDetail.switchDay(day.day_id);
            tabsContainer.appendChild(btn);
        });
        container.appendChild(tabsContainer);

        // 建立當前天數的內容容器 (Items List)
        const dayContent = document.createElement('div');
        dayContent.id = 'day-content-area';
        container.appendChild(dayContent);

        // 渲染選定天數的列表
        TripDetail.renderDayItems();
    },

    /**
     * 切換天數 Tab
     */
    switchDay: (dayId) => {
        TripDetail.state.activeDayId = dayId;
        TripDetail.render(); // 重新渲染 (或只更新 Tabs 樣式與 list)
    },

    /**
     * 渲染當前天數的項目列表
     */
    renderDayItems: () => {
        const container = $('#day-content-area');
        container.innerHTML = '';

        const activeDayId = TripDetail.state.activeDayId;
        const currentItems = TripDetail.state.items.filter(i => i.day_id === activeDayId);

        // 標題列 + 新增按鈕
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        header.innerHTML = `
            <h3 class="text-xl font-bold text-gray-800">本日行程</h3>
            <button onclick="TripDetail.openAddItemModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm flex items-center shadow-sm">
                <i class="fas fa-plus mr-1"></i> 新增項目
            </button>
        `;
        container.appendChild(header);

        if (currentItems.length === 0) {
            container.innerHTML += `
                <div class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                    <p class="mb-2">本日尚未安排任何活動</p>
                    <button onclick="TripDetail.openAddItemModal()" class="text-indigo-600 font-medium hover:underline">立即新增</button>
                </div>
            `;
            return;
        }

        // 項目列表
        const list = document.createElement('div');
        list.className = 'space-y-4';

        // 依開始時間排序 (簡單實作)
        currentItems.sort((a, b) => (a.start_time || '99:99').localeCompare(b.start_time || '99:99'));

        currentItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start group hover:shadow-md transition';

            // Icon mapping by type
            let iconClass = 'fa-map-marker-alt';
            let iconColor = 'text-gray-400';
            switch (item.type) {
                case 'food': iconClass = 'fa-utensils'; iconColor = 'text-orange-500'; break;
                case 'transport': iconClass = 'fa-bus'; iconColor = 'text-blue-500'; break;
                case 'hotel': iconClass = 'fa-hotel'; iconColor = 'text-purple-500'; break;
                case 'attraction': iconClass = 'fa-landmark'; iconColor = 'text-red-500'; break;
            }

            el.innerHTML = `
                <div class="mr-4 mt-1 text-xl ${iconColor} w-8 text-center">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-gray-800 text-lg">${escapeHtml(item.name)}</h4>
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onclick="TripDetail.editItem('${item.item_id}')" class="text-gray-400 hover:text-indigo-600 p-1"><i class="fas fa-edit"></i></button>
                            <button onclick="TripDetail.deleteItem('${item.item_id}')" class="text-gray-400 hover:text-red-600 p-1"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                    
                    <div class="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        ${item.start_time ? `<span class="flex items-center"><i class="far fa-clock mr-1 text-gray-400"></i> ${item.start_time}${item.end_time ? ' - ' + item.end_time : ''}</span>` : ''}
                        ${(item.location_address || item.location) ? `<span class="flex items-center"><i class="fas fa-map-pin mr-1 text-gray-400"></i> ${escapeHtml(item.location_address || item.location)}</span>` : ''}
                        ${item.cost ? `<span class="flex items-center"><i class="fas fa-coins mr-1 text-gray-400"></i> $${item.cost}</span>` : ''}
                    </div>
                    
                    ${item.link_url ? `
                    <div class="mt-2">
                        <a href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center text-sm text-green-600 hover:text-green-800 hover:underline bg-green-50 px-3 py-1.5 rounded-full transition">
                            <i class="fas fa-map-marked-alt mr-1.5"></i>
                            在 Google Maps 中開啟
                            <i class="fas fa-external-link-alt ml-1.5 text-xs"></i>
                        </a>
                    </div>
                    ` : ''}
                    
                    ${item.notes ? `<p class="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">${escapeHtml(item.notes)}</p>` : ''}
                </div>
            `;
            list.appendChild(el);
        });

        container.appendChild(list);
    },

    // === Modal Actions ===

    /**
     * 開啟新增項目 Modal
     */
    openAddItemModal: () => {
        // 重置表單
        $('#add-item-form').reset();
        $('#item-modal-title').textContent = '新增行程項目';
        $('#item-id-hidden').value = ''; // 清空 ID 表示新增

        // 顯示 Modal
        $('#item-modal').classList.remove('hidden');
    },

    /**
     * 編輯項目
     */
    editItem: (itemId) => {
        const item = TripDetail.state.items.find(i => i.item_id === itemId);
        if (!item) return;

        $('#item-modal-title').textContent = '編輯行程項目';
        $('#item-id-hidden').value = item.item_id;

        // 填入資料
        $('#item-type').value = item.type;
        $('#item-name').value = item.name;
        $('#item-location').value = item.location_address || item.location || '';
        $('#item-start-time').value = item.start_time || '';
        $('#item-end-time').value = item.end_time || '';
        $('#item-cost').value = item.cost || '';
        $('#item-link-url').value = item.link_url || '';  // Google Maps 連結
        $('#item-notes').value = item.notes || '';

        $('#item-modal').classList.remove('hidden');
    },

    /**
     * 刪除項目
     */
    deleteItem: async (itemId) => {
        if (!confirm('確定要刪除這個項目嗎？')) return;

        try {
            await apiService.call('trip/deleteItem', {
                trip_id: TripDetail.state.tripId,
                item_id: itemId
            });

            // 更新本地狀態 (移除該項目)
            TripDetail.state.items = TripDetail.state.items.filter(i => i.item_id !== itemId);
            showToast('已刪除');
            TripDetail.renderDayItems(); // 重新渲染列表

        } catch (e) {
            console.error(e);
            showToast(e.message, 'error');
        }
    },

    /**
     * 提交項目表單 (新增與修改共用)
     */
    handleItemSubmit: async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = '儲存中...';

        try {
            const itemId = $('#item-id-hidden').value;
            const isEdit = !!itemId;

            const payload = {
                trip_id: TripDetail.state.tripId,
                day_id: TripDetail.state.activeDayId, // 新增時使用當前天數
                type: $('#item-type').value,
                name: $('#item-name').value,
                location: $('#item-location').value,
                start_time: $('#item-start-time').value,
                end_time: $('#item-end-time').value,
                cost: parseFloat($('#item-cost').value) || 0,
                link_url: $('#item-link-url').value || '',  // Google Maps 連結
                notes: $('#item-notes').value
            };

            if (isEdit) {
                // 修改模式
                payload.item_id = itemId;
                // 更新後端
                await apiService.call('trip/updateItem', {
                    trip_id: payload.trip_id,
                    item_id: payload.item_id,
                    updates: payload
                });

                // 更新本地狀態
                const idx = TripDetail.state.items.findIndex(i => i.item_id === itemId);
                if (idx !== -1) {
                    TripDetail.state.items[idx] = { ...TripDetail.state.items[idx], ...payload };
                }

            } else {
                // 新增模式
                // 呼叫 API
                const newItem = await apiService.call('trip/addItem', payload);
                // 更新本地狀態
                TripDetail.state.items.push(newItem);
            }

            showToast(isEdit ? '更新成功' : '新增成功');
            $('#item-modal').classList.add('hidden');
            TripDetail.renderDayItems();

        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '儲存';
        }
    },



    /**
     * 開啟編輯行程 Modal
     */
    openEditModal: () => {
        const { trip } = TripDetail.state;
        if (!trip) return;

        $('#edit-trip-id').value = trip.trip_id;
        $('#edit-trip-title').value = trip.title;
        // 日期格式 YYYY-MM-DD
        $('#edit-trip-start-date').value = trip.start_date.substring(0, 10);
        $('#edit-trip-end-date').value = trip.end_date.substring(0, 10);
        $('#edit-trip-desc').value = trip.description || '';

        $('#edit-trip-modal').classList.remove('hidden');
    },

    /**
     * 處理編輯行程提交
     */
    handleEditTripSubmit: async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = '更新中...';

        try {
            const tripId = $('#edit-trip-id').value;
            const payload = {
                trip_id: tripId,
                title: $('#edit-trip-title').value,
                start_date: $('#edit-trip-start-date').value,
                end_date: $('#edit-trip-end-date').value,
                description: $('#edit-trip-desc').value
            };

            await apiService.call('trip/update', payload);

            showToast('行程已更新');
            $('#edit-trip-modal').classList.add('hidden');

            // 重新載入詳情
            TripDetail.init(tripId);

        } catch (err) {
            console.error(err);
            showToast('更新失敗: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '儲存變更';
        }
    },

    /**
     * 刪除整個行程 (Delete Trip from Detail Page)
     */
    deleteTrip: async () => {
        if (!confirm('確定要刪除這個行程嗎？此動作無法復原。')) return;

        try {
            await apiService.call('trip/delete', { trip_id: TripDetail.state.tripId });
            showToast('行程已刪除');
            // 刪除後返回儀表板
            App.router.navigate('dashboard');
        } catch (e) {
            console.error(e);
            showToast('刪除失敗: ' + e.message, 'error');
        }
    }
};

// 全域掛載
window.TripDetail = TripDetail;

// 頁面載入後綁定 Modal 事件
document.addEventListener('DOMContentLoaded', () => {
    // 綁定項目表單提交
    const itemForm = document.getElementById('add-item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', TripDetail.handleItemSubmit);
    }
    // 綁定行程編輯表單提交
    const tripForm = document.getElementById('edit-trip-form');
    if (tripForm) {
        tripForm.addEventListener('submit', TripDetail.handleEditTripSubmit);
    }
});
