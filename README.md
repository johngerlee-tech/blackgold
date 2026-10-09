# 🧙‍♂️《黑金魔法術─永續食物循環系統》- 互動式 RPG 答題遊戲 (GitHub & Firebase 雲端網頁版)

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20GitHub%20Pages%20%7C%20PC%20%7C%20Tablet-blue.svg)]()
[![Database](https://img.shields.io/badge/Database-Firebase%20Firestore%20%7C%20Local%20JSON-orange.svg)]()
[![Framework](https://img.shields.io/badge/Framework-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS%20%7C%20Web%20Audio-green.svg)]()

> 本資料夾為獨立的 **GitHub & Firebase 專屬版本**，專為直接上傳 GitHub、啟用 GitHub Pages 免費網頁託管與 Google Firebase Firestore 雲端即時同步打造！  
> 無需任何 Python 伺服器即可直接由瀏覽器運行，全班學生使用 iPad、Android 平板、手機或電腦隨點即玩。您也可以雙擊本資料夾中的 **`本地預覽.bat`** 於本機即時預覽。

---

## 🌟 兩大運行模式：隨選隨用

本系統具備**雙軌架構**，無須改動核心程式碼，可依照您的教學場景自由切換：

| 比較項目 | 🌐 模式 A：GitHub Pages + Firebase (推薦) | 💻 模式 B：本機 Python 伺服器 (經典) |
| :--- | :--- | :--- |
| **適用場景** | 學生在家自學、跨教室遠距連線、無伺服器主機環境 | 學校電腦教室、無外網環境、封閉式區網教學 |
| **主機建置** | **完全零主機 (Serverless)**，靜態網頁直接託管 | 需在一台 Windows 電腦執行 `啟動程式.bat` |
| **資料庫** | **Google Firebase Firestore 雲端即時同步** | 本機 `Game-data/*.json` 檔案 |
| **跨載具連線** | 只要有網址，PC、筆電、iPad、安卓平板隨點即玩 | 需連線至同一個 Wi-Fi 區網並掃描 QR Code |
| **離線支援** | 具備 Firestore 本地持久化快取，短暫斷網不中斷 | 需維持區網連線 |

---

## 📱 平板載具與 PC 最佳化改善項目（前版問題全面修復）

針對教室常見的 **iPad、Android 平板** 與 **PC 桌機** 進行了全方位的版面自適應與操作體驗優化：

1. **📐 虛擬舞台自動等比縮放（徹底解決平板版面過大被裁切問題）**：
   - 採基準解析度 `1280 × 720 (16:9)` 的虛擬遊戲舞台（`ViewportScaler` 引擎）。
   - 自動偵測瀏覽器實際可用高度（解決 Safari / Chrome 上下網址列與工具列擠壓畫面高度的問題，如 iPad 1024×579 或分割畫面 1024×460）。
   - 保證無論螢幕比例為何，遊戲畫面上方狀態列、中央魔王立繪與下方四個作答選項**100% 完整呈現於視野內**，絕不被擠出螢幕外。
2. **⛶ 全新右上角「全螢幕 / 視窗」快捷按鈕**：
   - 遊戲畫面右上角常駐 `⛶ 全螢幕` 切換按鈕。
   - 平板學生一鍵點擊即可隱藏瀏覽器網址列，享受沉浸式全螢幕操作；再次點擊即可還原。
3. **📝 選項文字三行保護與防截斷（解決選項內容被砍半問題）**：
   - 答題選項文字升級為最多容納 3 行完整展示（`-webkit-line-clamp: 3; word-break: break-word`）。
   - 長篇題目或較長說明選項不再被 `...` 省略截斷，選項 C、D 與按鈕間距完整保留。
4. **🔊 iOS / iPadOS Safari 音訊自動手勢解鎖**：
   - 針對 Apple 裝置嚴格的音訊自動播放限制，在玩家首次觸控螢幕（`touchstart` / `click`）時自動無縫喚醒 Web Audio API，背景音樂與打擊音效完美出聲。
5. **⌨️ PC 端專屬鍵盤快捷鍵**：
   - 鍵盤 `1` ~ `4` 或 `A` ~ `D`：快速選取四個選項作答。
   - 鍵盤 `S`：開啟 / 關閉勇者特技選單。
   - 鍵盤 `I`：開啟 / 關閉魔法道具背包。
   - 鍵盤 `ESC`：關閉所有彈出選單。

---

## 🚀 部署指南一：GitHub 上傳與 GitHub Pages 免費發布

將本遊戲發布到 GitHub Pages，即可獲得一個專屬的公開遊戲網址（例如 `https://你的帳號.github.io/專案名稱/`），學生無需安裝任何軟體即可開始遊玩！

### 步驟 1：建立 GitHub 儲存庫（Repository）
1. 登入 [GitHub](https://github.com/)，點擊右上角 **「+」** $\rightarrow$ **「New repository」**。
2. 輸入儲存庫名稱（例如 `blackgold-rpg`），設為 **Public**，點擊 **Create repository**。

### 步驟 2：上傳專案檔案至 GitHub
本專案已包含完整的 `.gitignore`，可過濾暫存檔與快取：
- **方式 A（使用 GitHub 網頁直接上傳）**：
  1. 在剛建立好的 GitHub 專案頁面中，點擊 **「uploading an existing file」**。
  2. 將本專案資料夾內的所有檔案與資料夾（包含 `index.html`、`firebase-config.js`、`js/`、`css/`、`assets/`、`Game-data/`）拖曳至網頁中。
  3. 點擊 **Commit changes** 儲存。
- **方式 B（使用 Git 命令列或 GitHub Desktop）**：
  ```bash
  git init
  git add .
  git commit -m "feat: release blackgold rpg with firebase and tablet responsive layout"
  git branch -M main
  git remote add origin https://github.com/你的帳號/你的儲存庫名稱.git
  git push -u origin main
  ```

### 步驟 3：啟用 GitHub Pages 免費網頁託管
1. 進入該 GitHub 專案的 **Settings（設定）** 頁籤。
2. 於左側選單點選 **Pages**。
3. 在 **Build and deployment** 下方的 **Branch** 選擇 **`main`** 分支，目錄保持 **`/(root)`**。
4. 點擊 **Save**。
5. 等待 1~2 分鐘後重新整理頁面，上方將出現發布成功的網址：
   > 🌐 `Your site is live at https://<你的帳號>.github.io/<儲存庫名稱>/`
6. 直接點擊該網址，即可在電腦或平板上順暢遊玩！

---

## 🔥 部署指南二：Firebase Firestore 雲端資料庫設定（全班即時同步）

為了讓題庫、自訂測驗與全班學生的作答歷程能夠跨載具雲端儲存，系統整合了 Google 免費的 **Firebase Firestore**：

### 步驟 1：建立 Firebase 免費專案
1. 前往 [Firebase 控制台 (Firebase Console)](https://console.firebase.google.com/) 並使用 Google 帳號登入。
2. 點擊 **「新增專案」**，輸入專案名稱（例如 `blackgold-game`）。
3. Google Analytics 可依需求選擇啟用或關閉，點擊 **建立專案**。

### 步驟 2：啟動 Cloud Firestore 資料庫
1. 在左側導覽列中，點擊 **「建構 (Build)」** $\rightarrow$ **「Firestore Database」**。
2. 點擊 **「建立資料庫」**。
3. 安全性規則選擇 **「以測試模式啟動 (Start in test mode)」**（可先供教學快速測試，後續可依需求設定規則）。
4. 地理位置建議選擇 `asia-east1`（台灣）或鄰近之亞洲伺服器位置，點擊 **完成**。

### 步驟 3：取得 Web 應用程式連線金鑰（firebaseConfig）
1. 點擊左上角齒輪圖示 **「專案設定 (Project settings)」**。
2. 在「一般」分頁往下滑至「您的應用程式」，點擊網頁圖示 **`</>` (Web)**。
3. 輸入應用程式暱稱（例如 `blackgold-web`），點擊「註冊應用程式」。
4. 畫面將顯示一組包含 `apiKey`、`authDomain`、`projectId` 等屬性的 `firebaseConfig` 物件。

### 步驟 4：設定金鑰（二選一，極其簡單）
- **方式 A（在專案檔案中設定）**：
  - 開啟專案根目錄的 `firebase-config.js`。
  - 將 Firebase 給予的設定值填入：
    ```javascript
    window.FIREBASE_CONFIG = {
      apiKey: "AIzaSy...",
      authDomain: "你的專案.firebaseapp.com",
      projectId: "你的專案ID",
      storageBucket: "你的專案.firebasestorage.app",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:..."
    };
    ```
- **方式 B（免改程式碼！直接在遊戲管理後台貼上）**：
  1. 開啟遊戲網頁，點擊首頁 **「⚙️ 教師 / 管理者題庫後台」**（預設密碼：`j63514219`，登入後可於右上角自由編修）。
  2. 切換至 **「🔥 Firebase 雲端資料庫」** 分頁。
  3. 直接將 Firebase 控制台複製的整段程式碼貼入輸入框中，點擊 **「解析並填入欄位」** $\rightarrow$ **「儲存並套用設定」**。
  4. 系統會自動驗證連線並顯示「🟢 Firebase 雲端資料庫已連線」。

### 步驟 5：一鍵將本機初始題庫同步至雲端（種子資料初始化）
1. 進入後台「🔥 Firebase 雲端資料庫」分頁。
2. 點擊綠色按鈕 **「🌱 同步本機資料至 Firebase（初始化預設題庫與數值）」**。
3. 系統即會自動將遊戲內建的 5 大關卡題庫、主題測驗與勇者魔王平衡設定寫入雲端 Firestore！

### 🔒 推薦的 Firestore 安全規則（Security Rules）
進入 Firebase Console $\rightarrow$ **Firestore Database** $\rightarrow$ **規則 (Rules)**，可貼入以下規則以保障資料讀寫：
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許所有人讀取題庫與配置
    match /blackgold_config/{document} {
      allow read: if true;
      allow write: if true;
    }
    match /blackgold_exams/{document} {
      allow read: if true;
      allow write: if true;
    }
    match /blackgold_question_banks/{document} {
      allow read: if true;
      allow write: if true;
    }
    // 允許學生新增作答記錄，所有人可讀取成績分析
    match /blackgold_student_records/{document} {
      allow read, write: if true;
    }
  }
}
```

---

## 💻 經典運行模式：本機 Python 伺服器與區網模式

若在無對外網際網路或嚴格防火牆的電腦教室，可使用本機綠色執行模式：

1. 雙擊執行目錄下的 **`啟動程式.bat`**。
2. 程式將自動偵測環境並開啟圖形化控制面板（`web_exe2.py`）。
3. 點擊 **「📱 顯示 QR Code」**，螢幕將放大顯示專屬連線網址與 QR Code。
4. 平板或手機連上相同 Wi-Fi 後掃碼即可直接連入遊玩！

---

## 🎯 教師 / 管理者題庫後台功能詳解

點擊主畫面首頁或大地圖左上角的 **「⚙️ 教師 / 管理者題庫後台」** 按鈕，輸入預設密碼 **`j63514219`** 即可進入全方位管理後台（登入後可隨時點擊右上角「🔐 修改管理密碼」更新並寫入資料庫）。後台共包含七大模組：

```
教師 / 管理者後台
├── 📚 題庫管理與派送       (CSV 一鍵匯入 / Gemini AI 出題 / 線上題目編輯器)
├── 🎯 主題測驗管理         (多題庫自由組卷 / 測驗啟用與停用切換)
├── 📊 學生作答分析與錯題本   (作答歷程 / 錯題難度排行榜 / 課堂全螢幕簡報模式)
├── 🧙‍♂️ 勇者與關主數值調整    (四大勇者與五大魔王 HP/MP/攻防/特技數值平衡自訂)
├── 🖼️ 自訂圖片與 AI 生圖   (20張圖片單圖/ZIP上傳 / 雙向回退 / 免費AI Prompt產生器)
├── 📂 本地檔案儲存架構     (即時查看本機/雲端資料狀態)
└── 🔥 Firebase 雲端資料庫  (連線狀態檢測 / 金鑰設定 / 一鍵雲端種子資料同步)
```

### 模組亮點說明：
1. **📚 題庫管理**：
   - 支援任意學科出題（國語、數學、英文、自然、社會等皆可）。
   - 支援試算表標準 CSV 批次匯入（提供匯入樣版）。
   - 內建 **Gemini AI 出題小幫手**：一鍵複製 Prompt 給 AI 即可自動轉化課堂講義為選擇題。
2. **🎯 主題測驗**：
   - 自由勾選複數題庫進行跨題庫組卷。
   - 支援開關「已停用」，學生端選單將自動隱藏未開放的考卷。
3. **📊 作答分析與課堂簡報檢討模式**：
   - 錯題排行榜依「全班答錯人數」自動排序，立即掌握全班迷思概念。
   - 一鍵將全班錯題打包生成「弱點補救新題庫」。
   - **大螢幕簡報檢討模式**（快捷鍵 `H` 答案開關、`←`/`→` 翻頁、`F` 全螢幕），適合投影至黑板引導討論。
4. **🖼️ 全域視覺 20 張圖片客製取代引擎**：
   - 包含 4 位勇者立繪/頭像、5 位關主魔王立繪、5 大戰鬥背景與 2 大世界背景。
   - 具備**雙向智慧回退機制**（僅上傳頭像或立繪時自動共用對應圖示）。
   - 內建「AI 生圖 Prompt 產生器」，自選風格與故事主題，一秒產出 20 張對應 Prompt 指令。
5. **🔥 Firebase 雲端管理**：
   - 支援圖形化設定雲端金鑰、一鍵連線測試與一鍵同步種子資料。

---

## 📁 檔案目錄結構

```
黑金魔法術RPG/
├── index.html                  # 遊戲主頁面 (HTML5 / 自適應縮放舞台)
├── firebase-config.js          # Firebase 雲端資料庫設定檔
├── firebase-config.example.js  # Firebase 設定範本
├── .gitignore                  # Git 忽略清單 (過濾編譯快取與暫存圖檔)
├── README.md                   # 系統完整架構與部署教學說明文件
├── 啟動程式.bat                # Windows 一鍵啟動本機伺服器腳本
├── server.py                   # 本機輕量 Python HTTP 伺服器與 RESTful API
├── web_exe2.py                 # PyQt5 桌面控制面板與 QR Code 產生器
│
├── css/
│   ├── style.css               # 主題樣式 (鳥山明風格、膠囊血條、自適應縮放)
│   └── animations.css          # 動畫效果 (打擊震動、暴擊粒子、落葉特效)
│
├── js/
│   ├── firebase-service.js     # Firebase Firestore 雲端同步核心引擎
│   ├── data.js                 # 雙軌資料管理層 (雲端優先 + 本機無縫回退)
│   ├── game-images-meta.js     # 20 張圖片全域元資料與生圖 Prompt 產生器
│   ├── audio.js                # Web Audio 原生音效合成引擎 (含 iOS 觸控解鎖)
│   ├── admin.js                # 教師 / 管理者題庫與雲端後台管理邏輯
│   ├── battle.js               # 戰鬥答題引擎 (含 PC 快捷鍵、隨機出題、倒數反擊)
│   ├── worldmap.js             # 永續循環大地圖自由尋路與關卡切換
│   └── main.js                 # 應用程式入口、自適應視窗縮放器 (ViewportScaler)
│
├── Game-data/
│   ├── question_banks.json     # 預設題庫題目資料 (生熟廚餘、落葉堆肥、微生物等)
│   ├── exams.json              # 預設測驗組卷配置
│   ├── student_records.json    # 學生作答成績紀錄
│   ├── config.json             # 遊戲數值平衡設定 (勇者與魔王屬性)
│   └── sample_import.csv       # 題目 CSV 匯入標準示範檔
│
└── assets/
    └── images/                 # 遊戲美術立繪、角色特寫與背景圖檔
```

---

## 🛠️ 支援設備與瀏覽器規格

- **行動與平板載具**：
  - Apple iPad（iPadOS 14+ / Safari、Chrome、Edge）
  - Android 平板（Android 9+ / Chrome、Firefox、Edge）
  - 智慧型手機（橫向擺放體驗最佳，支援直向轉向提示）
- **桌上型與筆記型電腦**：
  - Windows 10 / 11、macOS、Linux、ChromeOS
  - 支援所有現代標準瀏覽器（Google Chrome、Microsoft Edge、Safari、Firefox）
- **本機 Python 環境**（若採用本機模式）：Python 3.9 以上，依賴 `PyQt5`, `PyQtWebEngine`, `qrcode`, `Pillow`。

---

## 📜 創用 CC 授權宣告

本作品採用 **[創用 CC 姓名標示-非商業性-相同方式分享 (CC BY-NC-SA 4.0 國際)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)** 授權釋出。

- **姓名標示**：您必須註明作者名稱與作品來源（Made by 阿剛老師 ｜ 溪洲魔法生態學院）。
- **非商業性**：您不得將本作品用於商業營利用途。
- **相同方式分享**：若您修改、變更或依本作品建立新作品，必須採用相同的授權釋出。

**Made by [阿剛老師](https://kentxchang.blogspot.tw)** ｜ **溪洲魔法生態學院**
