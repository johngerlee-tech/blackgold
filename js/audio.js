/**
 * 《黑金魔法術─永續食物循環系統》- Web Audio API 音效與合成音樂引擎
 * 100% 本機純前端即時運算合成，不依賴任何外部 MP3 檔案，完全免外網！
 */

const AudioManager = (function () {
  let ctx = null;
  let isMuted = false;
  let bgmInterval = null;
  let isBgmPlaying = false;

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

  // 行動裝置與平板觸控解鎖 Web Audio Context (相容 iOS Safari 與 Android Chrome)
  function unlockAudioOnGesture() {
    initContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  if (typeof window !== "undefined") {
    ["click", "touchstart", "touchend", "pointerdown"].forEach((evtName) => {
      window.addEventListener(evtName, unlockAudioOnGesture, { once: true, passive: true });
    });
  }

  // 1. 介面點擊清脆音
  function playClick() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // 2. 答對和弦 (大三和弦清脆叮咚)
  function playCorrect() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        const startTime = ctx.currentTime + idx * 0.06;

        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }

  // 3. 答錯低音蜂鳴
  function playWrong() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch (e) {}
  }

  // 4. 勇者普通攻擊打擊音
  function playHeroAttack() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // 5. 勇者暴擊特技音
  function playCritSkill() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const notes = [440, 880, 1760];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        const t = ctx.currentTime + i * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.15);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (e) {}
  }

  // 6. 勇者回復特技音 (綠色療癒琶音)
  function playHealSkill() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const notes = [329.63, 392.00, 493.88, 587.33, 659.25]; // E minor / major arpeggio
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const t = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  }

  // 7. 洞察排除音 (神秘微光音)
  function playInsightSkill() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // 8. 魔王突襲重擊音
  function playBossAttack() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // 9. 勝利大歡呼號角
  function playVictory() {
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.50, d: 0.45 },
      ];
      let cur = ctx.currentTime;
      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.f, cur);

        gain.gain.setValueAtTime(0.2, cur);
        gain.gain.exponentialRampToValueAtTime(0.001, cur + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(cur);
        osc.stop(cur + note.d);
        cur += note.d * 0.9;
      });
    } catch (e) {}
  }

  // 10. 背景音樂合成系統 (支援：大地圖探索曲 & 闖關熱血戰鬥曲)
  let currentBgmMode = null; // 'map' | 'battle' | null
  let mapStep = 0;
  let battleStep = 0;

  // 10.A 大地圖自然冒險主題曲 (輕快、明亮、探險田園風)
  function playMapBgm() {
    currentBgmMode = "map";
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    if (isBgmPlaying && bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    isBgmPlaying = true;
    mapStep = 0;

    // 大地圖和弦與旋律 (C -> G/B -> Am7 -> Fmaj7)
    const mapHarmony = [
      { chord: [261.63, 329.63, 392.00], bass: 130.81, melody: [523.25, 659.25] }, // C
      { chord: [246.94, 293.66, 392.00], bass: 123.47, melody: [587.33, 783.99] }, // G/B
      { chord: [220.00, 261.63, 329.63], bass: 110.00, melody: [659.25, 523.25] }, // Am7
      { chord: [174.61, 220.00, 261.63], bass: 87.31,  melody: [698.46, 523.25] }, // Fmaj7
      { chord: [220.00, 261.63, 329.63], bass: 110.00, melody: [440.00, 659.25] }, // Am
      { chord: [196.00, 246.94, 293.66], bass: 98.00,  melody: [587.33, 493.88] }, // G
      { chord: [174.61, 220.00, 261.63], bass: 87.31,  melody: [440.00, 523.25] }, // F
      { chord: [196.00, 246.94, 392.00], bass: 98.00,  melody: [587.33, 783.99] }  // G7
    ];

    bgmInterval = setInterval(() => {
      if (!isBgmPlaying || isMuted || !ctx || currentBgmMode !== "map") return;
      try {
        const item = mapHarmony[mapStep % mapHarmony.length];
        const t = ctx.currentTime;
        mapStep++;

        // 1. 和弦背景墊樂 (溫暖柔和 sine)
        item.chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.016, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.95);
        });

        // 2. 探險低音 Bass
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = "triangle";
        bassOsc.frequency.setValueAtTime(item.bass, t);
        bassGain.gain.setValueAtTime(0.035, t);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + 0.7);

        // 3. 清新主旋律音符 (清脆木管/精靈感)
        item.melody.forEach((mFreq, mIdx) => {
          const mOsc = ctx.createOscillator();
          const mGain = ctx.createGain();
          const mT = t + mIdx * 0.45;
          mOsc.type = "triangle";
          mOsc.frequency.setValueAtTime(mFreq, mT);
          mGain.gain.setValueAtTime(0.024, mT);
          mGain.gain.exponentialRampToValueAtTime(0.0001, mT + 0.42);
          mOsc.connect(mGain);
          mGain.connect(ctx.destination);
          mOsc.start(mT);
          mOsc.stop(mT + 0.42);
        });
      } catch (e) {}
    }, 950);
  }

  // 10.B 闖關戰鬥緊張對抗曲 (136 BPM 疾走節奏、熱血 Bassline、倒數壓迫氛圍)
  function playBattleBgm() {
    currentBgmMode = "battle";
    if (isMuted) return;
    initContext();
    if (!ctx) return;

    if (isBgmPlaying && bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    isBgmPlaying = true;
    battleStep = 0;

    // 16 拍戰鬥循環 Bassline (D 小調熱血戰鬥律動)
    const bassNotes = [
      146.83, 146.83, 174.61, 146.83,  // D3, D3, F3, D3
      196.00, 146.83, 220.00, 207.65,  // G3, D3, A3, Ab3
      146.83, 146.83, 130.81, 146.83,  // D3, D3, C3, D3
      233.08, 220.00, 196.00, 164.81   // Bb3, A3, G3, E3
    ];

    // 激昂和弦切分 (每 4 拍一組)
    const battleChords = [
      [293.66, 349.23, 440.00], // Dm (D4, F4, A4)
      [233.08, 293.66, 349.23], // Bb
      [261.63, 329.63, 392.00], // C
      [220.00, 277.18, 329.63]  // A
    ];

    bgmInterval = setInterval(() => {
      if (!isBgmPlaying || isMuted || !ctx || currentBgmMode !== "battle") return;
      try {
        const t = ctx.currentTime;
        const curStep = battleStep % bassNotes.length;
        const bFreq = bassNotes[curStep];
        battleStep++;

        // 1. 強烈節奏 Synth Bass (鋸齒波 + 快速濾波衰減)
        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        bOsc.type = "sawtooth";
        bOsc.frequency.setValueAtTime(bFreq, t);
        bGain.gain.setValueAtTime(0.045, t);
        bGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.18);
        bOsc.connect(bGain);
        bGain.connect(ctx.destination);
        bOsc.start(t);
        bOsc.stop(t + 0.18);

        // 2. 戰鬥小鼓/擊打節奏 (擬真白噪音打擊脈衝)
        if (curStep % 2 === 1) {
          // 在反拍觸發清脆小鼓節奏，強化緊張疾走感
          const bufferSize = ctx.sampleRate * 0.05;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.025, t);
          nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
          whiteNoise.connect(nGain);
          nGain.connect(ctx.destination);
          whiteNoise.start(t);
        }

        // 3. 戰鬥和弦重擊 (每 4 拍正拍落下)
        if (curStep % 4 === 0) {
          const chordIdx = Math.floor(curStep / 4) % battleChords.length;
          const chord = battleChords[chordIdx];
          chord.forEach((f) => {
            const cOsc = ctx.createOscillator();
            const cGain = ctx.createGain();
            cOsc.type = "square";
            cOsc.frequency.setValueAtTime(f, t);
            cGain.gain.setValueAtTime(0.02, t);
            cGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
            cOsc.connect(cGain);
            cGain.connect(ctx.destination);
            cOsc.start(t);
            cOsc.stop(t + 0.4);
          });
        }

        // 4. 高潮緊張琶音 (在後半段 8 拍加入疾速音階)
        if (curStep >= 8) {
          const arpFreq = 587.33 + (curStep % 4) * 110;
          const arpOsc = ctx.createOscillator();
          const arpGain = ctx.createGain();
          arpOsc.type = "triangle";
          arpOsc.frequency.setValueAtTime(arpFreq, t);
          arpGain.gain.setValueAtTime(0.022, t);
          arpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          arpOsc.connect(arpGain);
          arpGain.connect(ctx.destination);
          arpOsc.start(t);
          arpOsc.stop(t + 0.12);
        }
      } catch (e) {}
    }, 220); // ~136 BPM 疾走節奏
  }

  function stopBgm() {
    isBgmPlaying = false;
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function startBgm() {
    playMapBgm();
  }

  function toggleSound() {
    isMuted = !isMuted;
    if (isMuted) {
      stopBgm();
    } else {
      if (currentBgmMode === "battle") {
        playBattleBgm();
      } else {
        playMapBgm();
      }
    }
    return !isMuted;
  }

  return {
    init: initContext,
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
