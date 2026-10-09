/**
 * 《黑金魔法術─永續食物循環系統》- 雙軌混合音訊引擎 (audio.js)
 * 軌道一：HTML5 Audio 實體原聲原創音樂與音效庫 (完美突破 iOS/iPad 靜音開關限制，大音量零延遲)
 * 軌道二：Web Audio API 純前端即時合成備援 (離線或檔案遺失時自動無縫接手)
 */

const AudioManager = (function () {
  let ctx = null;
  let isMuted = false;
  let bgmInterval = null;
  let currentBgmMode = null; // 'map' | 'battle' | null
  let isBgmPlaying = false;
  let isUnlocked = false;

  // 實體音效與 BGM 檔案對照表 (存放於 assets/audio/)
  const AUDIO_FILES = {
    mapBgm: "assets/audio/map_bgm.wav",
    battleBgm: "assets/audio/battle_bgm.wav",
    click: "assets/audio/click.wav",
    correct: "assets/audio/correct.wav",
    wrong: "assets/audio/wrong.wav",
    attack: "assets/audio/attack.wav",
    crit: "assets/audio/crit.wav",
    heal: "assets/audio/heal.wav",
    insight: "assets/audio/insight.wav",
    bossAttack: "assets/audio/boss_attack.wav",
    victory: "assets/audio/victory.wav"
  };

  // HTML5 Audio 播放器實例
  let mapBgmAudio = null;
  let battleBgmAudio = null;
  const sfxAudioMap = {};

  // 1. 初始化 HTML5 Audio 與 iOS 媒體播放通道
  function initHtmlAudio() {
    if (typeof window === "undefined") return;

    // 突破 iOS/iPad 靜音模式：將 AudioSession 類別宣告為 playback (媒體播放不受靜音開關約束)
    if (navigator.audioSession) {
      try {
        navigator.audioSession.type = "playback";
      } catch (e) {}
    }

    if (!mapBgmAudio) {
      mapBgmAudio = new Audio(AUDIO_FILES.mapBgm);
      mapBgmAudio.loop = true;
      mapBgmAudio.preload = "auto";
      mapBgmAudio.volume = 0.85;
      mapBgmAudio.setAttribute("playsinline", "true");
    }

    if (!battleBgmAudio) {
      battleBgmAudio = new Audio(AUDIO_FILES.battleBgm);
      battleBgmAudio.loop = true;
      battleBgmAudio.preload = "auto";
      battleBgmAudio.volume = 0.85;
      battleBgmAudio.setAttribute("playsinline", "true");
    }

    // 預先載入音效實例
    Object.keys(AUDIO_FILES).forEach((key) => {
      if (key !== "mapBgm" && key !== "battleBgm" && !sfxAudioMap[key]) {
        try {
          const a = new Audio(AUDIO_FILES[key]);
          a.preload = "auto";
          a.volume = 0.9;
          a.setAttribute("playsinline", "true");
          sfxAudioMap[key] = a;
        } catch (e) {}
      }
    });
  }

  // 2. Web Audio API 備援引擎初始化
  function initContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  // 3. 全面解鎖行動裝置與平板硬體音訊管線
  function unlockAudio() {
    initHtmlAudio();
    initContext();

    if (navigator.audioSession) {
      try { navigator.audioSession.type = "playback"; } catch (e) {}
    }

    // 核心關鍵技巧：播放 1 幀靜音 base64 音訊，喚醒 iOS/Android 的 AVAudioSessionCategoryPlayback 管道
    try {
      const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silentAudio.volume = 0.01;
      silentAudio.play().catch(() => {});
    } catch (e) {}

    // Web Audio 同步喚醒
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) {}
    }

    isUnlocked = true;
  }

  // 監聽手勢直到音訊完全解鎖
  function handleGestureUnlock() {
    unlockAudio();
    if (isUnlocked && ctx && ctx.state === "running") {
      ["click", "touchend", "touchstart", "pointerup", "keydown"].forEach((evtName) => {
        window.removeEventListener(evtName, handleGestureUnlock);
        document.removeEventListener(evtName, handleGestureUnlock);
      });
    }
  }

  if (typeof window !== "undefined") {
    ["click", "touchend", "touchstart", "pointerup", "keydown"].forEach((evtName) => {
      window.addEventListener(evtName, handleGestureUnlock, { passive: true });
      document.addEventListener(evtName, handleGestureUnlock, { passive: true });
    });
  }

  // 4. 播放實體檔案音效（若檔案不存在或遭阻擋，自動降級調用 Web Audio 合成器）
  function playSoundFile(key, fallbackSynthFn) {
    if (isMuted) return;
    initHtmlAudio();
    unlockAudio();

    const baseAudio = sfxAudioMap[key];
    if (baseAudio) {
      try {
        // cloneNode 支援極速連擊同時發聲 (例如快速作答、連續打擊)
        const clone = baseAudio.cloneNode();
        clone.volume = 0.9;
        const playPromise = clone.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch((err) => {
            // 平板環境若檔案播放失敗，無縫由合成器發聲
            if (fallbackSynthFn) fallbackSynthFn();
          });
        }
        return;
      } catch (e) {
        if (fallbackSynthFn) fallbackSynthFn();
        return;
      }
    }

    if (fallbackSynthFn) fallbackSynthFn();
  }

  // =========================================================================
  // 5. 各項遊戲音效 (實體檔案優先 + 合成器備援)
  // =========================================================================

  // 5.1 點擊音
  function playClick() {
    playSoundFile("click", playClickSynth);
  }
  function playClickSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // 5.2 答對和弦
  function playCorrect() {
    playSoundFile("correct", playCorrectSynth);
  }
  function playCorrectSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        const startTime = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (e) {}
  }

  // 5.3 答錯低音
  function playWrong() {
    playSoundFile("wrong", playWrongSynth);
  }
  function playWrongSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch (e) {}
  }

  // 5.4 勇者攻擊
  function playHeroAttack() {
    playSoundFile("attack", playHeroAttackSynth);
  }
  function playHeroAttackSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // 5.5 暴擊特技
  function playCritSkill() {
    playSoundFile("crit", playCritSkillSynth);
  }
  function playCritSkillSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      [440, 880, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        const t = ctx.currentTime + i * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch (e) {}
  }

  // 5.6 回復特技
  function playHealSkill() {
    playSoundFile("heal", playHealSkillSynth);
  }
  function playHealSkillSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      [329.63, 392.00, 493.88, 587.33, 659.25].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const t = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {}
  }

  // 5.7 洞察特技
  function playInsightSkill() {
    playSoundFile("insight", playInsightSkillSynth);
  }
  function playInsightSkillSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch (e) {}
  }

  // 5.8 魔王攻擊
  function playBossAttack() {
    playSoundFile("bossAttack", playBossAttackSynth);
  }
  function playBossAttackSynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  // 5.9 勝利歡呼號角
  function playVictory() {
    playSoundFile("victory", playVictorySynth);
  }
  function playVictorySynth() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;
    try {
      const melody = [
        { f: 523.25, d: 0.18 },
        { f: 659.25, d: 0.18 },
        { f: 783.99, d: 0.18 },
        { f: 1046.50, d: 0.65 },
      ];
      let cur = ctx.currentTime;
      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.f, cur);
        gain.gain.setValueAtTime(0.4, cur);
        gain.gain.exponentialRampToValueAtTime(0.001, cur + note.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(cur);
        osc.stop(cur + note.d);
        cur += note.d * 0.9;
      });
    } catch (e) {}
  }

  // =========================================================================
  // 6. 背景音樂系統 (雙軌：原聲 WAV 循環播放 + 合成器備援)
  // =========================================================================

  // 6.1 大地圖冒險背景音樂
  function playMapBgm() {
    currentBgmMode = "map";
    isBgmPlaying = true;
    if (isMuted) return;
    initHtmlAudio();
    unlockAudio();

    // 停止戰鬥音樂
    if (battleBgmAudio) {
      battleBgmAudio.pause();
      battleBgmAudio.currentTime = 0;
    }
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }

    // 優先播放原聲大地圖音樂
    if (mapBgmAudio) {
      mapBgmAudio.volume = 0.85;
      const p = mapBgmAudio.play();
      if (p && p.catch) {
        p.catch(() => {
          // 若實體檔案因環境限制未起播，自動切換合成器備援
          startMapBgmSynth();
        });
      }
    } else {
      startMapBgmSynth();
    }
  }

  // 6.2 戰鬥對決背景音樂
  function playBattleBgm() {
    currentBgmMode = "battle";
    isBgmPlaying = true;
    if (isMuted) return;
    initHtmlAudio();
    unlockAudio();

    // 停止大地圖音樂
    if (mapBgmAudio) {
      mapBgmAudio.pause();
      mapBgmAudio.currentTime = 0;
    }
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }

    // 優先播放原聲戰鬥音樂
    if (battleBgmAudio) {
      battleBgmAudio.volume = 0.85;
      const p = battleBgmAudio.play();
      if (p && p.catch) {
        p.catch(() => {
          startBattleBgmSynth();
        });
      }
    } else {
      startBattleBgmSynth();
    }
  }

  // 6.3 停止所有背景音樂
  function stopBgm() {
    isBgmPlaying = false;
    if (mapBgmAudio) {
      mapBgmAudio.pause();
      mapBgmAudio.currentTime = 0;
    }
    if (battleBgmAudio) {
      battleBgmAudio.pause();
      battleBgmAudio.currentTime = 0;
    }
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function startBgm() {
    playMapBgm();
  }

  // 6.4 靜音 / 開啟切換
  function toggleSound() {
    isMuted = !isMuted;
    if (isMuted) {
      stopBgm();
    } else {
      unlockAudio();
      if (currentBgmMode === "battle") {
        playBattleBgm();
      } else {
        playMapBgm();
      }
      // 給予即時確認清脆音
      setTimeout(() => playCorrect(), 60);
    }
    return !isMuted;
  }

  // =========================================================================
  // 7. 合成器備援排程演算法 (當無音訊檔案或被阻擋時自動啟動)
  // =========================================================================
  let mapStep = 0;
  function startMapBgmSynth() {
    if (bgmInterval) clearInterval(bgmInterval);
    mapStep = 0;
    const mapHarmony = [
      { chord: [261.63, 329.63, 392.00], bass: 130.81, melody: [523.25, 659.25] },
      { chord: [246.94, 293.66, 392.00], bass: 123.47, melody: [587.33, 783.99] },
      { chord: [220.00, 261.63, 329.63], bass: 110.00, melody: [659.25, 523.25] },
      { chord: [174.61, 220.00, 261.63], bass: 87.31,  melody: [698.46, 523.25] },
      { chord: [220.00, 261.63, 329.63], bass: 110.00, melody: [440.00, 659.25] },
      { chord: [196.00, 246.94, 293.66], bass: 98.00,  melody: [587.33, 493.88] },
      { chord: [174.61, 220.00, 261.63], bass: 87.31,  melody: [440.00, 523.25] },
      { chord: [196.00, 246.94, 392.00], bass: 98.00,  melody: [587.33, 783.99] }
    ];

    bgmInterval = setInterval(() => {
      if (!isBgmPlaying || isMuted || !ctx || currentBgmMode !== "map") return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      try {
        const item = mapHarmony[mapStep % mapHarmony.length];
        const t = ctx.currentTime;
        mapStep++;

        item.chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.95);
        });

        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = "triangle";
        bassOsc.frequency.setValueAtTime(item.bass * 2, t); // 提高八度以適配平板小喇叭
        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + 0.7);

        item.melody.forEach((mFreq, mIdx) => {
          const mOsc = ctx.createOscillator();
          const mGain = ctx.createGain();
          const mT = t + mIdx * 0.45;
          mOsc.type = "triangle";
          mOsc.frequency.setValueAtTime(mFreq, mT);
          mGain.gain.setValueAtTime(0.22, mT);
          mGain.gain.exponentialRampToValueAtTime(0.001, mT + 0.42);
          mOsc.connect(mGain);
          mGain.connect(ctx.destination);
          mOsc.start(mT);
          mOsc.stop(mT + 0.42);
        });
      } catch (e) {}
    }, 950);
  }

  let battleStep = 0;
  function startBattleBgmSynth() {
    if (bgmInterval) clearInterval(bgmInterval);
    battleStep = 0;
    const bassNotes = [
      146.83, 146.83, 174.61, 146.83,
      196.00, 146.83, 220.00, 207.65,
      146.83, 146.83, 130.81, 146.83,
      233.08, 220.00, 196.00, 164.81
    ];
    const battleChords = [
      [293.66, 349.23, 440.00],
      [233.08, 293.66, 349.23],
      [261.63, 329.63, 392.00],
      [220.00, 277.18, 329.63]
    ];

    bgmInterval = setInterval(() => {
      if (!isBgmPlaying || isMuted || !ctx || currentBgmMode !== "battle") return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      try {
        const t = ctx.currentTime;
        const curStep = battleStep % bassNotes.length;
        const bFreq = bassNotes[curStep] * 2;
        battleStep++;

        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        bOsc.type = "sawtooth";
        bOsc.frequency.setValueAtTime(bFreq, t);
        bGain.gain.setValueAtTime(0.25, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        bOsc.connect(bGain);
        bGain.connect(ctx.destination);
        bOsc.start(t);
        bOsc.stop(t + 0.18);

        if (curStep % 4 === 0) {
          const chord = battleChords[Math.floor(curStep / 4) % battleChords.length];
          chord.forEach((f) => {
            const cOsc = ctx.createOscillator();
            const cGain = ctx.createGain();
            cOsc.type = "square";
            cOsc.frequency.setValueAtTime(f, t);
            cGain.gain.setValueAtTime(0.18, t);
            cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            cOsc.connect(cGain);
            cGain.connect(ctx.destination);
            cOsc.start(t);
            cOsc.stop(t + 0.4);
          });
        }
      } catch (e) {}
    }, 220);
  }

  // 對外公開 API
  return {
    init: initHtmlAudio,
    unlockAudio,
    playClick,
    playCorrect,
    playWrong,
    playHeroAttack,
    playCritSkill,
    playHealSkill,
    playInsightSkill,
    playBossAttack,
    playVictory,
    startBgm,
    playMapBgm,
    playBattleBgm,
    stopBgm,
    toggleSound,
    get isMuted() {
      return isMuted;
    },
    get currentBgmMode() {
      return currentBgmMode;
    }
  };
})();

window.AudioManager = AudioManager;
