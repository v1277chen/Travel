/**
 * TripService.gs
 * 行程管理服務 (Trip Management Service)
 * 
 * 負責處理行程相關的業務邏輯，例如建立行程、查詢行程、權限檢查等。
 * 此層級不直接操作 Sheet，而是呼叫 TripModel 和 TripDayModel 進行資料存取。
 */

const TripService = {
  
  /**
   * 建立新行程 (Create Trip)
   * 
   * @param {Object} user - 當前登入使用者 (行程擁有者)
   * @param {Object} payload - 建立參數 { title, description, start_date, end_date }
   * @returns {Object} 建立完成的行程物件
   */
  create: function(user, payload) {
    // 1. 參數驗證
    if (!payload.title || !payload.start_date) {
      throw new Error('標題與開始日期為必填');
    }
    
    // 2. 建構行程物件
    const newTrip = {
      trip_id: generateUUID(),
      user_id: user.user_id, // 綁定當前登入者 ID
      title: payload.title,
      description: payload.description,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: 'planning', // 預設狀態：規劃中
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 3. 寫入資料庫
    TripModel.create(newTrip);
    logToSheet('INFO', 'Trip Created', { userId: user.user_id, tripId: newTrip.trip_id });
    
    // TODO: 自動產生 TripDays (根據開始與結束日期)
    // 可以在這裡呼叫 TripDayModel.createBatch(...)
    
    return newTrip;
  },
  
  /**
   * 取得使用者的所有行程 (List Trips)
   * 
   * @param {Object} user - 當前登入使用者
   * @returns {Array<Object>} 行程列表
   */
  listByUser: function(user) {
    // 呼叫 Model 搜尋該 User ID 的所有行程
    const trips = TripModel.findByUserId(user.user_id);
    // 此處可擴充：分頁、排序邏輯
    return trips;
  },
  
  /**
   * 取得特定行程詳情 (Get Trip Details)
   * 
   * @param {Object} user - 當前登入使用者
   * @param {Object} payload - { trip_id }
   * @returns {Object} 行程物件
   */
  getDetails: function(user, payload) {
    const tripId = payload.trip_id;
    if (!tripId) throw new Error('Trip ID required');
    
    // 1. 查詢行程
    const trip = TripModel.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    
    // 2. 權限檢查 (Permission Check)
    // 只能查看自己的行程，或者使用者是管理員
    if (trip.user_id !== user.user_id && user.role !== 'admin') {
      throw new Error('Permission denied'); // 拒絕存取
    }
    
    return trip;
  },
  
  /**
   * 刪除行程 (Delete Trip)
   * 實際上執行的是邏輯刪除 (Soft Delete)，將狀態設為 deleted。
   * 
   * @param {Object} user - 當前登入使用者
   * @param {Object} payload - { trip_id }
   * @returns {Object} { success: true }
   */
  deleteTrip: function(user, payload) {
     const tripId = payload.trip_id;
     if (!tripId) throw new Error('Trip ID required');
     
     const trip = TripModel.findById(tripId);
     if (!trip) throw new Error('Trip not found');
     
     // 權限檢查
     if (trip.user_id !== user.user_id && user.role !== 'admin') {
       throw new Error('Permission denied');
     }
     
     // 執行更新狀態為 deleted
     TripModel.update(tripId, { status: 'deleted', updated_at: new Date().toISOString() });
     logToSheet('INFO', 'Trip Deleted', { userId: user.user_id, tripId: tripId });
     
     return { success: true };
  }
};
