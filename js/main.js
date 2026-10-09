/**
 * 跨載具自適應等比例縮放引擎 (ViewportScaler)
 * 解決學生使用平板 (iPad/Android) 與不同長寬比螢幕時高度不足、下方按鈕遭切割遮蔽問題
 */
const ViewportScaler = {
  BASE_HEIGHT: 720,
  currentScale: 1,
  currentWidth: 1280,
  isInputFocused: false,
  lastVw: 0,
  lastVh: 0,

  init() {
    this.stage = document.getElementById("game-stage");
    this.hintPill = document.getElementById("orientation-hint-pill");
    if (!this.stage) return;

    this.updateScale(true);

    // 監聽螢幕旋轉與視窗變化
    window.addEventListener("resize", () => this.handleResize());
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.updateScale(true), 200);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => this.handleResize());
    }

    // 鍵盤輸入專屬防縮小保護：當任何 input/textarea 獲得 focus 時，鎖定視窗縮放
    document.addEventListener("focusin", (e) => {
      if (this.isInputField(e.target)) {
        this.isInputFocused = true;
      }
    });

    document.addEventListener("focusout", (e) => {
      if (this.isInputField(e.target)) {
        this.isInputFocused = false;
        // 等鍵盤平滑收起後再還原縮放
        setTimeout(() => {
          if (!this.isInputFocused) {
            this.updateScale(true);
          }
        }, 250);
      }
    });

    // 關閉直向旋轉提示按鈕
    const closeBtn = this.hintPill?.querySelector(".hint-close-btn");
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hintPill?.classList.add("hidden");
    });
    this.hintPill?.addEventListener("click", () => {
      this.hintPill?.classList.add("hidden");
    });
  },

  isInputField(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  },

  handleResize() {
    // 若學生正在輸入姓名/座號，或虛擬鍵盤正彈出中，絕對不縮小遊戲舞台！
    if (this.isInputFocused || this.isInputField(document.activeElement)) {
      return;
    }
    this.updateScale();
  },

  updateScale(force = false) {
    if (!this.stage) {
      this.stage = document.getElementById("game-stage");
      if (!this.stage) return;
    }
    const appEl = document.getElementById("game-app");

    // 若輸入中且非旋轉螢幕，保持當前比例，絕不讓文字縮小！
    if (!force && (this.isInputFocused || this.isInputField(document.activeElement))) {
      return;
    }

    // 優先取得 visualViewport 防止行動瀏覽器虛擬鍵盤或網址列伸縮干擾
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    if (!vw || !vh) return;

    // 虛擬鍵盤特徵判定：寬度幾乎不變，但高度大幅縮水超過 120px，判定為鍵盤彈出，跳過縮放
    if (!force && this.lastVw && Math.abs(vw - this.lastVw) < 40 && this.lastVh && (this.lastVh - vh) > 120) {
      return;
    }

    this.lastVw = vw;
    this.lastVh = vh;

    // 將外層容器固定為當前視覺視窗大小，解決行動版/平板 Chrome 100vh 覆蓋底欄造成置中偏下的問題
    if (appEl) {
      appEl.style.height = `${vh}px`;
      appEl.style.width = `${vw}px`;
    }

    // 平板與不同螢幕長寬比自動適應 (保留安全緩衝區，杜絕底部邊界溢出與裁切)
    const safeHeight = Math.max(300, vh - 8);
    const safeWidth = Math.max(320, vw - 8);

    let scale;
    let stageWidth;

    if (vw >= vh) {
      // 橫向模式 (平板、筆電、桌機)
      const heightScale = safeHeight / this.BASE_HEIGHT;
      stageWidth = Math.max(1080, Math.round(safeWidth / heightScale));
      scale = Math.min(heightScale, safeWidth / stageWidth);
    } else {
      // 直向模式 (手機或平板直持)
      stageWidth = 1080;
      scale = Math.min(safeWidth / stageWidth, safeHeight / this.BASE_HEIGHT);
    }

    this.currentScale = scale;
    this.currentWidth = stageWidth;

    // 套用樣式與 CSS 變數 (搭配 absolute top:50% left:50% 進行中心縮放)
    this.stage.style.width = `${stageWidth}px`;
    this.stage.style.height = `${this.BASE_HEIGHT}px`;
    this.stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    document.documentElement.style.setProperty("--stage-scale", scale.toString());
    document.documentElement.style.setProperty("--stage-width", `${stageWidth}px`);

    // 行動直向螢幕提示 (高大於寬且寬度小於 850px 時提示橫向旋轉)
    if (this.hintPill) {
      if (vh > vw && vw < 850) {
        this.hintPill.classList.remove("hidden");
      } else {
        this.hintPill.classList.add("hidden");
      }
    }
  },

  getScale() {
    return this.currentScale || 1;
  },

  getStageWidth() {
    return this.currentWidth || 1280;
  }
};
window.ViewportScaler = ViewportScaler;

