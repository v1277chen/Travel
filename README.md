# Travel Planner 行程規劃系統

這是一個基於前後端分離架構的旅遊行程規劃應用程式。
前端採用靜態 HTML/JS 託管於 **GitHub Pages**，後端採用 **Google Apps Script (GAS)** 提供 RESTful API 服務並以 **Google Spreadsheet** 作為資料庫。

## 系統架構 (System Architecture)

- **Frontend (前端)**: 
  - 核心：HTML5, CSS3, Vanilla JavaScript (單頁應用 SPA)
  - 託管：GitHub Pages (自動部署)
  - 通訊：使用 `fetch` API 呼叫後端 REST API
- **Backend (後端)**: 
  - 運行環境：Google Apps Script (GAS) Web App
  - 介面：RESTful JSON API (POST only, for CORS compatibility)
  - 資料庫：Google Sheets (試算表)
  - 安全性：Token-based Authentication, Password Hashing (SHA-256)

## 功能特色 (Features)
- **使用者驗證**: 註冊、登入、Token 驗證。
- **行程管理**: 建立、檢視、修改旅遊行程。
- **細項規劃**: 管理每日行程活動 (開發中)。
- **安全性**: XSS 防護、權限控管 (防止 IDOR 攻擊)。

## 部署教學 (Deployment Guide)

### 1. 後端部署 (Backend Deployment)

1. **建立 Google Sheet**:
   - 新增一個新的 Google Sheet。
   - 記下 Spreadsheet ID (網址中 `/d/` 與 `/edit` 之間的部分)。

2. **建立 GAS 專案**:
   - 將 `backend/` 資料夾中的 `.gs` 檔案複製到 GAS 專案中。
   - 執行 `Setup.gs` 裡的 `initDatabase()` 函式以初始化資料表結構。

3. **發布 Web App**:
   - 點擊 [部署] -> [建立新部署]。
   - 類型選擇「網頁應用程式 (Web App)」。
   - **執行身分**: `我 (Me)`。
   - **誰可以存取**: `任何人 (Anyone)` (為了讓前端能跨域呼叫)。
   - 部署後，複製產生的 **Web App URL**。

### 2. 前端部署 (Frontend Deployment)

1. **設定 API URL**:
   - 打開 `index.html`。
   - 找到 `CONFIG.API_URL` 設定項，填入上一步取得的 Web App URL。
   
   ```javascript
   const CONFIG = {
       API_URL: 'https://script.google.com/macros/s/..../exec'
   };
   ```

2. **推送到 GitHub**:
   ```bash
   git add .
   git commit -m "Update API URL"
   git push origin master
   ```

3. **啟用 GitHub Pages**:
   - 本專案已包含 GitHub Actions (`.github/workflows/deploy.yml`)。
   - Push 到 `master` 分支後，GitHub Actions 會自動建置並部署到 Pages。
   - 請前往 Repository 的 **Settings** -> **Pages**，將 "Source" 改為 **GitHub Actions** (如果沒有自動設定)。

## 自動化部署 (CI/CD)

本專案配置了 GitHub Action 流程：
- 檔案：`.github/workflows/deploy.yml`
- 觸發：當 `master` 分支有新的 Push 時。
- 行為：自動將根目錄的靜態檔案部署至 GitHub Pages。

## 開發指南

### 檔案結構
```
/
├── .github/workflows/  # CI/CD 設定檔
├── backend/            # 後端原始碼 (不追蹤，僅本地備份)
│   ├── Code.gs         # API 入口與邏輯
│   ├── Models.gs       # 資料模型
│   ├── Utils.gs        # 工具函式
│   └── Setup.gs        # 資料庫初始化
├── index.html          # 前端入口 (包含 CSS/JS)
└── README.md           # 說明文件
```

### 注意事項
- **安全性**: 請勿將含有真實 API Key 或 Spreadsheet ID 的 `backend/` 程式碼提交到公開的 GitHub Repository (本專案預設已將 backend 加入 .gitignore)。
- **CORS**: 由於 GAS 的 CORS 限制，前端一律使用 `POST` 方法傳送 JSON body，並設定 Content-Type 為 `text/plain` 或是依賴 GAS 的自動重新導向機制。

---
&copy; 2025 Travel Planner Team.
