/**
 * 《黑金魔法術─永續食物循環系統》- 世界大地圖探索與關卡導航引擎 (worldmap.js)
 */

const WorldMapManager = (function () {
  const STAGES = [
    {
      index: 0,
      title: "第一章：學院惜食大廳",
      enemyName: "浪費剩食怪",
      enemySprite: "assets/images/slime_sprite.png",
      bgImage: "assets/images/forest_bg.jpg",
      hp: 100,
      atk: 12,
      desc: "學生吃不完倒掉的飯菜湯水凝聚成巨魔，考驗大家的餐桌惜食與源頭減量智慧！",
      x: 24, // 百分比
      y: 72,
    },
    {
      index: 1,
      title: "第二章：中央分類迴廊",
      enemyName: "混雜垃圾魔",
      enemySprite: "assets/images/mirage_sprite.png",
      bgImage: "assets/images/desert_bg.jpg",
      hp: 140,
      atk: 16,
      desc: "塑膠雜物纏繞的破壞者，考驗生廚餘、熟廚餘與一般垃圾的精準分類眼力！",
      x: 40,
      y: 56,
    },
    {
      index: 2,
      title: "第三章：黑金發酵溫室",
      enemyName: "惡臭果蠅王",
      enemySprite: "assets/images/demon_sprite.png",
      bgImage: "assets/images/river_bg.jpg",
      hp: 180,
      atk: 20,
      desc: "堆肥太濕引來的飛蟲魔王，考驗碳氮比例平衡、瀝乾控水與翻堆技巧！",
      x: 58,
      y: 45,
    },
    {
      index: 3,
      title: "第四章：陽光有機菜園",
      enemyName: "板結枯土巨魔",
      enemySprite: "assets/images/frost_sprite.png",
      bgImage: "assets/images/highway_bg.jpg",
      hp: 220,
      atk: 24,
      desc: "缺乏有機質的板結石怪，考驗以熟成黑金堆肥改良土壤、喚醒大地生機！",
      x: 74,
      y: 34,
    },
    {
      index: 4,
      title: "第五章：永續生命神殿",
      enemyName: "失衡異變巨神",
      enemySprite: "assets/images/boss_sprite.png",
      bgImage: "assets/images/sacred_bg.jpg",
      hp: 280,
      atk: 28,
      desc: "終極枯竭邪神！串連土地到餐桌的永續食物循環，成就黑金大奇蹟！",
      x: 88,
      y: 20,
    },
  ];

  let selectedStage = null;
  let playerPos = { x: 24, y: 72 };

  function init() {
    AudioManager.playMapBgm();
    renderMapNodes();
    updatePlayerSprite();
    renderHeroSwitcher();
    setupEventListeners();
  }

  // 1. 渲染大地圖關卡圖釘節點
  function renderMapNodes() {
    const container = document.getElementById("map-nodes-container");
    if (!container) return;
    container.innerHTML = "";

    const unlocked = DataManager.state.unlockedStages || [0];

    STAGES.forEach((stg) => {
      const isUnlocked = unlocked.includes(stg.index);
      const isCurrent = DataManager.state.currentStageIndex === stg.index;

      const nodeEl = document.createElement("div");
      nodeEl.className = `map-stage-node ${!isUnlocked ? "map-node-locked" : ""}`;
      nodeEl.style.left = `${stg.x}%`;
      nodeEl.style.top = `${stg.y}%`;

      const bossConfig = (DataManager.config?.bossesConfig || [])[stg.index] || stg;

      nodeEl.innerHTML = `
        <div class="map-node-pill ${isCurrent ? "pulse-glow" : ""}">
          <span class="map-node-icon">${isUnlocked ? "⚔️" : "🔒"}</span>
          <span class="map-node-name">${bossConfig.chapterTitle || stg.title}</span>
        </div>
      `;

      if (isUnlocked) {
        nodeEl.addEventListener("click", () => {
          AudioManager.playClick();
          movePlayerTo(stg.x, stg.y);
          showStageModal(stg);
        });
      }

      container.appendChild(nodeEl);
    });
  }

  // 2. 移動玩家小人
  function movePlayerTo(x, y) {
    playerPos = { x, y };
    const playerEl = document.getElementById("map-player-sprite");
    if (playerEl) {
      playerEl.style.left = `${x}%`;
      playerEl.style.top = `${y}%`;
    }
  }

  // 3. 更新玩家角色頭像與名牌
  function updatePlayerSprite() {
    const heroKey = DataManager.state.selectedHeroKey || "hero_purple";
    const hero = DataManager.config?.heroesConfig?.[heroKey];
    const avatarImg = document.getElementById("map-player-avatar-img");
    const nameTag = document.getElementById("map-player-name-tag");

    const avatarFilename = heroKey === "hero_round" ? "avatar_round.png" :
                           heroKey === "hero_syl" ? "avatar_syl.png" :
                           heroKey === "hero_mul" ? "avatar_mul.png" : "avatar_purple.png";

    if (avatarImg) {
      avatarImg.src = DataManager.resolveImageUrl(avatarFilename, `assets/images/${avatarFilename}`);
    }
    if (nameTag && hero) {
      nameTag.textContent = `${hero.name} · ${hero.title}`;
    }

    // 移動到當前關卡
    const curStg = STAGES[DataManager.state.currentStageIndex] || STAGES[0];
    movePlayerTo(curStg.x, curStg.y);
  }

  // 4. 畫面中央快速更換出戰角色 (具備頭像圖示與選取高亮)
  function renderHeroSwitcher() {
    const list = document.getElementById("map-hero-switcher-list");
    if (!list) return;
    list.innerHTML = "";

    const heroesConfig = DataManager.config?.heroesConfig || {};
    const heroKeys = ["hero_purple", "hero_round", "hero_syl", "hero_mul"];
    const avatarMap = {
      hero_purple: "avatar_purple.png",
      hero_round: "avatar_round.png",
      hero_syl: "avatar_syl.png",
      hero_mul: "avatar_mul.png"
    };

    heroKeys.forEach((key) => {
      const hero = heroesConfig[key];
      if (!hero) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `switcher-btn ${DataManager.state.selectedHeroKey === key ? "active" : ""}`;
      const icon = key === "hero_purple" ? "🧙‍♂️" : key === "hero_round" ? "🛡️" : key === "hero_syl" ? "🧚‍♀️" : "🐖";
      const af = avatarMap[key] || "avatar_purple.png";
      const avatarUrl = DataManager.resolveImageUrl(af, `assets/images/${af}`);

      btn.innerHTML = `
        <img src="${avatarUrl}" alt="${hero.name}" class="switcher-avatar-img">
        <span>${icon} ${hero.name}</span>
      `;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        AudioManager.playClick();
        DataManager.state.selectedHeroKey = key;
        renderHeroSwitcher();
        updatePlayerSprite();
      });

      list.appendChild(btn);
    });
  }

  // 5. 顯示關卡資訊確認視窗
  function showStageModal(stg) {
    selectedStage = stg;
    const modal = document.getElementById("stage-info-modal");
    const bossConfig = (DataManager.config?.bossesConfig || [])[stg.index] || stg;

    const bossSpriteName = stg.index === 0 ? "slime_sprite.png" :
                           stg.index === 1 ? "mirage_sprite.png" :
                           stg.index === 2 ? "demon_sprite.png" :
                           stg.index === 3 ? "frost_sprite.png" : "boss_sprite.png";

    document.getElementById("stage-info-title").textContent = bossConfig.chapterTitle || stg.title;
    document.getElementById("stage-info-enemy-name").textContent = bossConfig.enemyName || stg.enemyName;
    document.getElementById("stage-info-enemy-hp").textContent = `HP: ${bossConfig.hp || stg.hp} ｜ 攻擊力: ${bossConfig.atk || stg.atk}`;
    document.getElementById("stage-info-desc").textContent = bossConfig.desc || stg.desc;

    const spriteImg = document.getElementById("stage-info-enemy-sprite");
    if (spriteImg) {
      spriteImg.src = DataManager.resolveImageUrl(bossSpriteName, `assets/images/${bossSpriteName}`);
    }

    modal.classList.remove("hidden");
  }

  function setupEventListeners() {
    // 留在地圖
    document.getElementById("btn-stage-cancel")?.addEventListener("click", () => {
      AudioManager.playClick();
      document.getElementById("stage-info-modal")?.classList.add("hidden");
    });

    // 進入挑戰
    document.getElementById("btn-stage-enter")?.addEventListener("click", () => {
      AudioManager.playClick();
      document.getElementById("stage-info-modal")?.classList.add("hidden");
      if (selectedStage !== null) {
        DataManager.state.currentStageIndex = selectedStage.index;
        // 切換到戰鬥畫面
        document.getElementById("worldmap-screen")?.classList.add("hidden");
        document.getElementById("battle-screen")?.classList.remove("hidden");
        BattleManager.startBattle(selectedStage.index);
      }
    });

    // 鍵盤移動 (WASD / 方向鍵)
    window.addEventListener("keydown", (e) => {
      const mapScreen = document.getElementById("worldmap-screen");
      if (!mapScreen || mapScreen.classList.contains("hidden")) return;

      const step = 2.5;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        playerPos.y = Math.max(10, playerPos.y - step);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        playerPos.y = Math.min(90, playerPos.y + step);
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        playerPos.x = Math.max(10, playerPos.x - step);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        playerPos.x = Math.min(90, playerPos.x + step);
      }
      movePlayerTo(playerPos.x, playerPos.y);
    });

    // 點擊地圖任意地點尋路移動
    document.getElementById("worldmap-container")?.addEventListener("click", (e) => {
      if (e.target.closest(".map-stage-node") || e.target.closest(".map-top-bar") || e.target.closest(".map-hero-switcher")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      movePlayerTo(x, y);
    });
  }

  return {
    init,
    renderMapNodes,
    updatePlayerSprite,
    renderHeroSwitcher,
    STAGES,
  };
})();

window.WorldMapManager = WorldMapManager;
