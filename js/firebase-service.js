/**
 * ============================================================================
 * 《黑金魔法術─永續食物循環系統》- Firebase 雲端資料庫核心引擎 (firebase-service.js)
 * ============================================================================
 * 支援 Firebase Firestore 雲端即時同步、離線持久化快取與無伺服器 (Serverless) 運行
 */

const FirebaseService = (function () {
  const STORAGE_KEY = "blackgold_firebase_config";
  let db = null;
  let isInitialized = false;
  let initError = null;
  let activeConfig = null;

  // 1. 取得有效設定 (優先使用 localStorage 自訂設定，其次使用 window.FIREBASE_CONFIG)
  function resolveConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[Firebase] 讀取 localStorage 設定失敗:", e);
    }

    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId && window.FIREBASE_CONFIG.apiKey) {
      // 排除預設未填寫範例
      const p = window.FIREBASE_CONFIG.projectId.trim();
      const k = window.FIREBASE_CONFIG.apiKey.trim();
      if (p !== "" && k !== "" && !p.includes("YOUR_") && !k.includes("EXAMPLE")) {
        return window.FIREBASE_CONFIG;
      }
    }

    return null;
  }

  // 2. 初始化 Firebase
  function init() {
    if (isInitialized && db) return true;

    if (typeof firebase === "undefined") {
      initError = "找不到 Firebase SDK！請確認網路連線或 CDN 載入。";
      console.warn("[Firebase]", initError);
      return false;
    }

    const cfg = resolveConfig();
    if (!cfg) {
      initError = "尚未設定 Firebase 專案金鑰。";
      return false;
    }

    try {
      activeConfig = cfg;
      let app;
      if (firebase.apps && firebase.apps.length > 0) {
        app = firebase.apps[0];
      } else {
        app = firebase.initializeApp(cfg);
      }

      db = firebase.firestore(app);

      // 啟用離線快取支援 (使平板與筆電在弱網或斷網時仍能暢玩)
      try {
        db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
          if (err.code === "failed-precondition") {
            // 多分頁開啟時可能僅有一分頁可啟用持久化
          } else if (err.code === "unimplemented") {
            // 瀏覽器不支援
          }
        });
      } catch (e) {}

      isInitialized = true;
      initError = null;
      console.log("🔥 [Firebase] Firestore 雲端資料庫初始化成功！專案:", cfg.projectId);
      return true;
    } catch (err) {
      initError = err.message;
      console.error("[Firebase] 初始化失敗:", err);
      return false;
    }
  }

  // 3. 狀態查詢
  function isConfigured() {
    return Boolean(resolveConfig());
  }

  function isAvailable() {
    if (!isInitialized) init();
    return Boolean(isInitialized && db);
  }

  function getStatus() {
    return {
      configured: isConfigured(),
      available: isAvailable(),
      projectId: activeConfig?.projectId || null,
      error: initError,
      isCustomStored: Boolean(localStorage.getItem(STORAGE_KEY)),
    };
  }

  // 4. 測試連線
  async function testConnection() {
    if (!init()) {
      return { success: false, error: initError || "未設定 Firebase" };
    }
    const startTime = Date.now();
    try {
      const testRef = db.collection("settings").doc("system_status");
      await testRef.set(
        {
          lastPing: new Date().toISOString(),
          version: "2026.10.06",
          client: "RPG_Web_Client",
        },
        { merge: true }
      );
      const latency = Date.now() - startTime;
      return {
        success: true,
        projectId: activeConfig?.projectId,
        latencyMs: latency,
        message: `連線成功！延遲約 ${latency} ms`,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || "連線至 Firestore 失敗，請確認安全性規則 (Security Rules) 是否已開放。",
      };
    }
  }

  // 5. 儲存 / 清除自訂設定
  function saveConfigToStorage(configObj) {
    if (!configObj || !configObj.projectId || !configObj.apiKey) {
      throw new Error("設定必須包含 projectId 與 apiKey！");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configObj));
    // 重設狀態並嘗試初始化
    isInitialized = false;
    db = null;
    return init();
  }

  function clearConfigFromStorage() {
    localStorage.removeItem(STORAGE_KEY);
    isInitialized = false;
    db = null;
    return init();
  }

  function getStoredConfig() {
    return resolveConfig();
  }

  // =========================================================================
  // Firestore 雲端資料讀寫方法 (CRUD)
  // =========================================================================

  // 6. 全域遊戲設定 (Settings / Config)
  async function loadConfig() {
    if (!isAvailable()) return null;
    try {
      const doc = await db.collection("settings").doc("config").get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (err) {
      console.warn("[Firebase] 讀取遊戲設定失敗:", err);
      return null;
    }
  }

  async function saveConfig(cfgData) {
    if (!isAvailable()) return false;
    try {
      await db.collection("settings").doc("config").set(cfgData, { merge: true });
      return true;
    } catch (err) {
      console.error("[Firebase] 儲存遊戲設定失敗:", err);
      throw err;
    }
  }

  // 7. 主題測驗清單 (Settings / Exams)
  async function loadExams() {
    if (!isAvailable()) return null;
    try {
      const doc = await db.collection("settings").doc("exams").get();
      if (doc.exists && doc.data().list) {
        return doc.data().list;
      }
      return null;
    } catch (err) {
      console.warn("[Firebase] 讀取測驗清單失敗:", err);
      return null;
    }
  }

  async function saveExams(examsList) {
    if (!isAvailable()) return false;
    try {
      await db.collection("settings").doc("exams").set({
        list: examsList,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error("[Firebase] 儲存測驗清單失敗:", err);
      throw err;
    }
  }

  // 8. 題庫清單 (Settings / Question Banks)
  async function loadQuestionBanks() {
    if (!isAvailable()) return null;
    try {
      const doc = await db.collection("settings").doc("question_banks").get();
      if (doc.exists && doc.data().list) {
        return doc.data().list;
      }
      return null;
    } catch (err) {
      console.warn("[Firebase] 讀取題庫清單失敗:", err);
      return null;
    }
  }

  async function saveQuestionBanks(banksList) {
    if (!isAvailable()) return false;
    try {
      await db.collection("settings").doc("question_banks").set({
        list: banksList,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error("[Firebase] 儲存題庫清單失敗:", err);
      throw err;
    }
  }

  // 9. 學生作答紀錄 (Collection: student_records)
  async function loadStudentRecords(limitCount = 300) {
    if (!isAvailable()) return null;
    try {
      let snapshot;
      try {
        // 優先以完成時間降序排列
        snapshot = await db
          .collection("student_records")
          .orderBy("completedAt", "desc")
          .limit(limitCount)
          .get();
      } catch (orderErr) {
        // 若缺少索引則降級無排序讀取並在記憶體內排序
        snapshot = await db.collection("student_records").limit(limitCount).get();
      }

      const records = [];
      snapshot.forEach((d) => {
        records.push({ id: d.id, ...d.data() });
      });

      // 記憶體排序備援
      records.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
      return records;
    } catch (err) {
      console.warn("[Firebase] 讀取學生作答紀錄失敗:", err);
      return null;
    }
  }

  async function addStudentRecord(record) {
    if (!isAvailable()) return false;
    const recId = record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    record.id = recId;
    record.completedAt = record.completedAt || new Date().toISOString();

    try {
      await db.collection("student_records").doc(recId).set(record);
      return true;
    } catch (err) {
      console.error("[Firebase] 寫入學生紀錄失敗:", err);
      throw err;
    }
  }

  async function deleteStudentRecord(recordId) {
    if (!isAvailable()) return false;
    try {
      await db.collection("student_records").doc(recordId).delete();
      return true;
    } catch (err) {
      console.error("[Firebase] 刪除學生紀錄失敗:", err);
      throw err;
    }
  }

  async function clearAllStudentRecords() {
    if (!isAvailable()) return false;
    try {
      const snapshot = await db.collection("student_records").get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.error("[Firebase] 清除所有紀錄失敗:", err);
      throw err;
    }
  }

  // 10. 監聽學生紀錄變更 (Real-time Snapshot Listener)
  function listenToStudentRecords(onUpdateCallback) {
    if (!isAvailable()) return () => {};
    try {
      return db
        .collection("student_records")
        .orderBy("completedAt", "desc")
        .limit(100)
        .onSnapshot(
          (snapshot) => {
            const records = [];
            snapshot.forEach((d) => {
              records.push({ id: d.id, ...d.data() });
            });
            onUpdateCallback(records);
          },
          (err) => {
            console.warn("[Firebase] 學生紀錄即時監聽異常:", err);
          }
        );
    } catch (e) {
      return () => {};
    }
  }

  // 11. 一鍵將本地資料初始化至 Firebase (Seed Initial Data)
  async function seedInitialData(data) {
    if (!isAvailable()) {
      throw new Error("Firebase 尚未連線，無法進行初始化！");
    }
    const { config, exams, questionBanks } = data;
    const batch = db.batch();

    if (config) {
      const configRef = db.collection("settings").doc("config");
      batch.set(configRef, config, { merge: true });
    }
    if (exams && Array.isArray(exams)) {
      const examsRef = db.collection("settings").doc("exams");
      batch.set(examsRef, { list: exams, updatedAt: new Date().toISOString() });
    }
    if (questionBanks && Array.isArray(questionBanks)) {
      const banksRef = db.collection("settings").doc("question_banks");
      batch.set(banksRef, { list: questionBanks, updatedAt: new Date().toISOString() });
    }

    await batch.commit();
    return true;
  }

  // 自動嘗試初始連線
  try {
    init();
  } catch (e) {}

  return {
    init,
    isConfigured,
    isAvailable,
    getStatus,
    testConnection,
    saveConfigToStorage,
    clearConfigFromStorage,
    getStoredConfig,
    loadConfig,
    saveConfig,
    loadExams,
    saveExams,
    loadQuestionBanks,
    saveQuestionBanks,
    loadStudentRecords,
    addStudentRecord,
    deleteStudentRecord,
    clearAllStudentRecords,
    listenToStudentRecords,
    seedInitialData,
  };
})();

window.FirebaseService = FirebaseService;