document.addEventListener("DOMContentLoaded", async () => {
  // 0. 初始化視窗等比例縮放引擎
  ViewportScaler.init();

  // 1. 初始化資料
  await DataManager.loadConfig();
  await DataManager.loadExams();
  await DataManager.loadQuestionBanks();

  // 2. 初始化子系統
  BattleManager.init();
  AdminManager.init();

  // 3. 設定主選單入口
  setupPortalNavigation();
  renderHeroSelectionGrid();
  populateExamSelect();
  setupGlobalControls();

  // 4. URL 參數支援快速預覽或直通戰鬥 (例如 ?battle=0)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("battle")) {
    const stage = parseInt(urlParams.get("battle") || "0", 10);
    DataManager.state.studentName = "黑金小勇者";
    DataManager.state.selectedExamId = urlParams.get("exam") || "exam_compost_101";
    DataManager.state.score = 0;
    DataManager.state.potions = { heal: 2, mana: 2 };
    document.getElementById("start-screen")?.classList.add("hidden");
    document.getElementById("worldmap-screen")?.classList.add("hidden");
    document.getElementById("battle-screen")?.classList.remove("hidden");
    BattleManager.startBattle(stage);
    if (urlParams.get("pop") === "skill") {
      BattleManager.toggleSkillPopover(true);
    } else if (urlParams.get("pop") === "item") {
      BattleManager.toggleItemPopover(true);
    }
  } else if (urlParams.has("map")) {
    DataManager.state.studentName = "黑金小勇者";
    DataManager.state.selectedExamId = urlParams.get("exam") || "exam_compost_101";
    document.getElementById("start-screen")?.classList.add("hidden");
    document.getElementById("worldmap-screen")?.classList.remove("hidden");
    WorldMapManager.init();
  }

  console.log("🌟 《黑金魔法術─永續食物循環系統》已準備就緒！");
});

// 設定入口分流切換
function setupPortalNavigation() {
  const portalView = document.getElementById("start-portal-view");
  const setupView = document.getElementById("start-setup-view");

  // 進入遊戲按鈕 -> 展開角色整備
  document.getElementById("btn-portal-enter-game")?.addEventListener("click", () => {
    AudioManager.unlockAudio();
    AudioManager.playClick();
    portalView?.classList.add("hidden");
    setupView?.classList.remove("hidden");
  });

  // 教師/管理者題庫後台 -> 開啟後台 Modal
  document.getElementById("btn-portal-open-admin")?.addEventListener("click", () => {
    AudioManager.unlockAudio();
    AudioManager.playClick();
    document.getElementById("admin-modal")?.classList.remove("hidden");
  });

  // 返回主選單
  document.getElementById("btn-setup-back-to-portal")?.addEventListener("click", () => {
    AudioManager.playClick();
    setupView?.classList.add("hidden");
    portalView?.classList.remove("hidden");
  });

  // 展開冒險 (進入大地圖)
  document.getElementById("btn-start-game")?.addEventListener("click", () => {
    const nameInput = document.getElementById("student-name-input");
    const name = nameInput?.value.trim();
    if (!name) {
      alert("請先輸入您的姓名或座號！例如：60105王小明");
      nameInput?.focus();
      return;
    }

    const examSelect = document.getElementById("exam-select");
    const examId = examSelect?.value;
    if (!examId) {
      alert("請選擇要挑戰的主題測驗！");
      return;
    }

    AudioManager.unlockAudio();
    AudioManager.playClick();
    AudioManager.playMapBgm();

    DataManager.state.studentName = name;
    DataManager.state.selectedExamId = examId;
    DataManager.state.score = 0;
    DataManager.state.unlockedStages = [0];
    DataManager.state.currentStageIndex = 0;
    DataManager.state.potions = { heal: 2, mana: 2 };
    DataManager.state.allGameAnswers = [];

    // 切換至大地圖
    document.getElementById("start-screen")?.classList.add("hidden");
    document.getElementById("worldmap-screen")?.classList.remove("hidden");

    WorldMapManager.init();
  });
}

