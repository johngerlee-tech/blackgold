/**
 * 《黑金魔法術─永續食物循環系統》- 戰鬥與即時答題對抗引擎 (battle.js)
 */

const BattleManager = (function () {
  let currentStageIndex = 0;
  let heroStats = null;
  let bossStats = null;
  let heroHp = 100;
  let heroMp = 60;
  let bossHp = 100;
  let bossMaxHp = 100;

  let currentQuestion = null;
  let questionPool = [];
  let questionIndex = 0;
  let currentSkillType = null; // null | 'crit' | 'heal' | 'fifty'

  let bossTimerInterval = null;
  let bossTimeTotal = 5.0; // 秒
  let bossTimeRemaining = 5.0;
  let isTimerPaused = false;
  let isAnswering = false;
  let isHeroAttacking = false;
  let isBossAttacking = false;

  // 1. 啟動戰鬥
  function startBattle(stageIdx) {
    currentStageIndex = stageIdx;
    DataManager.state.currentStageIndex = stageIdx;
    isHeroAttacking = false;
    isBossAttacking = false;

    // 播放戰鬥熱血緊張背景音樂
    AudioManager.playBattleBgm();

    const heroKey = DataManager.state.selectedHeroKey || "hero_purple";
    const heroCfg = DataManager.config?.heroesConfig?.[heroKey] || {};
    const bossCfg = (DataManager.config?.bossesConfig || [])[stageIdx] || {};
    const defaultStage = WorldMapManager.STAGES[stageIdx] || WorldMapManager.STAGES[0];

    heroStats = { ...heroCfg };
    bossStats = { ...defaultStage, ...bossCfg };
    bossStats.enemyName = (bossCfg.enemyName && bossCfg.enemyName.trim()) || defaultStage.enemyName || "守關魔物";
    bossStats.chapterTitle = (bossCfg.chapterTitle && bossCfg.chapterTitle.trim()) || defaultStage.title || "冒險章節";

    heroHp = heroStats.hp || 100;
    heroMp = heroStats.mp || 60;
    bossMaxHp = bossStats.hp || 100;
    bossHp = bossMaxHp;

    DataManager.state.currentHp = heroHp;
    DataManager.state.currentMp = heroMp;
    DataManager.state.activeHero = heroStats;
    DataManager.state.activeBoss = bossStats;

    // 準備題庫
    questionPool = DataManager.getQuestionsForExam(DataManager.state.selectedExamId);
    if (!questionPool || questionPool.length === 0) {
      questionPool = [
        {
          question: "在自然生態農耕中，被稱為「黑色黃金（黑金）」的是什麼？",
          options: ["石油原油", "完全發酵熟成的有機腐植質堆肥", "燒焦木炭粉", "黑芝麻糖粉"],
          answer: 2,
          explanation: "黑金指的是富含有機質的高品質腐植質堆肥！"
        }
      ];
    }
    questionIndex = 0;

    // 清理舊戰鬥殘留日誌與殘餘打擊特效
    const logBox = document.getElementById("battle-log-content");
    if (logBox) logBox.innerHTML = "";
    const pAnchor = document.getElementById("player-fx-anchor");
    if (pAnchor) pAnchor.innerHTML = "";
    const eAnchor = document.getElementById("enemy-fx-anchor");
    if (eAnchor) eAnchor.innerHTML = "";
    const floatLayer = document.getElementById("battle-floating-msgs");
    if (floatLayer) floatLayer.innerHTML = "";

    // 關閉任何開啟中的彈窗
    closeAllPopovers();

    // 介面渲染
    setupBattleUI(heroKey, stageIdx);
    logBattle(`[戰鬥開始] 踏入【${bossStats.chapterTitle || bossStats.title}】，迎戰守關者【${bossStats.enemyName}】！`, "log-info");

    // 啟動關主突襲定時器
    startBossTimer();

    // 需求 1：進入戰鬥預設停留在施法攻擊狀態 (直接展開題目並能作答)
    openQuiz(null);

    // 確保畫面不發生任何垂直偏移
    window.scrollTo(0, 0);
    const appWrapper = document.getElementById("game-app");
    if (appWrapper) appWrapper.scrollTop = 0;
  }

  // 2. 設定戰鬥畫面 UI
  function setupBattleUI(heroKey, stageIdx) {
    const visualContainer = document.getElementById("battle-visual-container");
    const bgFilenames = ["forest_bg.jpg", "desert_bg.jpg", "river_bg.jpg", "highway_bg.jpg", "sacred_bg.jpg"];
    const bgFilename = bgFilenames[stageIdx] || "forest_bg.jpg";
    if (visualContainer) {
      const bgUrl = DataManager.resolveImageUrl(bgFilename, `assets/images/${bgFilename}`);
      visualContainer.style.backgroundImage = `url('${bgUrl}')`;
    }

    // 角色立繪與頭像
    const heroSpriteMap = {
      hero_purple: "hero_sprite.png",
      hero_round: "hero_sprite_round.png",
      hero_syl: "hero_sprite_syl.png",
      hero_mul: "hero_sprite_mul.png",
    };
    const heroAvatarMap = {
      hero_purple: "avatar_purple.png",
      hero_round: "avatar_round.png",
      hero_syl: "avatar_syl.png",
      hero_mul: "avatar_mul.png",
    };
    const bossSpriteMap = ["slime_sprite.png", "mirage_sprite.png", "demon_sprite.png", "frost_sprite.png", "boss_sprite.png"];

    const playerSpriteImg = document.getElementById("player-battle-sprite-img");
    if (playerSpriteImg) {
      const sf = heroSpriteMap[heroKey] || "hero_sprite.png";
      playerSpriteImg.src = DataManager.resolveImageUrl(sf, `assets/images/${sf}`);
    }

    const enemySpriteImg = document.getElementById("enemy-sprite-img");
    if (enemySpriteImg) {
      const bf = bossSpriteMap[stageIdx] || "slime_sprite.png";
      enemySpriteImg.src = DataManager.resolveImageUrl(bf, `assets/images/${bf}`);
    }

    const hudAvatarImg = document.getElementById("player-hud-avatar-img");
    if (hudAvatarImg) {
      const af = heroAvatarMap[heroKey] || "avatar_purple.png";
      hudAvatarImg.src = DataManager.resolveImageUrl(af, `assets/images/${af}`);
    }

    // 確保角色立繪帶有閃亮發光微光 Aura
    const playerSpriteContainer = document.getElementById("player-battle-sprite-container");
    if (playerSpriteContainer) {
      playerSpriteContainer.classList.add("anim-hero-aura");
    }
    const enemySpriteContainer = document.getElementById("enemy-sprite-container");
    if (enemySpriteContainer) {
      enemySpriteContainer.classList.add("anim-boss-aura");
    }

    // 文字資訊
    const topHeroName = document.getElementById("top-hero-name");
    if (topHeroName) topHeroName.textContent = heroStats.name || "黑金勇者";

    const playerHudName = document.getElementById("player-hud-name");
    if (playerHudName) playerHudName.textContent = heroStats.fullName || heroStats.name;

    const enemyName = document.getElementById("enemy-name");
    if (enemyName) enemyName.textContent = bossStats.enemyName || "守關魔物";

    const chapterIndicator = document.getElementById("chapter-indicator");
    if (chapterIndicator) chapterIndicator.textContent = bossStats.chapterTitle || bossStats.title;

    // 需求 2：更新頂部對決 VS 雙方名稱 (勇者名稱 VS 關主名稱)
    const vsHeroEl = document.getElementById("versus-hero-name");
    if (vsHeroEl) vsHeroEl.textContent = heroStats.name || "黑金勇者";
    const vsBossEl = document.getElementById("versus-boss-name");
    if (vsBossEl) vsBossEl.textContent = bossStats.enemyName || "守關魔物";

    // 安全更新技能 Popover 按鈕文字
    const s1 = heroStats.skills?.skill1;
    const s2 = heroStats.skills?.skill2;
    const s3 = heroStats.skills?.skill3;
    const btnCrit = document.getElementById("btn-pop-skill-crit") || document.getElementById("btn-skill-crit");
    if (btnCrit && s1) {
      btnCrit.innerHTML = `<span>💥 ${s1.name} (造成 ${s1.mult} 倍暴擊)</span> <span class="cost-tag">${s1.cost} MP</span>`;
    }
    const btnHeal = document.getElementById("btn-pop-skill-heal") || document.getElementById("btn-skill-heal");
    if (btnHeal && s2) {
      btnHeal.innerHTML = `<span>🌿 ${s2.name} (回復 ${s2.heal} 血量)</span> <span class="cost-tag">${s2.cost} MP</span>`;
    }
    const btnFifty = document.getElementById("btn-pop-skill-fifty") || document.getElementById("btn-skill-fifty");
    if (btnFifty && s3) {
      btnFifty.innerHTML = `<span>👁️ ${s3.name} (排除 ${s3.removeCount} 個錯誤選項)</span> <span class="cost-tag">${s3.cost} MP</span>`;
    }

    updateBars();
  }

  // 3. 更新血條與魔力條
  function updateBars() {
    const heroHpPct = Math.max(0, Math.min(100, (heroHp / (heroStats.hp || 100)) * 100));
    const heroMpPct = Math.max(0, Math.min(100, (heroMp / (heroStats.mp || 60)) * 100));
    const bossHpPct = Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100));

    // 頂部 HUD (血量)
    const topHeroBar = document.getElementById("top-hero-hp-bar");
    if (topHeroBar) topHeroBar.style.width = `${heroHpPct}%`;
    const topHeroText = document.getElementById("top-hero-hp-text");
    if (topHeroText) topHeroText.textContent = `${Math.ceil(heroHp)} / ${heroStats.hp}`;

    const enemyHpBar = document.getElementById("enemy-hp-bar");
    if (enemyHpBar) enemyHpBar.style.width = `${bossHpPct}%`;
    const enemyHpText = document.getElementById("enemy-hp-text");
    if (enemyHpText) enemyHpText.textContent = `${Math.ceil(bossHp)} / ${bossMaxHp}`;

    // 下方主角卡片
    const playerHpBar = document.getElementById("player-hp-bar");
    if (playerHpBar) playerHpBar.style.width = `${heroHpPct}%`;
    const playerHpText = document.getElementById("player-hp-text");
    if (playerHpText) playerHpText.textContent = `${Math.ceil(heroHp)} / ${heroStats.hp}`;

    const playerMpBar = document.getElementById("player-mp-bar");
    if (playerMpBar) playerMpBar.style.width = `${heroMpPct}%`;
    const playerMpText = document.getElementById("player-mp-text");
    if (playerMpText) playerMpText.textContent = `${Math.ceil(heroMp)} / ${heroStats.mp}`;

    const scoreEl = document.getElementById("player-score");
    if (scoreEl) scoreEl.textContent = DataManager.state.score || 0;

    const potHealEl = document.getElementById("potion-heal-count");
    if (potHealEl) potHealEl.textContent = DataManager.state.potions.heal;
    const potManaEl = document.getElementById("potion-mana-count");
    if (potManaEl) potManaEl.textContent = DataManager.state.potions.mana;

    // Popover 道具庫存標籤
    const popHealStock = document.getElementById("pop-heal-stock");
    if (popHealStock) popHealStock.textContent = `剩餘: ${DataManager.state.potions.heal}`;
    const popManaStock = document.getElementById("pop-mana-stock");
    if (popManaStock) popManaStock.textContent = `剩餘: ${DataManager.state.potions.mana}`;
  }

  // 4. 魔王定時突襲計時器 (秒數動態進度條)
  function startBossTimer() {
    stopBossTimer();
    bossTimeTotal = parseFloat(bossStats.attackInterval) || 5.0;
    bossTimeRemaining = bossTimeTotal;
    isTimerPaused = false;

    updateTimerDisplay();

    bossTimerInterval = setInterval(() => {
      if (isTimerPaused || isAnswering === false) {
        // 若戰鬥已結束或非答題中，可暫停
      }

      bossTimeRemaining -= 0.1;
      if (bossTimeRemaining <= 0) {
        bossTimeRemaining = bossTimeTotal;
        triggerBossAutoAttack();
      }
      updateTimerDisplay();
    }, 100);
  }

  function stopBossTimer() {
    if (bossTimerInterval) {
      clearInterval(bossTimerInterval);
      bossTimerInterval = null;
    }
  }

  function updateTimerDisplay() {
    const pct = Math.max(0, Math.min(100, (bossTimeRemaining / bossTimeTotal) * 100));
    const secStr = `${Math.max(0, bossTimeRemaining).toFixed(1)}s`;

    // 頂部魔王計時條
    const bossTimerBar = document.getElementById("boss-timer-bar-fill");
    const bossTimerSec = document.getElementById("boss-timer-sec");
    if (bossTimerBar) bossTimerBar.style.width = `${pct}%`;
    if (bossTimerSec) bossTimerSec.textContent = secStr;

    // 答題面板內部的警示橫條
    const quizTimerBar = document.getElementById("quiz-boss-timer-bar");
    const quizTimerSec = document.getElementById("quiz-boss-timer-sec");
    if (quizTimerBar) quizTimerBar.style.width = `${pct}%`;
    if (quizTimerSec) quizTimerSec.textContent = secStr;
  }

  // 5. 即時解析度自適應衝刺距離計算器 (除以 stage 縮放率 scale，確保不同解析度與載具下精準碰觸對方身體)
  function calculateAttackDistances() {
    const playerSprite = document.getElementById("player-battle-sprite-container");
    const enemySprite = document.getElementById("enemy-sprite-container");
    if (!playerSprite || !enemySprite) {
      return { heroSolo: 460, bossSolo: -460, heroMid: 230, bossMid: -230 };
    }

    const scale = (window.ViewportScaler && window.ViewportScaler.getScale()) || 1;
    const pRect = playerSprite.getBoundingClientRect();
    const eRect = enemySprite.getBoundingClientRect();

    // 兩者之間實際間距 (螢幕實際像素除以 scale 轉回舞台內部 CSS 像素)
    const fullGap = (eRect.left - pRect.right) / scale;
    // 重疊深度 (確保確實碰擊到對方身體內部約 38~55px)
    const overlap = Math.max(38, Math.min(60, (pRect.width / scale) * 0.22));

    // 單獨攻擊：衝刺直到碰觸對方身體
    const heroSoloDist = Math.max(120, Math.round(fullGap + overlap));
    const bossSoloDist = -heroSoloDist;

    // 雙方同時攻擊：在畫面中間相遇對拼碰擊，不越過對方
    const halfGap = fullGap / 2;
    const heroMidDist = Math.max(60, Math.round(halfGap + overlap * 0.5));
    const bossMidDist = -heroMidDist;

    return {
      heroSolo: heroSoloDist,
      bossSolo: bossSoloDist,
      heroMid: heroMidDist,
      bossMid: bossMidDist
    };
  }

  // 5.1 震撼濺血與打擊特效產生器 (Blood Splatter FX)
  function showBloodSplatter(target, isCrit = false, isClash = false) {
    let anchor = null;
    if (isClash) {
      anchor = document.getElementById("battle-fx-overlay") || document.getElementById("battle-visual-container");
    } else {
      anchor = document.getElementById(target === "player" ? "player-fx-anchor" : "enemy-fx-anchor");
    }
    if (!anchor) return;

    const container = document.createElement("div");
    container.className = "blood-splatter-container";
    if (isClash) {
      container.style.left = "50%";
      container.style.top = "50%";
    }

    // 中心血花噴濺擴散核心
    const centerSplat = document.createElement("div");
    centerSplat.className = "blood-splat-center";
    if (isCrit) {
      centerSplat.style.transform = "scale(1.4)";
      centerSplat.style.filter = "drop-shadow(0 0 16px #ef4444)";
    }
    container.appendChild(centerSplat);

    // 撕裂血痕 (2~3 道)
    const streakCount = isCrit ? 3 : 2;
    for (let s = 0; s < streakCount; s++) {
      const streak = document.createElement("div");
      streak.className = "blood-slash-streak";
      const rot = (Math.random() * 80 - 40) + (s * 45);
      streak.style.setProperty("--rot", `${rot}deg`);
      streak.style.top = `${45 + (Math.random() * 20 - 10)}%`;
      streak.style.left = `${15 + (Math.random() * 15)}%`;
      container.appendChild(streak);
    }

    // 飛濺血滴 (8~16 顆噴散血花)
    const dropCount = isCrit ? 16 : isClash ? 14 : 10;
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement("div");
      drop.className = "blood-droplet";
      const angle = (Math.PI * 2 * i) / dropCount + (Math.random() * 0.5 - 0.25);
      const dist = 35 + Math.random() * (isCrit ? 80 : 55);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const size = 6 + Math.random() * (isCrit ? 9 : 6);

      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.setProperty("--tx", `${tx}px`);
      drop.style.setProperty("--ty", `${ty}px`);
      drop.style.animationDelay = `${Math.random() * 0.08}s`;
      container.appendChild(drop);
    }

    // 若為空中中間相遇對拼，產生金紅衝擊火花
    if (isClash) {
      const spark = document.createElement("div");
      spark.className = "clash-impact-spark";
      container.appendChild(spark);
    }

    anchor.appendChild(container);
    setTimeout(() => container.remove(), 800);
  }

  // 5.2 魔王定時自動反擊衝撞 (衝刺確實碰及勇者身體，若勇者同時攻擊則在中間相遇)
  function triggerBossAutoAttack() {
    AudioManager.playBossAttack();
    const bossDmg = Math.max(5, Math.floor((bossStats.atk || 12) * (1 - (heroStats.dmgReduction || 10) / 100)));
    heroHp = Math.max(0, heroHp - bossDmg);
    DataManager.state.currentHp = heroHp;

    const enemySprite = document.getElementById("enemy-sprite-container");
    const playerSprite = document.getElementById("player-battle-sprite-container");
    const dists = calculateAttackDistances();

    if (isHeroAttacking) {
      // 雙方同時攻擊！在畫面中間相遇碰撞，而不是跑過頭
      if (enemySprite) {
        enemySprite.style.setProperty("--boss-dash-x", `${dists.bossMid}px`);
        enemySprite.classList.add("anim-boss-attack");
        setTimeout(() => enemySprite.classList.remove("anim-boss-attack"), 780);
      }
      if (playerSprite) {
        playerSprite.style.setProperty("--hero-dash-x", `${dists.heroMid}px`);
      }

      setTimeout(() => {
        const arena = document.getElementById("battle-visual-container");
        arena?.classList.add("shake-screen");
        setTimeout(() => arena?.classList.remove("shake-screen"), 350);

        playerSprite?.classList.add("anim-hurt");
        enemySprite?.classList.add("anim-hurt");
        setTimeout(() => {
          playerSprite?.classList.remove("anim-hurt");
          enemySprite?.classList.remove("anim-hurt");
        }, 380);

        showBloodSplatter("player", false, true);
        showFloatingDamage("player", bossDmg, "hero-hit");
        logBattle(`⚡ 勇者與關主【${bossStats.enemyName}】同時發起攻擊，在空中激烈碰撞！勇者受創 ${bossDmg} 傷害！`, "log-damage", `⚔️ 空中激突！勇者受到 ${bossDmg} 傷害！`);
        updateBars();
        checkBattleEnd();
      }, 450);
      return;
    }

    // 單獨魔王突襲：衝向勇者碰及身體後彈回原位
    isBossAttacking = true;
    if (enemySprite) {
      enemySprite.style.setProperty("--boss-dash-x", `${dists.bossSolo}px`);
      enemySprite.classList.add("anim-boss-attack");
      setTimeout(() => {
        enemySprite.classList.remove("anim-boss-attack");
        isBossAttacking = false;
      }, 780);
    }

    // 在碰撞點 (約 450ms) 觸發勇者受擊反應、濺血、震屏與傷害飄字
    setTimeout(() => {
      const arena = document.getElementById("battle-visual-container");
      arena?.classList.add("shake-screen");
      setTimeout(() => arena?.classList.remove("shake-screen"), 350);

      playerSprite?.classList.add("anim-hurt");
      setTimeout(() => playerSprite?.classList.remove("anim-hurt"), 380);

      showBloodSplatter("player", false);
      showFloatingDamage("player", bossDmg, "hero-hit");
      logBattle(`⚡ 關主【${bossStats.enemyName}】趁隙猛烈衝撞，對勇者造成 ${bossDmg} 點傷害！`, "log-damage", `⚡ 受到關主衝撞 ${bossDmg} 傷害！`);
      updateBars();

      checkBattleEnd();
    }, 450);
  }

  // 6. 答題流程啟動 (預設直接顯示題目及選項，並依後台設定動態隨機打亂選項順序)
  function openQuiz(skillType = null) {
    currentSkillType = skillType;
    if (questionPool.length === 0) {
      questionPool = DataManager.getQuestionsForExam(DataManager.state.selectedExamId);
    }
    if (!questionPool || questionPool.length === 0) {
      questionPool = [
        {
          question: "在自然生態農耕中，被稱為「黑色黃金（黑金）」的是什麼？",
          options: ["石油原油", "完全發酵熟成的有機腐植質堆肥", "燒焦木炭粉", "黑芝麻糖粉"],
          answer: 2,
          explanation: "黑金指的是富含有機質的高品質腐植質堆肥！"
        }
      ];
    }
    const rawQuestion = questionPool[questionIndex % questionPool.length];
    questionIndex++;

    // 檢查後台「題目選項隨機打亂」設定 (預設 true 開啟，防止學生固定盲猜第 1 選項)
    const isRandomize = DataManager.config?.randomizeOptions !== false;
    const origCorrectIdx = (rawQuestion.answer || 1) - 1;

    let displayOptions = [];
    let displayedCorrectIdx = origCorrectIdx;

    if (isRandomize && Array.isArray(rawQuestion.options) && rawQuestion.options.length > 0) {
      // 封裝原始文字與正解標記
      const mapped = rawQuestion.options.map((optText, origIdx) => ({
        text: optText,
        origIdx,
        isCorrect: origIdx === origCorrectIdx,
      }));

      // Fisher-Yates 隨機打亂
      for (let i = mapped.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
      }

      displayOptions = mapped.map((m) => m.text);
      displayedCorrectIdx = mapped.findIndex((m) => m.isCorrect);
      if (displayedCorrectIdx === -1) displayedCorrectIdx = 0;
    } else {
      displayOptions = [...rawQuestion.options];
      displayedCorrectIdx = origCorrectIdx;
    }

    currentQuestion = {
      ...rawQuestion,
      displayOptions,
      displayedCorrectIndex: displayedCorrectIdx,
      originalCorrectIndex: origCorrectIdx,
    };

    const quizArea = document.getElementById("quiz-interactive-area");
    if (quizArea) quizArea.classList.remove("hidden");
    const quizPanel = document.getElementById("quiz-panel");
    if (quizPanel) quizPanel.classList.remove("hidden");

    const qText = document.getElementById("quiz-question-text");
    const catTag = document.getElementById("quiz-category-tag");
    const optBtns = document.querySelectorAll(".quiz-opt-btn");

    if (qText) qText.textContent = currentQuestion.question;
    if (catTag) catTag.textContent = currentQuestion.category || "黑金試煉";

    optBtns.forEach((btn, idx) => {
      btn.classList.remove("opt-btn-correct", "opt-btn-wrong", "hidden");
      btn.disabled = false;
      const optText = currentQuestion.displayOptions[idx] || `選項 ${idx + 1}`;
      const textSpan = btn.querySelector(".opt-text");
      if (textSpan) textSpan.textContent = optText;
    });

    // 若使用了透視特技 (排除 2 個錯誤選項)
    if (currentSkillType === "fifty") {
      const correctIdx = currentQuestion.displayedCorrectIndex;
      let wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIdx);
      wrongIndices.sort(() => Math.random() - 0.5);
      const toHide = wrongIndices.slice(0, 2);
      toHide.forEach((i) => {
        if (optBtns[i]) optBtns[i].classList.add("hidden");
      });
      logBattle(`👁️ 發動【${heroStats.skills?.skill3?.name || "透視"}】特技，排除 2 個錯誤選項！`, "log-info", "👁️ 已排除 2 個錯誤選項！");
    }

    isAnswering = true;
  }

  // 7. 玩家點選選項處理 (衝刺碰擊魔王身體 & 支援濺血與同時攻擊中間相遇)
  function handleAnswer(choiceIdx) {
    if (!isAnswering || !currentQuestion) return;
    isAnswering = false;

    const optBtns = document.querySelectorAll(".quiz-opt-btn");
    optBtns.forEach((b) => (b.disabled = true));

    const correctIdx = currentQuestion.displayedCorrectIndex !== undefined 
      ? currentQuestion.displayedCorrectIndex 
      : ((currentQuestion.answer || 1) - 1);
    const isCorrect = choiceIdx === correctIdx;

    // 紀錄作答數據 (儲存學生實際看到的選項排列順序與選擇)
    const recordItem = {
      stageIndex: currentStageIndex,
      chapterTitle: bossStats.chapterTitle || bossStats.title,
      question: currentQuestion.question,
      options: currentQuestion.displayOptions || currentQuestion.options,
      selectedIndex: choiceIdx,
      correctIndex: correctIdx,
      isCorrect,
      explanation: currentQuestion.explanation || "",
      answeredAt: new Date().toISOString(),
    };
    DataManager.state.stageAnswers.push(recordItem);
    DataManager.state.allGameAnswers.push(recordItem);

    const playerSprite = document.getElementById("player-battle-sprite-container");
    const enemySprite = document.getElementById("enemy-sprite-container");
    const dists = calculateAttackDistances();

    if (isCorrect) {
      // 答對處理
      AudioManager.playCorrect();
      if (optBtns[choiceIdx]) optBtns[choiceIdx].classList.add("opt-btn-correct");

      let dmg = heroStats.atk || 35;
      let isCrit = Math.random() * 100 < (heroStats.critRate || 15);

      if (currentSkillType === "crit") {
        isCrit = true;
        dmg = Math.floor(dmg * (heroStats.skills?.skill1?.mult || 2.2));
        AudioManager.playCritSkill();
      } else if (currentSkillType === "heal") {
        const healAmt = heroStats.skills?.skill2?.heal || 45;
        const manaAmt = heroStats.skills?.skill2?.mana || 10;
        heroHp = Math.min(heroStats.hp, heroHp + healAmt);
        heroMp = Math.min(heroStats.mp, heroMp + manaAmt);
        showFloatingDamage("player", `+${healAmt}`, "heal");
        AudioManager.playHealSkill();
        logBattle(`🌿 答對並發動【${heroStats.skills?.skill2?.name || "滋養"}】，回復 ${healAmt} 血量！`, "log-hit", `🌿 回復 ${healAmt} HP！`);
      } else {
        if (isCrit) dmg = Math.floor(dmg * 1.5);
        AudioManager.playHeroAttack();
      }

      bossHp = Math.max(0, bossHp - dmg);
      DataManager.state.score += (isCrit ? 150 : 100);

      // 答對獎勵：重置關主計時
      bossTimeRemaining = bossTimeTotal;
      updateTimerDisplay();

      if (isBossAttacking) {
        // 魔王正好也在突襲！兩者在畫面中間相遇碰撞對拼
        if (playerSprite) {
          playerSprite.style.setProperty("--hero-dash-x", `${dists.heroMid}px`);
          playerSprite.classList.add("anim-hero-attack");
          setTimeout(() => playerSprite.classList.remove("anim-hero-attack"), 780);
        }
        if (enemySprite) {
          enemySprite.style.setProperty("--boss-dash-x", `${dists.bossMid}px`);
        }

        setTimeout(() => {
          const arena = document.getElementById("battle-visual-container");
          arena?.classList.add("shake-screen");
          setTimeout(() => arena?.classList.remove("shake-screen"), 350);

          enemySprite?.classList.add("anim-hurt");
          playerSprite?.classList.add("anim-hurt");
          setTimeout(() => {
            enemySprite?.classList.remove("anim-hurt");
            playerSprite?.classList.remove("anim-hurt");
          }, 380);

          showBloodSplatter("enemy", isCrit, true);
          showFloatingDamage("enemy", dmg, isCrit ? "crit" : "hero-hit");
          logBattle(`⚔️ 雙方同時出招！在戰場中央激突對決！勇者對魔王造成 ${dmg} 點${isCrit ? "【暴擊】" : ""}傷害！`, "log-hit", `⚔️ 空中對碰！造成 ${dmg} 傷害${isCrit ? "（暴擊）" : ""}！`);
          updateBars();
        }, 450);

      } else {
        // 勇者單獨發動衝刺碰擊魔王身體 (根據解析度精確到位)
        isHeroAttacking = true;
        if (playerSprite) {
          playerSprite.style.setProperty("--hero-dash-x", `${dists.heroSolo}px`);
          playerSprite.classList.add("anim-hero-attack");
          setTimeout(() => {
            playerSprite.classList.remove("anim-hero-attack");
            isHeroAttacking = false;
          }, 780);
        }

        // 在碰撞時刻 (約 450ms) 觸發魔王受擊反應、濺血、震屏與傷害飄字
        setTimeout(() => {
          const arena = document.getElementById("battle-visual-container");
          arena?.classList.add("shake-screen");
          setTimeout(() => arena?.classList.remove("shake-screen"), 350);

          enemySprite?.classList.add("anim-hurt");
          setTimeout(() => enemySprite?.classList.remove("anim-hurt"), 380);

          showBloodSplatter("enemy", isCrit);
          showFloatingDamage("enemy", dmg, isCrit ? "crit" : "hero-hit");
          logBattle(`🎯 答對！發動【${heroStats.attackName || "魔法攻擊"}】，重擊魔王造成 ${dmg} 點${isCrit ? "【暴擊】" : ""}傷害！`, "log-hit", `🎯 命中！造成 ${dmg} 傷害${isCrit ? "（暴擊）" : ""}！`);
          updateBars();
        }, 450);
      }

      currentSkillType = null;

      // 答題後自動加載下一題
      setTimeout(() => {
        if (bossHp <= 0) {
          checkBattleEnd();
        } else {
          openQuiz(null);
        }
      }, 950);

    } else {
      // 答錯處理
      AudioManager.playWrong();
      if (optBtns[choiceIdx]) optBtns[choiceIdx].classList.add("opt-btn-wrong");
      if (optBtns[correctIdx]) optBtns[correctIdx].classList.add("opt-btn-correct");

      // 答錯懲罰機制：關主突襲秒數立即歸零觸發猛烈攻擊
      bossTimeRemaining = 0;
      updateTimerDisplay();

      const bossDmg = Math.max(8, Math.floor((bossStats.atk || 12) * (1 - (heroStats.dmgReduction || 10) / 100)));
      heroHp = Math.max(0, heroHp - bossDmg);

      isBossAttacking = true;
      if (enemySprite) {
        enemySprite.style.setProperty("--boss-dash-x", `${dists.bossSolo}px`);
        enemySprite.classList.add("anim-boss-attack");
        setTimeout(() => {
          enemySprite.classList.remove("anim-boss-attack");
          isBossAttacking = false;
        }, 780);
      }

      // 在碰撞時刻 (約 450ms) 觸發勇者受擊反應、濺血、震屏與傷害飄字
      setTimeout(() => {
        const arena = document.getElementById("battle-visual-container");
        arena?.classList.add("shake-screen");
        setTimeout(() => arena?.classList.remove("shake-screen"), 350);

        playerSprite?.classList.add("anim-hurt");
        setTimeout(() => playerSprite?.classList.remove("anim-hurt"), 380);

        showBloodSplatter("player", false);
        showFloatingDamage("player", bossDmg, "hero-hit");
        logBattle(`⚡ 答錯懲罰！魔王趁隙狂暴反撲造成 ${bossDmg} 傷害！正解為【選項 ${String.fromCharCode(65 + correctIdx)}】`, "log-damage", `⚡ 答錯！受到 ${bossDmg} 反擊傷害（正解：${String.fromCharCode(65 + correctIdx)}）`);

        bossTimeRemaining = bossTimeTotal;
        updateTimerDisplay();
        updateBars();
      }, 450);

      currentSkillType = null;

      setTimeout(() => {
        if (heroHp <= 0) {
          checkBattleEnd();
        } else {
          openQuiz(null);
        }
      }, 1250);
    }
  }

  // 8. 傷害飄字特效
  function showFloatingDamage(target, text, type) {
    const anchor = document.getElementById(target === "player" ? "player-fx-anchor" : "enemy-fx-anchor");
    if (!anchor) return;

    const pop = document.createElement("div");
    pop.className = `damage-number-pop damage-${type}`;
    pop.textContent = text;
    pop.style.left = "50%";
    pop.style.top = "40%";
    anchor.appendChild(pop);

    setTimeout(() => pop.remove(), 1100);
  }

  // 9. 檢查戰鬥勝負
  function checkBattleEnd() {
    if (bossHp <= 0) {
      stopBossTimer();
      AudioManager.stopBgm(); // 停止戰鬥音樂
      AudioManager.playVictory();
      logBattle(`🎉 勇者大捷！成功擊敗【${bossStats.enemyName}】！`, "log-hit");

      // 解鎖下一關
      const nextStage = currentStageIndex + 1;
      if (!DataManager.state.unlockedStages.includes(nextStage) && nextStage < 5) {
        DataManager.state.unlockedStages.push(nextStage);
      }

      setTimeout(() => {
        if (currentStageIndex === 4) {
          showGrandEnding();
        } else {
          showStageClearedAlert();
        }
      }, 1000);

    } else if (heroHp <= 0) {
      stopBossTimer();
      AudioManager.stopBgm(); // 停止戰鬥音樂
      logBattle(`💀 勇者血量耗盡倒下...`, "log-damage");
      setTimeout(() => {
        showGameOverAlert();
      }, 800);
    }
  }

  // 10. 章節通關提示彈窗
  function showStageClearedAlert() {
    const modal = document.getElementById("game-alert-modal");
    document.getElementById("modal-alert-title").textContent = "🏆 關卡突破！";
    document.getElementById("modal-alert-body").textContent = `恭喜突破【${bossStats.chapterTitle || bossStats.title}】！獲得 300 點冒險積分，已解鎖下一生態關卡！`;

    const okBtn = document.getElementById("modal-alert-ok-btn");
    okBtn.onclick = () => {
      modal.classList.add("hidden");
      returnToMap();
    };
    modal.classList.remove("hidden");
  }

  // 11. 戰敗彈窗 (需求 1：試煉受挫後回到關卡地圖上重新點選進入，而不是馬上進入闖關)
  function showGameOverAlert() {
    AudioManager.stopBgm();
    const modal = document.getElementById("game-alert-modal");
    document.getElementById("modal-alert-title").textContent = "💧 試煉受挫";
    document.getElementById("modal-alert-body").textContent = "勇者受到魔王強力衝擊，但生態智慧永不放棄！已為您完全重置血量與精力，請回到生態大地圖重新整裝再次挑戰！";

    const okBtn = document.getElementById("modal-alert-ok-btn");
    okBtn.onclick = () => {
      modal.classList.add("hidden");
      returnToMap();
    };
    modal.classList.remove("hidden");
  }

  // 12. 全通關史詩慶典 (Grand Ending)
  function showGrandEnding() {
    const endingModal = document.getElementById("game-clear-modal");
    endingModal.classList.remove("hidden");

    document.getElementById("ending-cutscene-view").classList.remove("hidden");
    document.getElementById("ending-review-view").classList.add("hidden");

    initConfetti();

    const btnSkip = document.getElementById("btn-ending-skip");
    const btnContinue = document.getElementById("btn-ending-continue");

    const toReview = () => {
      AudioManager.playClick();
      document.getElementById("ending-cutscene-view").classList.add("hidden");
      document.getElementById("ending-review-view").classList.remove("hidden");
      renderEndingReview();
    };

    if (btnSkip) btnSkip.onclick = toReview;
    if (btnContinue) btnContinue.onclick = toReview;
  }

  // 13. 成果報告書與錯題深度複習
  function renderEndingReview() {
    const allAns = DataManager.state.allGameAnswers || [];
    const totalQ = allAns.length;
    const correctQ = allAns.filter((a) => a.isCorrect).length;
    const wrongQ = totalQ - correctQ;
    const accPct = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 100;

    document.getElementById("ending-student-name").textContent = DataManager.state.studentName || "小冒險家";
    document.getElementById("final-score-val").textContent = DataManager.state.score || 0;
    document.getElementById("ending-accuracy-val").textContent = `${accPct}%`;

    document.getElementById("ending-total-q-count").textContent = totalQ;
    document.getElementById("ending-correct-q-count").textContent = correctQ;
    document.getElementById("ending-wrong-q-count").textContent = wrongQ;

    const fillBar = document.getElementById("ending-progress-bar-fill");
    if (fillBar) fillBar.style.width = `${accPct}%`;

    const mistakesList = document.getElementById("ending-mistakes-list");
    const mistakesBadge = document.getElementById("ending-mistakes-badge");
    const wrongAnswers = allAns.filter((a) => !a.isCorrect);

    mistakesBadge.textContent = `共 ${wrongAnswers.length} 題`;
    mistakesList.innerHTML = "";

    if (wrongAnswers.length === 0) {
      mistakesList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #34d399;">
          <div style="font-size: 40px; margin-bottom: 8px;">👑</div>
          <div style="font-size: 16px; font-weight: 800;">全對大滿貫！你已完全掌握黑金魔法與永續食物循環之道！</div>
        </div>
      `;
    } else {
      wrongAnswers.forEach((item, idx) => {
        const card = document.createElement("div");
        card.className = "mistake-card";
        const userOptText = item.options[item.selectedIndex] || `選項 ${item.selectedIndex + 1}`;
        const correctOptText = item.options[item.correctIndex] || `選項 ${item.correctIndex + 1}`;

        card.innerHTML = `
          <div style="font-size: 14px; font-weight: 800; color: #fde047; margin-bottom: 6px;">
            ${idx + 1}. 【${item.chapterTitle}】${item.question}
          </div>
          <div style="font-size: 12.5px; margin-bottom: 4px;">
            <span style="color: #f87171;">❌ 你的選答：${userOptText}</span> ｜ 
            <span style="color: #34d399; font-weight: bold;">✅ 正確答案：${correctOptText}</span>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; background: rgba(6, 78, 59, 0.4); padding: 6px 10px; border-radius: 6px; border-left: 3px solid #10b981;">
            💡 <strong>觀念解析：</strong>${item.explanation || "請牢記綠色生活與正確分類原則！"}
          </div>
        `;
        mistakesList.appendChild(card);
      });
    }

    DataManager.saveRecord({
      studentName: DataManager.state.studentName || "小冒險家",
      heroKey: DataManager.state.selectedHeroKey,
      examId: DataManager.state.selectedExamId,
      score: DataManager.state.score,
      accuracy: accPct,
      totalQuestions: totalQ,
      correctCount: correctQ,
      wrongCount: wrongQ,
      details: allAns,
    });

    document.getElementById("btn-ending-restart").onclick = () => {
      document.getElementById("game-clear-modal").classList.add("hidden");
      startBattle(0);
    };
    document.getElementById("btn-ending-tomap").onclick = () => {
      document.getElementById("game-clear-modal").classList.add("hidden");
      returnToMap();
    };
    document.getElementById("btn-ending-tohome").onclick = () => {
      AudioManager.stopBgm();
      document.getElementById("game-clear-modal").classList.add("hidden");
      document.getElementById("battle-screen").classList.add("hidden");
      document.getElementById("start-screen").classList.remove("hidden");
    };
  }

  // 14. 戰鬥即時訊息 (出現在兩人對戰畫面中間，出現後自動往上飄走消失)
  function logBattle(text, className = "log-info", toastText = null) {
    // 1. 底層日誌備份
    const box = document.getElementById("battle-log-content");
    if (box) {
      const line = document.createElement("div");
      line.className = `log-line ${className}`;
      line.textContent = text;
      box.appendChild(line);
      while (box.children.length > 35) {
        box.removeChild(box.firstChild);
      }
      box.scrollTop = box.scrollHeight;
    }

    // 2. 對峙舞台中央浮動訊息膠囊 (向上飄散並消失，支援精煉簡短 toastText)
    const floatLayer = document.getElementById("battle-floating-msgs");
    if (floatLayer) {
      const toast = document.createElement("div");
      toast.className = `combat-float-toast ${className}`;
      toast.textContent = toastText || text;
      floatLayer.appendChild(toast);

      // 動畫 2.2s 播放完畢後自動移除
      setTimeout(() => {
        toast.remove();
      }, 2200);

      // 控制畫面上浮動膠囊最多 2 條，避免遮蔽中央角色
      while (floatLayer.children.length > 2) {
        floatLayer.removeChild(floatLayer.firstChild);
      }
    }
  }

  // 15. 回到大地圖 (恢復大地圖音樂與重設出戰狀態)
  function returnToMap() {
    stopBossTimer();
    closeAllPopovers();
    isHeroAttacking = false;
    isBossAttacking = false;
    AudioManager.playMapBgm();
    document.getElementById("battle-screen")?.classList.add("hidden");
    document.getElementById("worldmap-screen")?.classList.remove("hidden");
    WorldMapManager.renderMapNodes();
    WorldMapManager.updatePlayerSprite();
  }

  // 16. Popover 浮窗管理 (專屬特技與營養補給)
  function toggleSkillPopover(forceOpen = null) {
    const pop = document.getElementById("battle-skill-popover");
    const itemPop = document.getElementById("battle-item-popover");
    if (!pop) return;
    if (itemPop) itemPop.classList.add("hidden");

    const willOpen = forceOpen !== null ? forceOpen : pop.classList.contains("hidden");
    if (willOpen) {
      pop.classList.remove("hidden");
    } else {
      pop.classList.add("hidden");
    }
  }

  function toggleItemPopover(forceOpen = null) {
    const pop = document.getElementById("battle-item-popover");
    const skillPop = document.getElementById("battle-skill-popover");
    if (!pop) return;
    if (skillPop) skillPop.classList.add("hidden");

    const willOpen = forceOpen !== null ? forceOpen : pop.classList.contains("hidden");
    if (willOpen) {
      pop.classList.remove("hidden");
    } else {
      pop.classList.add("hidden");
    }
  }

  function closeAllPopovers() {
    document.getElementById("battle-skill-popover")?.classList.add("hidden");
    document.getElementById("battle-item-popover")?.classList.add("hidden");
  }

  // 17. 滿版紙花飄落特效 Canvas (Confetti)
  function initConfetti() {
    const canvas = document.getElementById("ending-confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ["#10b981", "#34d399", "#fde047", "#f59e0b", "#38bdf8", "#ec4899", "#ffffff"];

    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 3 + 2,
        rot: Math.random() * 360,
      });
    }

    function render() {
      if (document.getElementById("game-clear-modal")?.classList.contains("hidden")) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rot += 2;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      requestAnimationFrame(render);
    }
    render();
  }

  // 18. 按鈕事件綁定 (需求 2：專屬特技、營養補給、撤退地圖)
  function setupEvents() {
    // 右側三大操作按鈕
    const btnSkill = document.getElementById("btn-side-skill");
    if (btnSkill) {
      btnSkill.onclick = (e) => {
        e.stopPropagation();
        AudioManager.playClick();
        toggleSkillPopover();
      };
    }

    const btnItem = document.getElementById("btn-side-item");
    if (btnItem) {
      btnItem.onclick = (e) => {
        e.stopPropagation();
        AudioManager.playClick();
        toggleItemPopover();
      };
    }

    const btnRun = document.getElementById("btn-side-run");
    if (btnRun) {
      btnRun.onclick = (e) => {
        e.stopPropagation();
        AudioManager.playClick();
        closeAllPopovers();
        returnToMap();
      };
    }

    // 關閉 Popover
    document.getElementById("btn-close-skill-popover")?.addEventListener("click", (e) => {
      e.stopPropagation();
      AudioManager.playClick();
      toggleSkillPopover(false);
    });

    document.getElementById("btn-close-item-popover")?.addEventListener("click", (e) => {
      e.stopPropagation();
      AudioManager.playClick();
      toggleItemPopover(false);
    });

    // 專屬特技選項
    document.getElementById("btn-pop-skill-crit")?.addEventListener("click", () => {
      const cost = heroStats?.skills?.skill1?.cost || 15;
      if (heroMp < cost) {
        logBattle("精力 MP 不足，無法施展暴擊特技！", "log-damage");
        return;
      }
      AudioManager.playClick();
      heroMp -= cost;
      updateBars();
      toggleSkillPopover(false);
      currentSkillType = "crit";
      logBattle(`💥 已灌注【${heroStats?.skills?.skill1?.name || "暴擊"}】特技！答對將造成 2.2 倍暴擊傷害！`, "log-hit");
    });

    document.getElementById("btn-pop-skill-heal")?.addEventListener("click", () => {
      const cost = heroStats?.skills?.skill2?.cost || 10;
      if (heroMp < cost) {
        logBattle("精力 MP 不足，無法施展滋養特技！", "log-damage");
        return;
      }
      AudioManager.playClick();
      heroMp -= cost;
      updateBars();
      toggleSkillPopover(false);
      currentSkillType = "heal";
      logBattle(`🌿 已灌注【${heroStats?.skills?.skill2?.name || "滋養"}】特技！答對將回復 45 點血量！`, "log-hit");
    });

    document.getElementById("btn-pop-skill-fifty")?.addEventListener("click", () => {
      const cost = heroStats?.skills?.skill3?.cost || 20;
      if (heroMp < cost) {
        logBattle("精力 MP 不足，無法施展透視特技！", "log-damage", "⚠️ 精力不足！");
        return;
      }
      AudioManager.playClick();
      heroMp -= cost;
      updateBars();
      toggleSkillPopover(false);
      currentSkillType = "fifty";

      if (currentQuestion) {
        const correctIdx = currentQuestion.displayedCorrectIndex !== undefined 
          ? currentQuestion.displayedCorrectIndex 
          : ((currentQuestion.answer || 1) - 1);
        const optBtns = document.querySelectorAll(".quiz-opt-btn");
        let wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIdx);
        wrongIndices.sort(() => Math.random() - 0.5);
        const toHide = wrongIndices.slice(0, 2);
        toHide.forEach((i) => {
          if (optBtns[i]) optBtns[i].classList.add("hidden");
        });
      }
      logBattle(`👁️ 發動【${heroStats?.skills?.skill3?.name || "透視"}】特技！已排除 2 個錯誤選項！`, "log-info", "👁️ 已排除 2 個錯誤選項！");
    });

    // 營養補給道具選項
    document.getElementById("btn-pop-item-heal")?.addEventListener("click", () => {
      if (DataManager.state.potions.heal <= 0) {
        logBattle("蜜露補給已用盡！", "log-damage");
        return;
      }
      AudioManager.playHealSkill();
      DataManager.state.potions.heal--;
      heroHp = Math.min(heroStats.hp, heroHp + 50);
      showFloatingDamage("player", "+50", "heal");
      logBattle("🍯 飲用蜜露，立即恢復 50 點血量！", "log-hit");
      updateBars();
      toggleItemPopover(false);
    });

    document.getElementById("btn-pop-item-mana")?.addEventListener("click", () => {
      if (DataManager.state.potions.mana <= 0) {
        logBattle("朝露補給已用盡！", "log-damage");
        return;
      }
      AudioManager.playHealSkill();
      DataManager.state.potions.mana--;
      heroMp = Math.min(heroStats.mp, heroMp + 40);
      showFloatingDamage("player", "+40 MP", "heal");
      logBattle("💧 飲用朝露，立即回充 40 點精力！", "log-hit");
      updateBars();
      toggleItemPopover(false);
    });

    // 四個選項按鈕點擊 (支援觸控與點擊)
    document.querySelectorAll(".quiz-opt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index, 10);
        handleAnswer(idx);
      });
    });

    // PC 鍵盤快捷鍵支援 (1, 2, 3, 4 或 A, B, C, D 答題；S 開啟特技；I 開啟道具)
    window.addEventListener("keydown", (e) => {
      const battleScreen = document.getElementById("battle-screen");
      if (!battleScreen || battleScreen.classList.contains("hidden")) return;
      if (!document.getElementById("admin-modal")?.classList.contains("hidden")) return;
      if (!document.getElementById("game-clear-modal")?.classList.contains("hidden")) return;

      if (isAnswering) {
        if (e.key === "1" || e.key === "a" || e.key === "A") {
          const btn = document.querySelector('.quiz-opt-btn[data-index="0"]');
          if (btn && !btn.disabled && !btn.classList.contains("hidden")) handleAnswer(0);
        } else if (e.key === "2" || e.key === "b" || e.key === "B") {
          const btn = document.querySelector('.quiz-opt-btn[data-index="1"]');
          if (btn && !btn.disabled && !btn.classList.contains("hidden")) handleAnswer(1);
        } else if (e.key === "3" || e.key === "c" || e.key === "C") {
          const btn = document.querySelector('.quiz-opt-btn[data-index="2"]');
          if (btn && !btn.disabled && !btn.classList.contains("hidden")) handleAnswer(2);
        } else if (e.key === "4" || e.key === "d" || e.key === "D") {
          const btn = document.querySelector('.quiz-opt-btn[data-index="3"]');
          if (btn && !btn.disabled && !btn.classList.contains("hidden")) handleAnswer(3);
        }
      }

      if (e.key === "s" || e.key === "S") {
        toggleSkillPopover();
      } else if (e.key === "i" || e.key === "I") {
        toggleItemPopover();
      }
    });

    // 點擊 Popover 外部自動關閉
    document.addEventListener("click", (e) => {
      const popSkill = document.getElementById("battle-skill-popover");
      const popItem = document.getElementById("battle-item-popover");
      const btnSideSkill = document.getElementById("btn-side-skill");
      const btnSideItem = document.getElementById("btn-side-item");

      if (popSkill && !popSkill.classList.contains("hidden")) {
        if (!popSkill.contains(e.target) && !btnSideSkill?.contains(e.target)) {
          popSkill.classList.add("hidden");
        }
      }
      if (popItem && !popItem.classList.contains("hidden")) {
        if (!popItem.contains(e.target) && !btnSideItem?.contains(e.target)) {
          popItem.classList.add("hidden");
        }
      }
    });

    // 全局防捲動守護
    window.addEventListener("scroll", () => window.scrollTo(0, 0));
    const appEl = document.getElementById("game-app");
    if (appEl) {
      appEl.addEventListener("scroll", () => {
        appEl.scrollTop = 0;
        appEl.scrollLeft = 0;
      });
    }
  }

  const publicApi = {
    init: setupEvents,
    startBattle,
    returnToMap,
    handleAnswer,
    openQuiz,
    toggleSkillPopover,
    toggleItemPopover,
    triggerBossAutoAttack,
    showBloodSplatter,
    calculateAttackDistances,
    getCurrentQuestion: () => currentQuestion,
    attemptRun: returnToMap,
  };

  window.gameBattle = publicApi;
  return publicApi;
})();

window.BattleManager = BattleManager;
