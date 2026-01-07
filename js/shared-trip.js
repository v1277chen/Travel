/**
 * js/shared-trip.js
 * 公開行程瀏覽模組 (Public/Shared Trip Module)
 * 
 * 提供不需登入即可瀏覽公開行程的功能。
 * 使用者可以透過分享連結查看公開行程的內容。
 */

const SharedTrip = {
    // 狀態暫存
    state: {
        tripId: null,
        trip: null,
        days: [],
        items: [],
        activeDayId: null
    },

    /**
     * 初始化公開行程頁面
     * @param {string} tripId 
     */
    init: async (tripId) => {
        SharedTrip.state.tripId = tripId;
        const container = $('#shared-content');
        container.innerHTML = '<div class="text-center py-10"><div class="loader mx-auto mb-4"></div><p class="text-gray-500">正在載入公開行程...</p></div>';

        try {
            // 呼叫公開行程 API (不需 Token)
            const data = await SharedTrip.fetchPublicTrip(tripId);

            // 更新狀態
            SharedTrip.state.trip = data.trip;
            SharedTrip.state.days = data.days || [];
            SharedTrip.state.items = data.items || [];

            // 預設選取第一天
            if (SharedTrip.state.days.length > 0) {
                SharedTrip.state.activeDayId = SharedTrip.state.days[0].day_id;
            }

            // 渲染頁面
            SharedTrip.render();

        } catch (e) {
            console.error(e);
            container.innerHTML = `
                <div class="text-center py-16">
                    <i class="fas fa-lock text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-700 mb-2">無法存取此行程</h3>
                    <p class="text-gray-500 mb-4">${escapeHtml(e.message)}</p>
                    <a href="#" onclick="App.router.navigate('login'); return false;" 
                       class="text-indigo-600 hover:underline">返回登入頁</a>
                </div>
            `;
        }
    },

    /**
     * 呼叫公開行程 API (Fetch Public Trip API)
     * 
     * 此函式專門用於取得公開行程資料，不需要使用者登入或 Token 驗證。
     * 透過 fetch 直接向後端發送請求，繞過 apiService 的 Token 附加邏輯。
     * 
     * @param {string} tripId - 要取得的行程 ID
     * @returns {Promise<Object>} 回傳包含 { trip, days, items } 的物件
     * @throws {Error} 當行程不存在或非公開時拋出錯誤
     * 
     * 錯誤處理說明：
     * - 若行程不存在：後端回傳 errorCode，此函式拋出 '該行程不存在'
     * - 若行程為私密：後端回傳 errorCode，此函式拋出 '無法存取此行程'
     */
    fetchPublicTrip: async (tripId) => {
        // 使用 CONFIG.API_URL 作為後端 API 端點
        // 注意：此處不使用 apiService.call()，因為公開行程不需 Token
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            // 使用 application/json 直接傳遞 JSON 格式資料
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'trip/getPublic',  // 呼叫後端的公開行程 API
                payload: { trip_id: tripId }  // 傳遞行程 ID
            })
        });

        // 解析 JSON 回應
        const result = await response.json();
        
        // 檢查後端回傳的錯誤碼
        // 後端若發生錯誤，會回傳 { errorCode: true, message: '錯誤訊息' }
        if (result.errorCode) {
            throw new Error(result.message || '載入失敗');
        }
        
        // 回傳成功資料 { trip, days, items }
        return result;
    },

    /**
     * 渲染公開行程頁面
     */
    render: () => {
        const { trip, days } = SharedTrip.state;

        // 更新 Header
        $('#shared-trip-title').textContent = trip.title;
        $('#shared-trip-dates').textContent = `${Trip.formatDate(trip.start_date)} - ${Trip.formatDate(trip.end_date)}`;

        const container = $('#shared-content');
        container.innerHTML = '';

        // 行程簡介
        const infoSection = document.createElement('div');
        infoSection.className = 'bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6';
        infoSection.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-2">行程簡介</h3>
            <p class="text-gray-600">${escapeHtml(trip.description || '暫無描述')}</p>
        `;
        container.appendChild(infoSection);

        // 天數 Tabs
        if (days.length === 0) {
            container.innerHTML += `<div class="text-center py-10 text-gray-500">此行程尚無每日安排。</div>`;
            return;
        }

        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'mb-6 flex overflow-x-auto space-x-2 pb-2';

        days.forEach(day => {
            const btn = document.createElement('button');
            const isActive = day.day_id === SharedTrip.state.activeDayId;
            btn.className = `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${isActive
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`;

            let dateStr = String(day.date || '').substring(5, 10).replace('-', '/');
            btn.textContent = `Day ${day.day_order} (${dateStr})`;
            btn.onclick = () => SharedTrip.switchDay(day.day_id);
            tabsContainer.appendChild(btn);
        });
        container.appendChild(tabsContainer);

        // 項目列表容器
        const dayContent = document.createElement('div');
        dayContent.id = 'shared-day-content';
        container.appendChild(dayContent);

        SharedTrip.renderDayItems();
    },

    /**
     * 切換天數
     */
    switchDay: (dayId) => {
        SharedTrip.state.activeDayId = dayId;
        SharedTrip.render();
    },

    /**
     * 渲染當天項目列表 (唯讀模式)
     */
    renderDayItems: () => {
        const container = $('#shared-day-content');
        container.innerHTML = '';

        const activeDayId = SharedTrip.state.activeDayId;
        const currentItems = SharedTrip.state.items.filter(i => i.day_id === activeDayId);

        // 標題
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        header.innerHTML = `<h3 class="text-xl font-bold text-gray-800">本日行程</h3>`;
        container.appendChild(header);

        if (currentItems.length === 0) {
            container.innerHTML += `
                <div class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                    <p>本日尚未安排任何活動</p>
                </div>
            `;
            return;
        }

        // 項目列表
        const list = document.createElement('div');
        list.className = 'space-y-4';

        currentItems.sort((a, b) => (a.start_time || '99:99').localeCompare(b.start_time || '99:99'));

        currentItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-100';

            // Icon mapping
            let iconClass = 'fa-map-marker-alt';
            let iconColor = 'text-gray-400';
            switch (item.type) {
                case 'food': iconClass = 'fa-utensils'; iconColor = 'text-orange-500'; break;
                case 'transport': iconClass = 'fa-bus'; iconColor = 'text-blue-500'; break;
                case 'hotel': iconClass = 'fa-hotel'; iconColor = 'text-purple-500'; break;
                case 'attraction': iconClass = 'fa-landmark'; iconColor = 'text-red-500'; break;
            }

            el.innerHTML = `
                <div class="flex items-start">
                    <div class="mr-4 mt-1 text-xl ${iconColor} w-8 text-center">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-800 text-lg">${escapeHtml(item.name)}</h4>
                        
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
                </div>
            `;
            list.appendChild(el);
        });

        container.appendChild(list);
    }
};

// 全域掛載
window.SharedTrip = SharedTrip;