// 渲染四大守護勇者選擇卡片
function renderHeroSelectionGrid() {
  const grid = document.getElementById("hero-selection-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const heroes = DataManager.config?.heroesConfig || {};
  const heroKeys = ["hero_purple", "hero_round", "hero_syl", "hero_mul"];

  heroKeys.forEach((key) => {
    const hero = heroes[key];
    if (!hero) return;

    const card = document.createElement("div");
    card.className = `hero-card-select ${DataManager.state.selectedHeroKey === key ? "selected" : ""}`;
    card.dataset.heroKey = key;

    const avatarFilename = key === "hero_round" ? "avatar_round.png" :
                           key === "hero_syl" ? "avatar_syl.png" :
                           key === "hero_mul" ? "avatar_mul.png" : "avatar_purple.png";

    const avatarUrl = DataManager.resolveImageUrl(avatarFilename, `assets/images/${avatarFilename}`);

    card.innerHTML = `
      <img src="${avatarUrl}" alt="${hero.name}" class="hero-select-avatar">
      <div class="hero-select-name">${hero.name}</div>
      <div class="hero-select-role">${hero.title}</div>
    `;

    card.addEventListener("click", () => {
      AudioManager.unlockAudio();
      AudioManager.playClick();
      document.querySelectorAll(".hero-card-select").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      DataManager.state.selectedHeroKey = key;
      updateHeroSummary(key);
    });

    grid.appendChild(card);
  });

  updateHeroSummary(DataManager.state.selectedHeroKey || "hero_purple");
}

function updateHeroSummary(key) {
  const hero = DataManager.config?.heroesConfig?.[key];
  if (!hero) return;

  const rhymeEl = document.getElementById("selected-hero-rhyme");
  if (rhymeEl) rhymeEl.textContent = `口訣：${hero.rhyme || ""}`;

  const summaryEl = document.getElementById("hero-detail-summary");
  if (summaryEl) {
    const s1 = hero.skills?.skill1?.name || "特技一";
    const s2 = hero.skills?.skill2?.name || "特技二";
    const s3 = hero.skills?.skill3?.name || "特技三";
    summaryEl.innerHTML = `
      <div><strong>【${hero.fullName}】</strong>：${hero.desc}</div>
      <div style="margin-top: 3px; color: #fde047;">
        ⚔️ 數值：HP ${hero.hp} ｜ MP ${hero.mp} ｜ 基礎攻 ${hero.atk} ｜ 減傷 ${hero.dmgReduction}%
      </div>
      <div style="margin-top: 2px; color: #a7f3d0;">
        ✨ 專屬特技：${s1} (暴擊) ｜ ${s2} (回復) ｜ ${s3} (透視)
      </div>
    `;
  }
}

// 填充測驗下拉選單
function populateExamSelect() {
  const select = document.getElementById("exam-select");
  const hint = document.getElementById("exam-info-hint");
  if (!select) return;

  const exams = (DataManager.exams || []).filter((e) => e.enabled !== false);
  select.innerHTML = "";

  if (exams.length === 0) {
    select.innerHTML = `<option value="">尚無啟用之主題測驗，請洽老師於後台派送</option>`;
    return;
  }

  exams.forEach((ex) => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = `${ex.title} (${ex.category || "主題測驗"})`;
    select.appendChild(opt);
  });

  const updateHint = () => {
    const selectedEx = exams.find((e) => e.id === select.value);
    if (hint && selectedEx) {
      hint.textContent = `任務說明：${selectedEx.desc || "完成 5 關挑戰，守護永續循環！"}`;
    }
  };

  select.addEventListener("change", updateHint);
  updateHint();
}

// 大地圖頂部按鈕
function setupGlobalControls() {
  // 音效切換按鈕
  document.getElementById("btn-toggle-sound")?.addEventListener("click", () => {
    AudioManager.unlockAudio();
    const isOn = AudioManager.toggleSound();
    const btn = document.getElementById("btn-toggle-sound");
    if (btn) btn.textContent = isOn ? "🔊 音效開啟" : "🔇 靜音模式";
  });

  // 大地圖管理按鈕
  document.getElementById("btn-map-admin")?.addEventListener("click", () => {
    AudioManager.playClick();
    document.getElementById("admin-modal")?.classList.remove("hidden");
  });

  // 全域全螢幕切換按鈕 (適合平板與教室大螢幕)
  const fsBtn = document.getElementById("btn-global-fullscreen");
  if (fsBtn) {
    const updateFsBtnText = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      fsBtn.innerHTML = isFs ? "<span>✕</span> 退出全螢幕" : "<span>⛶</span> 全螢幕";
    };

    fsBtn.addEventListener("click", () => {
      AudioManager.playClick();
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const root = document.documentElement;
        if (root.requestFullscreen) root.requestFullscreen();
        else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    });

    document.addEventListener("fullscreenchange", updateFsBtnText);
    document.addEventListener("webkitfullscreenchange", updateFsBtnText);
  }

  // 返回主選單
  document.getElementById("btn-map-to-title")?.addEventListener("click", () => {
    AudioManager.playClick();
    AudioManager.stopBgm();
    document.getElementById("worldmap-screen")?.classList.add("hidden");
    document.getElementById("start-screen")?.classList.remove("hidden");
    document.getElementById("start-portal-view")?.classList.remove("hidden");
    document.getElementById("start-setup-view")?.classList.add("hidden");
  });
}
