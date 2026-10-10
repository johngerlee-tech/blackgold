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
6. **⚡ 全面載入極速最佳化（WebP 高畫質瘦身 84% + 漸進式智慧背景預載）**：
   - **資產瘦身 84%**：全套 20 張遊戲美術圖檔全面採用現代高效 WebP 格式，並完成頭像與立繪最佳解析度映射。首頁首屏載入量從 **6.7 MB 驟減至 228 KB（減少 96.6%）**，全套資產從 22.4 MB 降至 3.8 MB。
   - **智慧背景預載 (`ProgressiveAssetPreloader`)**：首頁 0.3 秒極速秒開後，前端利用瀏覽器閒置非同步佇列於背景依序預載世界地圖與關卡試煉魔王，玩家點擊進入關卡時「零等待、零卡頓、零閃爍」。
   - **教師後台自動畫布壓縮**：教師上傳自訂換膚圖片時，前端自動透過 HTML5 Canvas 智慧壓縮至適配規格並產出 WebP，杜絕數 MB 大圖拖慢學生端與防止 Google Firebase Firestore 單份文檔 1MB 寫入限制超標。
   - **快取機制現代化**：移除舊版阻斷快取 Meta 標籤，改採靜態資源長效快取與版本標籤（`?v=...`），全班載具再次開啟秒速載入。


## 🎯 教師 / 管理者題庫後台功能詳解

點擊主畫面首頁或大地圖左上角的 **「⚙️ 教師 / 管理者題庫後台」** 按鈕，輸入預設密碼，即可進入全方位管理後台（登入後可隨時點擊右上角「🔐 修改管理密碼」更新並寫入資料庫）。後台共包含七大模組：

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
