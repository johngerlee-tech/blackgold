/**
 * ============================================================================
 * 《黑金魔法術─永續食物循環系統》- 遊戲資料管理與 Firebase 雲端/本機同步引擎 (data.js)
 * ============================================================================
 * 支援雙軌資料持久化：
 * 1. 優先使用 Firebase Firestore 雲端資料庫（全班跨裝置/跨網路即時同步）
 * 2. 自動平滑降級至本機 API 或 Game-data/ 靜態 JSON 檔案與 localStorage（離線與本機模式）
 */

const DataManager = (function () {
  // 全域狀態物件
  const state = {
    studentName: "",
    selectedHeroKey: "hero_purple",
    selectedExamId: "",
    currentStageIndex: 0,
    unlockedStages: [0],
    score: 0,
    level: 1,
    potions: { heal: 2, mana: 2 },
    currentHp: 100,
    currentMp: 60,
    activeHero: null,
    activeBoss: null,
    currentExamQuestions: [],
    stageAnswers: [],
    allGameAnswers: [],
  };

  // 快取設定與題庫
  let configCache = null;
  let examsCache = [];
  let banksCache = [];
  let recordsCache = [];

  // API 呼叫包裝 (支援後端 API 與本機 Game-data 靜態降級回退)
  async function apiFetch(endpoint, options = {}) {
    try {
      const res = await fetch(endpoint, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      // 降級回退：若無後端伺服器（如部署在 GitHub Pages），讀取本機 Game-data/ 靜態 JSON 檔案
      const fallbackMap = {
        "/api/config": "Game-data/config.json",
        "/api/exams": "Game-data/exams.json",
        "/api/question-banks": "Game-data/question_banks.json",
        "/api/student-records": "Game-data/student_records.json",
      };
      if (!options.method || options.method === "GET") {
        const fallbackFile = fallbackMap[endpoint];
        if (fallbackFile) {
          try {
            const fbRes = await fetch(fallbackFile);
            if (fbRes.ok) {
              return await fbRes.json();
            }
          } catch (e) {
            // 忽略靜態讀取錯誤
          }
        }
      }
      return null;
    }
  }

  // 1. 讀取全域遊戲設定與英雄數值
  async function loadConfig() {
    // 雲端軌道：優先嘗試 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        const fbConfig = await FirebaseService.loadConfig();
        if (fbConfig && fbConfig.heroesConfig) {
          configCache = fbConfig;
          return configCache;
        }
      } catch (e) {
        console.warn("[DataManager] Firebase 讀取 config 失敗，降級本地:", e);
      }
    }

    // 本機軌道：API 或靜態 JSON
    const data = await apiFetch("/api/config");
    if (data) {
      configCache = data;
      // 若 Firebase 已連線但尚無設定，自動初始化寫入 Firebase
      if (window.FirebaseService && FirebaseService.isAvailable() && (!configCache || !configCache._synced)) {
        FirebaseService.saveConfig(configCache).catch(() => {});
      }
    } else if (!configCache) {
      // 內建安全預設數值 (極限備援)
      configCache = {
        adminPassword: "j63514219",
        adminPasswordHash: "4f982b0f097f1461dcce7bfbc921813224743fb998d8644f69627eb5db3c0d1f",
        randomizeOptions: true,
        soundEnabled: true,
        customImages: {},
        heroesConfig: {
          hero_purple: {
            name: "莫莫",
            fullName: "黑金魔法師 · 莫莫 Momo",
            title: "黑金魔法師",
            rhyme: "落葉果皮變黑金，微生物是好幫手",
            attackName: "落葉腐植魔彈",
            desc: "溪洲魔法生態學院首席導師，精通微生物分解魔法，擅長將廢棄落葉與生廚餘轉化為黑色黃金。",
            hp: 100, mp: 60, atk: 35, critRate: 15, critMult: 2.2, dmgReduction: 10,
            skills: {
              skill1: { name: "落葉腐植聚爆", cost: 15, mult: 2.2, desc: "凝聚落葉發酵魔力，造成 2.2 倍暴擊傷害！" },
              skill2: { name: "微生菌絲滋養", cost: 10, heal: 45, mana: 10, desc: "召喚有益微生菌群，回復 45 HP 並回充 10 MP！" },
              skill3: { name: "堆肥魔眼透視", cost: 20, removeCount: 2, desc: "洞察題目迷思，立即排除 2 個錯誤干擾選項！" }
            }
          },
          hero_round: {
            name: "寇寇",
            fullName: "堆肥小勇士 · 寇寇 Koko",
            title: "翻堆大地聖騎",
            rhyme: "勤翻堆又保通氣，土壤鬆軟根鬚壯",
            attackName: "耕耘金鏟重擊",
            desc: "熱情愛地球的小勇士，手持魔法翻堆金鏟與通氣重盾，體力充沛，守護大地生態與健康菜園。",
            hp: 130, mp: 40, atk: 30, critRate: 10, critMult: 1.8, dmgReduction: 25,
            skills: {
              skill1: { name: "金鏟破土狂擊", cost: 15, mult: 2.0, desc: "揮動耕耘金鏟奮力翻土，造成 2.0 倍堅定破土傷害！" },
              skill2: { name: "沃土大地壁壘", cost: 10, heal: 55, mana: 5, desc: "引導黑金沃土之靈，答對大幅回復 55 HP！" },
              skill3: { name: "通氣翻堆明晰", cost: 20, removeCount: 2, desc: "翻動堆肥通入空氣，迅速排除 2 個錯誤選項！" }
            }
          },
          hero_syl: {
            name: "露露",
            fullName: "分類精靈 · 露露 Lulu",
            title: "源頭守護精靈",
            rhyme: "生熟廚餘分清楚，塑膠雜物不准進",
            attackName: "雙葉分流疾刺",
            desc: "靈巧活潑的分類精靈，擁有明察秋毫的雙眼，一眼看穿混在廚餘裡的塑膠與雜物，捍衛純淨循環。",
            hp: 90, mp: 70, atk: 42, critRate: 25, critMult: 2.5, dmgReduction: 5,
            skills: {
              skill1: { name: "源頭破邪雙刺", cost: 18, mult: 2.5, desc: "發動雙葉極速迴旋突刺，造成 2.5 倍極高破防傷害！" },
              skill2: { name: "純淨泉源甘露", cost: 12, heal: 40, mana: 15, desc: "灑下無污染之純淨甘露，回復 40 HP 與 15 MP！" },
              skill3: { name: "精靈明眸洞察", cost: 20, removeCount: 2, desc: "精準識破非廚餘異物，立即排除 2 個錯誤干擾選項！" }
            }
          },
          hero_mul: {
            name: "嘟嘟",
            fullName: "熟食巡守俠 · 嘟嘟 Dudu",
            title: "熟廚餘循環大使",
            rhyme: "熟飯菜湯要瀝乾，豬豬飽餐力氣大",
            attackName: "大胃元氣衝撞",
            desc: "豬豬大胃王巡守使，最愛瀝乾後的美味熟飯菜，將剩飯剩菜循環為健康成長的元氣力量！",
            hp: 115, mp: 45, atk: 38, critRate: 18, critMult: 2.0, dmgReduction: 15,
            skills: {
              skill1: { name: "豬豬飽食暴擊", cost: 15, mult: 2.3, desc: "飽餐熟廚餘後的元氣爆發，造成 2.3 倍猛烈衝擊！" },
              skill2: { name: "美味熟食飽餐", cost: 10, heal: 50, mana: 8, desc: "享受瀝乾後的營養美食，瞬間回復 50 HP！" },
              skill3: { name: "大胃直覺嗅探", cost: 20, removeCount: 2, desc: "憑藉靈敏食慾嗅覺，精準排除 2 個錯誤選項！" }
            }
          }
        },
        bossesConfig: [
          { chapterIndex: 0, chapterTitle: "第一章：學院惜食大廳", enemyName: "浪費剩食怪", hp: 100, atk: 12, attackInterval: 5.5, desc: "吃不完飯菜凝聚的黏稠巨魔，考驗餐桌惜食與源頭減量智慧！" },
          { chapterIndex: 1, chapterTitle: "第二章：中央分類迴廊", enemyName: "混雜垃圾魔", hp: 140, atk: 16, attackInterval: 5.0, desc: "塑膠雜物纏繞的破壞者，考驗生廚餘、熟廚餘與一般垃圾的精準分類！" },
          { chapterIndex: 2, chapterTitle: "第三章：黑金發酵溫室", enemyName: "惡臭果蠅王", hp: 180, atk: 20, attackInterval: 4.8, desc: "堆肥太濕引來的飛蟲魔王，考驗碳氮比例平衡、瀝乾與翻堆技巧！" },
          { chapterIndex: 3, chapterTitle: "第四章：陽光有機菜園", enemyName: "板結枯土巨魔", hp: 220, atk: 24, attackInterval: 4.5, desc: "缺乏有機質的板結石怪，考驗以熟成黑金堆肥改良土壤的能力！" },
          { chapterIndex: 4, chapterTitle: "第五章：永續生命神殿", enemyName: "失衡異變巨神", hp: 280, atk: 28, attackInterval: 4.0, desc: "串聯土地到餐桌的永續食物循環，成就黑金奇蹟！" }
        ]
      };
    }
    return configCache;
  }

  // 2. 讀取主題測驗清單
  async function loadExams() {
    // 優先使用 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        const fbExams = await FirebaseService.loadExams();
        if (fbExams && Array.isArray(fbExams) && fbExams.length > 0) {
          examsCache = fbExams;
          return examsCache;
        }
      } catch (e) {
        console.warn("[DataManager] Firebase 讀取 exams 失敗:", e);
      }
    }

    const data = await apiFetch("/api/exams");
    if (data && Array.isArray(data)) {
      examsCache = data;
      // 若 Firebase 空白，自動同步
      if (window.FirebaseService && FirebaseService.isAvailable()) {
        FirebaseService.saveExams(examsCache).catch(() => {});
      }
    }
    return examsCache;
  }

  // 3. 讀取題庫分組清單
  async function loadQuestionBanks() {
    // 優先使用 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        const fbBanks = await FirebaseService.loadQuestionBanks();
        if (fbBanks && Array.isArray(fbBanks) && fbBanks.length > 0) {
          banksCache = fbBanks;
          return banksCache;
        }
      } catch (e) {
        console.warn("[DataManager] Firebase 讀取 banks 失敗:", e);
      }
    }

    const data = await apiFetch("/api/question-banks");
    if (data && Array.isArray(data)) {
      banksCache = data;
      // 若 Firebase 空白，自動同步
      if (window.FirebaseService && FirebaseService.isAvailable()) {
        FirebaseService.saveQuestionBanks(banksCache).catch(() => {});
      }
    }
    return banksCache;
  }

  // 4. 讀取學生作答紀錄
  async function loadStudentRecords() {
    // 優先使用 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        const fbRecords = await FirebaseService.loadStudentRecords();
        if (fbRecords && Array.isArray(fbRecords)) {
          recordsCache = fbRecords;
          return recordsCache;
        }
      } catch (e) {
        console.warn("[DataManager] Firebase 讀取 records 失敗:", e);
      }
    }

    // 本地 API 或 localStorage 備援
    const data = await apiFetch("/api/student-records");
    if (data && Array.isArray(data)) {
      recordsCache = data;
    } else {
      try {
        const local = JSON.parse(localStorage.getItem("blackgold_student_records") || "[]");
        if (local && Array.isArray(local)) {
          recordsCache = local;
        }
      } catch (e) {}
    }
    return recordsCache;
  }

  // 5. 儲存學生作答紀錄 (高可靠度寫入)
  async function saveRecord(record) {
    record.id = record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    record.completedAt = record.completedAt || new Date().toISOString();
    recordsCache.unshift(record);

    // 1. 同步保存至本地瀏覽器 localStorage 作為雙重防護
    try {
      const local = JSON.parse(localStorage.getItem("blackgold_student_records") || "[]");
      local.unshift(record);
      localStorage.setItem("blackgold_student_records", JSON.stringify(local.slice(0, 300)));
    } catch (e) {}

    // 2. 雲端同步：若已設定 Firebase，即時寫入 Firestore
    let fbSuccess = false;
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        await FirebaseService.addStudentRecord(record);
        fbSuccess = true;
      } catch (e) {
        console.warn("[DataManager] 儲存紀錄至 Firebase 失敗:", e);
      }
    }

    // 3. 嘗試呼叫本機 Python 伺服器 (若處於本機開發/區網模式)
    try {
      await apiFetch("/api/student-records", {
        method: "POST",
        body: JSON.stringify(record),
      });
    } catch (e) {}

    return record;
  }

  // 6. 刪除學生作答紀錄
  async function deleteRecord(params) {
    // 雲端刪除
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        if (params.all) {
          await FirebaseService.clearAllStudentRecords();
        } else if (params.id) {
          await FirebaseService.deleteStudentRecord(params.id);
        }
      } catch (e) {
        console.warn("[DataManager] Firebase 刪除失敗:", e);
      }
    }

    // 本地 localStorage 清除
    try {
      if (params.all) {
        localStorage.removeItem("blackgold_student_records");
      } else if (params.id) {
        const local = JSON.parse(localStorage.getItem("blackgold_student_records") || "[]");
        const filtered = local.filter((r) => r.id !== params.id);
        localStorage.setItem("blackgold_student_records", JSON.stringify(filtered));
      }
    } catch (e) {}

    // 本地伺服器 API 刪除
    const res = await apiFetch("/api/student-records/delete", {
      method: "POST",
      body: JSON.stringify(params),
    });

    await loadStudentRecords();
    return res || { success: true };
  }

  // 7. 圖片智慧解析 (優先使用高效率 WebP 格式，並完整支援自訂圖片與雙向智慧回退)
  function resolveImageUrl(filename, defaultPath) {
    // 預設將路徑轉換為高畫質極度輕量化之 .webp 格式
    const webpFallback = (defaultPath || `assets/images/${filename}`).replace(/\.(png|jpg|jpeg)$/i, ".webp");
    if (!configCache) return webpFallback;

    const customImages = configCache.customImages || {};

    // 1. 若該檔名有自訂圖片
    const customVal = customImages[filename];
    if (customVal) {
      // 若舊版設定殘留有指向 assets/images/custom/... 的預設重複檔，自動升級為高效 WebP
      if (typeof customVal === "string" && customVal.includes("assets/images/custom/") && customVal.includes("?t=")) {
        return webpFallback;
      }
      return customVal;
    }

    // 2. 雙向智慧回退：
    // 若要求的是全身立繪 (hero_sprite*.png)，但使用者只上傳了頭像 (avatar*.png)
    if (filename.startsWith("hero_sprite")) {
      const mappedAvatar = filename
        .replace("hero_sprite_round.png", "avatar_round.png")
        .replace("hero_sprite_syl.png", "avatar_syl.png")
        .replace("hero_sprite_mul.png", "avatar_mul.png")
        .replace("hero_sprite.png", "avatar_purple.png");
      if (customImages[mappedAvatar] && !(typeof customImages[mappedAvatar] === "string" && customImages[mappedAvatar].includes("assets/images/custom/"))) {
        return customImages[mappedAvatar];
      }
    }
    // 若要求的是頭像 (avatar*.png)，但使用者只上傳了全身立繪 (hero_sprite*.png)
    if (filename.startsWith("avatar_")) {
      const mappedSprite = filename
        .replace("avatar_round.png", "hero_sprite_round.png")
        .replace("avatar_syl.png", "hero_sprite_syl.png")
        .replace("avatar_mul.png", "hero_sprite_mul.png")
        .replace("avatar_purple.png", "hero_sprite.png");
      if (customImages[mappedSprite] && !(typeof customImages[mappedSprite] === "string" && customImages[mappedSprite].includes("assets/images/custom/"))) {
        return customImages[mappedSprite];
      }
    }

    return webpFallback;
  }

  // 8. 儲存遊戲設定
  async function saveConfig(newConfig) {
    configCache = newConfig;

    // 儲存至 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        await FirebaseService.saveConfig(newConfig);
      } catch (e) {
        console.warn("[DataManager] 儲存 config 至 Firebase 失敗:", e);
      }
    }

    // 同步儲存至本地 API
    return await apiFetch("/api/config", {
      method: "POST",
      body: JSON.stringify(newConfig),
    });
  }

  // 9. 儲存題庫組
  async function saveQuestionBanks(banks) {
    banksCache = banks;

    // 儲存至 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        await FirebaseService.saveQuestionBanks(banks);
      } catch (e) {
        console.warn("[DataManager] 儲存 banks 至 Firebase 失敗:", e);
      }
    }

    // 同步儲存至本地 API
    return await apiFetch("/api/question-banks", {
      method: "POST",
      body: JSON.stringify(banks),
    });
  }

  // 10. 儲存主題測驗
  async function saveExams(exams) {
    examsCache = exams;

    // 儲存至 Firebase Firestore
    if (window.FirebaseService && FirebaseService.isAvailable()) {
      try {
        await FirebaseService.saveExams(exams);
      } catch (e) {
        console.warn("[DataManager] 儲存 exams 至 Firebase 失敗:", e);
      }
    }

    // 同步儲存至本地 API
    return await apiFetch("/api/exams", {
      method: "POST",
      body: JSON.stringify(exams),
    });
  }

  // 11. 取得指定測驗的題庫題目清單 (隨機打亂出題)
  function getQuestionsForExam(examId) {
    const exam = examsCache.find((e) => e.id === examId);
    let pool = [];

    if (exam && exam.bankIds && exam.bankIds.length > 0) {
      exam.bankIds.forEach((bId) => {
        const bank = banksCache.find((b) => b.id === bId);
        if (bank && bank.questions) {
          pool.push(...bank.questions);
        }
      });
    }

    // 若該測驗無綁定題庫，從所有啟用中的題庫搜集
    if (pool.length === 0) {
      banksCache
        .filter((b) => b.enabled !== false)
        .forEach((b) => {
          if (b.questions) pool.push(...b.questions);
        });
    }

    // 隨機打亂題目順序 (Fisher-Yates Shuffle)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  return {
    state,
    loadConfig,
    loadExams,
    loadQuestionBanks,
    loadStudentRecords,
    saveRecord,
    deleteRecord,
    saveConfig,
    saveQuestionBanks,
    saveExams,
    getQuestionsForExam,
    resolveImageUrl,
    get config() { return configCache; },
    get exams() { return examsCache; },
    get banks() { return banksCache; },
    get records() { return recordsCache; },
  };
})();

window.DataManager = DataManager;
