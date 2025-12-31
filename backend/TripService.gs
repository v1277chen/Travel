/**
 * TripService.gs
 * 行程管理服務 (Trip Management Service)
 * 
 * 負責處理行程相關的業務邏輯，包含：
 * 1. 建立行程與自動產生天數。
 * 2. 查詢行程詳細資料 (包含天數與細項)。
 * 3. 行程細項 (TripItems) 的 CRUD 操作。
 */

const TripService = {
  
  /**
   * 建立新行程 (Create Trip)
   * 建立行程主檔，並根據日期範圍自動產生每日行程 (TripDays)。
   * 
   * @param {Object} user - 當前登入使用者
   * @param {Object} payload - { title, description, start_date, end_date }
   * @returns {Object} 建立完成的行程物件
   */
  create: function(user, payload) {
    if (!payload.title || !payload.start_date) {
      throw new Error('標題與開始日期為必填');
    }
    
    // 1. 建立行程主檔
    const newTrip = {
      trip_id: generateUUID(),
      user_id: user.user_id,
      title: payload.title,
      description: payload.description,
      start_date: payload.start_date,
      end_date: payload.end_date || payload.start_date, // 若無結束日期則同開始日期
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    TripModel.create(newTrip);
    logToSheet('INFO', 'Trip Created', { userId: user.user_id, tripId: newTrip.trip_id });
    
    // 2. 自動產生行程天數 (TripDays)
    try {
      const days = this._generateDays(newTrip.trip_id, newTrip.start_date, newTrip.end_date);
      TripDayModel.createBatch(days);
      logToSheet('INFO', 'TripDays Generated', { tripId: newTrip.trip_id, count: days.length });
    } catch (e) {
      // 若產生天數失敗，僅記錄 Error 但不中斷行程建立 (容錯)
      logToSheet('ERROR', 'Failed to generate days', { error: e.toString() });
    }
    
    return newTrip;
  },
  
  /**
   * 內部輔助函式：根據日期範圍產生天數陣列
   */
  _generateDays: function(tripId, startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const days = [];
    let current = new Date(start);
    let dayOrder = 1;
    
    // 迴圈產生每一天，直到超過結束日期
    while (current <= end) {
      days.push({
        day_id: generateUUID(),
        trip_id: tripId,
        date: current.toISOString().split('T')[0], // YYYY-MM-DD
        day_order: dayOrder++,
        weather_info: ''
      });
      // 加一天
      current.setDate(current.getDate() + 1);
    }
    return days;
  },
  
  /**
   * 取得使用者的所有行程列表
   */
  listByUser: function(user) {
    return TripModel.findByUserId(user.user_id);
  },
  
  /**
   * 取得特定行程完整詳情 (Get Trip Full Details)
   * 包含：Trip Info, Trip Days, Trip Items
   * 
   * @param {Object} user 
   * @param {Object} payload - { trip_id }
   */
  getDetails: function(user, payload) {
    const tripId = payload.trip_id;
    if (!tripId) throw new Error('Trip ID required');
    
    // 1. 查詢行程主檔
    const trip = TripModel.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    
    // 權限檢查
    if (trip.user_id !== user.user_id && user.role !== 'admin') {
      throw new Error('Permission denied');
    }
    
    // 2. 查詢天數 (Days)
    const days = TripDayModel.findByTripId(tripId);
    
    // 3. 查詢項目 (Items)
    const items = TripItemModel.findByTripId(tripId);
    
    // 4. 組合回傳資料
    // 為了前端方便，我們可以將 items 分配到對應的 days 中，
    // 或者直接回傳 flat list 讓前端處理。這裡選擇直接回傳，保持後端單純。
    return {
      trip: trip,
      days: days,
      items: items
    };
  },
  
  /**
   * 刪除行程
   */
  deleteTrip: function(user, payload) {
     const tripId = payload.trip_id;
     if (!tripId) throw new Error('Trip ID required');
     
     const trip = TripModel.findById(tripId);
     if (!trip) throw new Error('Trip not found');
     
     if (trip.user_id !== user.user_id && user.role !== 'admin') {
       throw new Error('Permission denied');
     }
     
     TripModel.update(tripId, { status: 'deleted', updated_at: new Date().toISOString() });
     
     // 選擇性：也可以將相關的 Items 標記為 deleted，
     // 但目前 TripModel 這裡只做 Trip 層級的刪除標記。
     
     return { success: true };
  },

  // === Trip Item CRUD === //

  /**
   * 新增行程項目 (Add Item)
   * @param {Object} user 
   * @param {Object} payload - { trip_id, day_id, type, name, ... }
   */
  addItem: function(user, payload) {
    // 驗證必填欄位
    if (!payload.trip_id || !payload.day_id || !payload.name) {
      throw new Error('Missing required fields (trip_id, day_id, name)');
    }

    // 權限檢查 (需先確認 Trip 是否屬於該使用者)
    const trip = TripModel.findById(payload.trip_id);
    if (!trip) throw new Error('Trip not found');
    if (trip.user_id !== user.user_id && user.role !== 'admin') {
      throw new Error('Permission denied');
    }

    const newItem = {
      item_id: generateUUID(),
      trip_id: payload.trip_id,
      day_id: payload.day_id,
      type: payload.type || 'attraction',
      name: payload.name,
      location: payload.location || '',
      start_time: payload.start_time || '',
      end_time: payload.end_time || '',
      cost: payload.cost || 0,
      notes: payload.notes || '',
      status: 'active'
    };

    TripItemModel.create(newItem);
    return newItem;
  },

  /**
   * 更新行程項目 (Update Item)
   * @param {Object} user 
   * @param {Object} payload - { trip_id, item_id, updates: {...} }
   */
  updateItem: function(user, payload) {
    const { trip_id, item_id, updates } = payload;
    if (!trip_id || !item_id || !updates) throw new Error('Invalid arguments');

    // 權限檢查
    const trip = TripModel.findById(trip_id);
    if (!trip) throw new Error('Trip not found');
    if (trip.user_id !== user.user_id && user.role !== 'admin') {
      throw new Error('Permission denied');
    }

    // 執行更新
    const success = TripItemModel.update(item_id, updates);
    if (!success) throw new Error('Update failed or Item not found');

    return { success: true };
  },

  /**
   * 刪除行程項目 (Delete Item)
   * @param {Object} user 
   * @param {Object} payload - { trip_id, item_id }
   */
  deleteItem: function(user, payload) {
     const { trip_id, item_id } = payload;
     
     // 權限檢查
     const trip = TripModel.findById(trip_id);
     if (!trip || (trip.user_id !== user.user_id && user.role !== 'admin')) {
       throw new Error('Permission denied');
     }
     
     const success = TripItemModel.delete(item_id);
     if (!success) throw new Error('Delete failed');
     
     return { success: true };
  }
};
