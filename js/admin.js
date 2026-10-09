/**
 * 《黑金魔法術─永續食物循環系統》- 教師/管理者全方位控制台與簡報檢討系統 (admin.js)
 */

const AdminManager = (function () {
  let isUnlocked = false;
  let currentEditingBank = null;
  let presentationList = [];
  let currentPresIndex = 0;
  let isPresAnswerVisible = true;

  function init() {
    setupAuth();
    setupPasswordEditor();
    setupTabs();
    setupBankManagement();
    setupExamManagement();
    setupRecordAnalytics();
    setupConfigEditor();
    setupImageCenter();
    setupFirebaseManagement();
    setupStorageInfo();
    setupPresentationMode();
  }

  // SHA-256 安全雜湊函式
  async function hashString(str) {
    if (!str) return "";
    try {
      const enc = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {
      console.warn("[Admin] crypto.subtle 不可用:", e);
      return str;
    }
  }

  // 驗證管理密碼 (優先比對 SHA-256 雜湊，預設密碼：j63514219)
  async function verifyAdminPassword(pwd) {
    if (!pwd) return false;
    if (!DataManager.config) {
      await DataManager.loadConfig();
    }
    const cfg = DataManager.config || {};
    // 預設密碼 j63514219 對應的 SHA-256 雜湊值
    const defaultHash = "4f982b0f097f1461dcce7bfbc921813224743fb998d8644f69627eb5db3c0d1f";
    const storedHash = cfg.adminPasswordHash || defaultHash;
    const storedPlain = cfg.adminPassword || "j63514219";

    const inputHash = await hashString(pwd);
    return (inputHash && inputHash === storedHash) || pwd === storedPlain;
  }

  // 1. 密碼驗證解鎖
  function setupAuth() {
    const loginBtn = document.getElementById("btn-admin-login");
    const pwdInput = document.getElementById("admin-password-input");

    loginBtn?.addEventListener("click", async () => {
      const pwd = pwdInput?.value.trim();
      if (!pwd) {
        alert("請輸入管理密碼！");
        pwdInput?.focus();
        return;
      }

      const isValid = await verifyAdminPassword(pwd);
      if (isValid) {
        isUnlocked = true;
        document.getElementById("admin-auth-section")?.classList.add("hidden");
        document.getElementById("admin-manage-section")?.classList.remove("hidden");
        document.getElementById("btn-open-password-modal")?.classList.remove("hidden");
        loadAllAdminData();
      } else {
        alert("管理密碼錯誤！請重新輸入。");
        if (pwdInput) {
          pwdInput.value = "";
          pwdInput.focus();
        }
      }
    });

    pwdInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginBtn?.click();
    });

    document.getElementById("btn-close-admin")?.addEventListener("click", () => {
      document.getElementById("admin-modal")?.classList.add("hidden");
    });
  }

  // 1.1 修改管理密碼系統
  function setupPasswordEditor() {
    const openBtn = document.getElementById("btn-open-password-modal");
    const modal = document.getElementById("admin-password-modal");
    const closeBtn = document.getElementById("btn-close-password-modal");
    const cancelBtn = document.getElementById("btn-cancel-change-password");
    const saveBtn = document.getElementById("btn-save-new-password");
    const showChk = document.getElementById("chk-show-password");

    const oldInput = document.getElementById("input-old-password");
    const newInput = document.getElementById("input-new-password");
    const confirmInput = document.getElementById("input-confirm-password");

    const closeModal = () => {
      modal?.classList.add("hidden");
      if (oldInput) oldInput.value = "";
      if (newInput) newInput.value = "";
      if (confirmInput) confirmInput.value = "";
      if (showChk) showChk.checked = false;
      togglePasswordVisibility(false);
    };

    openBtn?.addEventListener("click", () => {
      AudioManager.playClick();
      modal?.classList.remove("hidden");
      oldInput?.focus();
    });

    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);

    showChk?.addEventListener("change", () => {
      togglePasswordVisibility(showChk.checked);
    });

    function togglePasswordVisibility(show) {
      const type = show ? "text" : "password";
      if (oldInput) oldInput.type = type;
      if (newInput) newInput.type = type;
      if (confirmInput) confirmInput.type = type;
    }

    saveBtn?.addEventListener("click", async () => {
      AudioManager.playClick();
      const oldPwd = oldInput?.value.trim() || "";
      const newPwd = newInput?.value.trim() || "";
      const confirmPwd = confirmInput?.value.trim() || "";

      if (!oldPwd) {
        alert("請輸入目前使用的管理密碼！");
        oldInput?.focus();
        return;
      }

      const isOldValid = await verifyAdminPassword(oldPwd);
      if (!isOldValid) {
        alert("目前密碼輸入錯誤，驗證失敗！");
        oldInput?.focus();
        return;
      }

      if (newPwd.length < 6) {
        alert("新密碼長度過短，請至少設定 6 位以上字元！");
        newInput?.focus();
        return;
      }

      if (newPwd !== confirmPwd) {
        alert("兩次輸入的新密碼不相符，請再次確認！");
        confirmInput?.focus();
        return;
      }

      if (newPwd === oldPwd) {
        alert("新密碼不能與目前密碼相同！");
        newInput?.focus();
        return;
      }

      // 產生新密碼之 SHA-256 雜湊
      const newHash = await hashString(newPwd);

      try {
        if (!DataManager.config) await DataManager.loadConfig();
        const currentCfg = DataManager.config || {};
        currentCfg.adminPassword = newPwd;
        currentCfg.adminPasswordHash = newHash;
        currentCfg.passwordUpdatedAt = new Date().toISOString();

        // 寫入資料庫 (雲端 Firestore 或本地 config.json)
        await DataManager.saveConfig(currentCfg);

        alert("🎉 管理密碼已成功更新並寫入資料庫！\n下次登入教師後台請使用新設定的密碼。");
        closeModal();
      } catch (err) {
        console.error("[Admin] 儲存密碼失敗:", err);
        alert(`❌ 密碼儲存失敗：${err.message}`);
      }
    });
  }

  // 2. 標籤頁切換
  function setupTabs() {
    const tabs = [
      { btn: "tab-btn-banks", panel: "tab-panel-banks", onShow: renderBanksTab },
      { btn: "tab-btn-exams", panel: "tab-panel-exams", onShow: renderExamsTab },
      { btn: "tab-btn-records", panel: "tab-panel-records", onShow: renderRecordsTab },
      { btn: "tab-btn-heroes", panel: "tab-panel-heroes", onShow: renderHeroesTab },
      { btn: "tab-btn-images", panel: "tab-panel-images", onShow: renderImagesTab },
      { btn: "tab-btn-firebase", panel: "tab-panel-firebase", onShow: renderFirebaseTab },
      { btn: "tab-btn-storage", panel: "tab-panel-storage", onShow: renderStorageTab },
    ];

    tabs.forEach((t) => {
      document.getElementById(t.btn)?.addEventListener("click", () => {
        AudioManager.playClick();
        document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".admin-tab-panel").forEach((p) => p.classList.add("hidden"));

        document.getElementById(t.btn)?.classList.add("active");
        document.getElementById(t.panel)?.classList.remove("hidden");
        if (t.onShow) t.onShow();
      });
    });
  }

  async function loadAllAdminData() {
    await DataManager.loadConfig();
    await DataManager.loadQuestionBanks();
    await DataManager.loadExams();
    await DataManager.loadStudentRecords();
    updateRandomizeSettingUI();
    renderBanksTab();
  }

  function updateRandomizeSettingUI() {
    const isRandomize = DataManager.config?.randomizeOptions !== false;
    const checkbox1 = document.getElementById("setting-randomize-options");
    const badge1 = document.getElementById("badge-randomize-status");
    const text1 = document.getElementById("setting-randomize-text");

    const checkbox2 = document.getElementById("setting-randomize-options-exam");
    const badge2 = document.getElementById("badge-randomize-status-exam");
    const text2 = document.getElementById("setting-randomize-text-exam");

    if (checkbox1) checkbox1.checked = isRandomize;
    if (checkbox2) checkbox2.checked = isRandomize;

    if (badge1) {
      if (isRandomize) {
        badge1.textContent = "🟢 隨機排列中（已啟用）";
        badge1.style.background = "rgba(52, 211, 153, 0.2)";
        badge1.style.color = "#34d399";
      } else {
        badge1.textContent = "⚪ 固定題庫原序（已停用）";
        badge1.style.background = "rgba(148, 163, 184, 0.2)";
        badge1.style.color = "#94a3b8";
      }
    }
    if (badge2) {
      if (isRandomize) {
        badge2.textContent = "🟢 隨機排列中";
        badge2.style.background = "rgba(52, 211, 153, 0.2)";
        badge2.style.color = "#34d399";
      } else {
        badge2.textContent = "⚪ 固定題庫原序";
        badge2.style.background = "rgba(148, 163, 184, 0.2)";
        badge2.style.color = "#94a3b8";
      }
    }
    if (text1) {
      text1.textContent = isRandomize ? "選項隨機打亂 (開啟)" : "選項固定原序 (停用)";
      text1.style.color = isRandomize ? "#34d399" : "#94a3b8";
    }
    if (text2) {
      text2.textContent = isRandomize ? "選項隨機打亂 (已啟用)" : "選項固定原序 (已停用)";
      text2.style.color = isRandomize ? "#38bdf8" : "#94a3b8";
    }
  }

  async function handleToggleRandomize(newVal) {
    AudioManager.playClick();
    if (!DataManager.config) await DataManager.loadConfig();
    DataManager.config.randomizeOptions = newVal;
    await DataManager.saveConfig(DataManager.config);
    updateRandomizeSettingUI();
    const msg = newVal
      ? "✅ 已開啟【題目選項隨機打亂】：\n學生闖關時題目選項將動態隨機打亂，正確答案隨機落在 A、B、C 或 D，引導學生認真看題！"
      : "ℹ️ 已停用【題目選項隨機打亂】：\n學生闖關時題目選項將保持題庫預設原始順序。";
    alert(msg);
  }

  // =========================================================================
  // Tab 1: 題庫管理與派送
  // =========================================================================
  function setupBankManagement() {
    // 選項隨機打亂開關事件綁定
    document.getElementById("setting-randomize-options")?.addEventListener("change", (e) => {
      handleToggleRandomize(e.target.checked);
    });
    document.getElementById("setting-randomize-options-exam")?.addEventListener("change", (e) => {
      handleToggleRandomize(e.target.checked);
    });
    // 複製 Gemini AI Prompt
    document.getElementById("btn-copy-ai-prompt")?.addEventListener("click", () => {
      const promptText = document.getElementById("ai-prompt-template-text")?.textContent;
      navigator.clipboard.writeText(promptText).then(() => {
        alert("✅ Gemini AI 出題 Prompt 已成功複製到剪貼簿！可直接貼給 Google Gemini 產生題目。");
      });
    });

    // 帶入示範 CSV (支援伺服器 API、GitHub Pages 靜態檔案與內建示範題目三層防護)
    document.getElementById("btn-load-sample-csv")?.addEventListener("click", async () => {
      AudioManager.playClick();
      let text = null;
      try {
        const res = await fetch("/api/sample-csv");
        if (res.ok) text = await res.text();
      } catch (e) {}

      if (!text) {
        try {
          const res2 = await fetch("Game-data/sample_import.csv");
          if (res2.ok) text = await res2.text();
        } catch (e) {}
      }

      if (!text) {
        text = `題目,正確答案,選項1,選項2,選項3,選項4,題目解析\n在生態農耕中被稱為「黑色黃金」的是什麼？,2,石油原油,充分發酵熟成的有機堆肥,燒焦木炭粉,黑芝麻粉,黑金指的是富含有機質與微生物養分的高品質腐植質堆肥。\n吃營養午餐時哪種做法最符合惜食減量精神？,1,吃多少盛多少不夠再去添,盛一大座小山吃不完倒掉,偷偷把菜丟進抽屜,比誰倒掉最多,源頭減量是避免食物浪費最有效的第一步。\n吃完香蕉剩下的香蕉皮屬於哪種分類？,1,生廚餘（黑金堆肥）,熟廚餘（養豬）,廢紙類,一般垃圾,未烹煮的植物殘渣屬於生廚餘。\n便當盒上的橡皮筋丟進廚餘桶會造成什麼危害？,1,無法分解且會傷害豬隻腸胃與土壤,會讓堆肥變香,會被微生物完全吸收,沒有任何影響,橡皮筋是高彈性塑膠異物務必先挑出。\n堆肥太濕發出刺鼻阿摩尼亞臭味時該怎麼改善？,1,加入乾枯葉或碎紙並翻堆透氣,再倒三大桶水,密封所有氣孔,把落葉挑出來,加入乾含碳材料吸收過剩水分並翻堆進氣可迅速除臭。`;
      }

      const txtArea = document.getElementById("admin-csv-textarea");
      if (txtArea) txtArea.value = text;
      const bName = document.getElementById("admin-bank-name");
      if (bName) bName.value = "示範：黑金魔法基礎題庫";
      const bCat = document.getElementById("admin-bank-category");
      if (bCat) bCat.value = "生態試煉";
      const bDesc = document.getElementById("admin-bank-desc");
      if (bDesc) bDesc.value = "快速測試匯入的標準 CSV 題目";
    });

    // 建立新題庫組
    document.getElementById("btn-create-bank")?.addEventListener("click", async () => {
      const name = document.getElementById("admin-bank-name")?.value.trim();
      const cat = document.getElementById("admin-bank-category")?.value.trim() || "自然生態";
      const desc = document.getElementById("admin-bank-desc")?.value.trim() || "";
      const csv = document.getElementById("admin-csv-textarea")?.value.trim();

      if (!name) {
        alert("請輸入題庫名稱！");
        return;
      }
      if (!csv) {
        alert("請在下方貼上 CSV 題目內容！");
        return;
      }

      const questions = parseCSVToQuestions(csv);
      if (questions.length === 0) {
        alert("未能成功解析出任何有效題目，請確認 CSV 格式是否為：題目,正確答案編號,選項1,選項2,選項3,選項4");
        return;
      }

      const newBank = {
        id: `bank_${Date.now()}`,
        name,
        category: cat,
        desc,
        enabled: true,
        createdAt: new Date().toISOString(),
        questions,
      };

      const banks = DataManager.banks;
      banks.push(newBank);
      await DataManager.saveQuestionBanks(banks);

      alert(`🎉 成功建立題庫【${name}】，共解析匯入 ${questions.length} 道題目！`);
      document.getElementById("admin-bank-name").value = "";
      document.getElementById("admin-bank-category").value = "";
      document.getElementById("admin-bank-desc").value = "";
      document.getElementById("admin-csv-textarea").value = "";
      renderBanksTab();
    });

    // 展開派送測驗面板
    document.getElementById("btn-show-dispatch-modal")?.addEventListener("click", () => {
      const panel = document.getElementById("dispatch-exam-panel");
      panel?.classList.toggle("hidden");
    });
    document.getElementById("btn-cancel-dispatch")?.addEventListener("click", () => {
      document.getElementById("dispatch-exam-panel")?.classList.add("hidden");
    });

    // 確認派送測驗
    document.getElementById("btn-confirm-dispatch")?.addEventListener("click", async () => {
      const title = document.getElementById("dispatch-exam-title")?.value.trim();
      const cat = document.getElementById("dispatch-exam-category")?.value.trim() || "綜合測驗";
      const desc = document.getElementById("dispatch-exam-desc")?.value.trim() || "";

      if (!title) {
        alert("請輸入測驗主題名稱！");
        return;
      }

      const checkedBankIds = Array.from(document.querySelectorAll(".bank-checkbox:checked")).map((cb) => cb.dataset.bankId);
      if (checkedBankIds.length === 0) {
        alert("請至少勾選一組題庫以組裝測驗！");
        return;
      }

      const newExam = {
        id: `exam_${Date.now()}`,
        title,
        category: cat,
        desc,
        bankIds: checkedBankIds,
        questionCount: 15,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const exams = DataManager.exams;
      exams.push(newExam);
      await DataManager.saveExams(exams);

      alert(`🚀 成功派送主題測驗【${title}】！學生端主畫面已可選考！`);
      document.getElementById("dispatch-exam-panel")?.classList.add("hidden");
      document.getElementById("dispatch-exam-title").value = "";
      renderBanksTab();
    });
  }

  function parseCSVToQuestions(csvText) {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
    const result = [];

    lines.forEach((line) => {
      // 略過表頭行
      if (line.includes("題目") && line.includes("選項")) return;

      const cols = line.split(",").map((c) => c.trim());
      if (cols.length >= 6) {
        const qText = cols[0];
        let ansNum = parseInt(cols[1], 10);
        if (isNaN(ansNum) || ansNum < 1 || ansNum > 4) ansNum = 1;

        const opt1 = cols[2];
        const opt2 = cols[3];
        const opt3 = cols[4];
        const opt4 = cols[5];
        const exp = cols[6] || "";

        if (qText && opt1 && opt2) {
          result.push({
            question: qText,
            options: [opt1, opt2, opt3, opt4],
            answer: ansNum,
            explanation: exp,
          });
        }
      }
    });

    return result;
  }

  function renderBanksTab() {
    const container = document.getElementById("admin-bank-list-container");
    if (!container) return;
    container.innerHTML = "";

    const banks = DataManager.banks || [];
    if (banks.length === 0) {
      container.innerHTML = `<div style="color: #94a3b8; padding: 16px; text-align: center;">目前無任何題庫，請在下方建立新題庫組！</div>`;
      return;
    }

    banks.forEach((bank) => {
      const card = document.createElement("div");
      card.className = "bank-card";
      card.style.cssText = "background: rgba(30, 41, 59, 0.7); border: 1.5px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 12px;";

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <input type="checkbox" class="bank-checkbox" data-bank-id="${bank.id}" style="width: 18px; height: 18px; cursor: pointer;">
          <div>
            <div style="font-weight: 800; color: #fde047; font-size: 14.5px;">${bank.name}</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">
              <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 6px;">${bank.category || "未分類"}</span>
              <span style="margin-left: 8px;">共 <strong>${bank.questions?.length || 0}</strong> 道題目</span>
              <span style="margin-left: 8px; color: #94a3b8;">${bank.desc || ""}</span>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="jrpg-btn btn-edit-bank" data-bank-id="${bank.id}" style="background: #0284c7; color: #fff; font-size: 12px; padding: 5px 12px;">✏️ 編輯題目</button>
          <button class="jrpg-btn btn-delete-bank" data-bank-id="${bank.id}" style="background: #b91c1c; color: #fff; font-size: 12px; padding: 5px 12px;">🗑️ 刪除</button>
        </div>
      `;

      // 編輯題目按鈕
      card.querySelector(".btn-edit-bank")?.addEventListener("click", () => {
        openBankQuestionEditor(bank);
      });

      // 刪除題庫按鈕
      card.querySelector(".btn-delete-bank")?.addEventListener("click", async () => {
        if (confirm(`確定要刪除題庫【${bank.name}】嗎？此動作無法復原！`)) {
          const newBanks = DataManager.banks.filter((b) => b.id !== bank.id);
          await DataManager.saveQuestionBanks(newBanks);
          renderBanksTab();
        }
      });

      container.appendChild(card);
    });

    // 勾選計數更新
    document.querySelectorAll(".bank-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => {
        const count = document.querySelectorAll(".bank-checkbox:checked").length;
        document.getElementById("admin-banks-summary").textContent = `已勾選 ${count} 組題庫`;
      });
    });
  }

  // 題目線上編輯器 Modal
  function openBankQuestionEditor(bank) {
    currentEditingBank = JSON.parse(JSON.stringify(bank));
    const modal = document.getElementById("bank-questions-editor-modal");
    document.getElementById("bank-editor-name").textContent = currentEditingBank.name;
    document.getElementById("bank-editor-count-badge").textContent = `${currentEditingBank.questions?.length || 0} 題`;

    renderBankEditorQuestions();

    document.getElementById("btn-close-bank-editor").onclick = () => modal.classList.add("hidden");
    document.getElementById("btn-cancel-bank-editor").onclick = () => modal.classList.add("hidden");

    document.getElementById("btn-editor-add-question").onclick = () => {
      currentEditingBank.questions.push({
        question: "新題目內容？",
        options: ["選項 A", "選項 B", "選項 C", "選項 D"],
        answer: 1,
        explanation: "題目觀念解析說明。",
      });
      renderBankEditorQuestions();
    };

    document.getElementById("btn-save-bank-editor").onclick = async () => {
      // 儲存修改
      const bankIdx = DataManager.banks.findIndex((b) => b.id === currentEditingBank.id);
      if (bankIdx !== -1) {
        DataManager.banks[bankIdx] = currentEditingBank;
        await DataManager.saveQuestionBanks(DataManager.banks);
        alert("💾 題庫所有修改已成功儲存！");
        modal.classList.add("hidden");
        renderBanksTab();
      }
    };

    modal.classList.remove("hidden");
  }

  function renderBankEditorQuestions() {
    const list = document.getElementById("bank-editor-questions-list");
    if (!list) return;
    list.innerHTML = "";

    const questions = currentEditingBank.questions || [];
    questions.forEach((q, idx) => {
      const qCard = document.createElement("div");
      qCard.style.cssText = "background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";

      qCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 13px;">第 ${idx + 1} 題：</strong>
          <button class="jrpg-btn btn-del-q" data-idx="${idx}" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; font-size: 11px; padding: 2px 8px;">刪除此題</button>
        </div>
        <input type="text" class="jrpg-input q-title-input" value="${q.question}" style="width: 100%; text-align: left; font-size: 13px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
          <div><label style="font-size: 11px; color: #94a3b8;">選項 1 (A)</label><input type="text" class="jrpg-input q-opt-input" data-opt="0" value="${q.options[0] || ""}" style="width: 100%; text-align: left; font-size: 12px;"></div>
          <div><label style="font-size: 11px; color: #94a3b8;">選項 2 (B)</label><input type="text" class="jrpg-input q-opt-input" data-opt="1" value="${q.options[1] || ""}" style="width: 100%; text-align: left; font-size: 12px;"></div>
          <div><label style="font-size: 11px; color: #94a3b8;">選項 3 (C)</label><input type="text" class="jrpg-input q-opt-input" data-opt="2" value="${q.options[2] || ""}" style="width: 100%; text-align: left; font-size: 12px;"></div>
          <div><label style="font-size: 11px; color: #94a3b8;">選項 4 (D)</label><input type="text" class="jrpg-input q-opt-input" data-opt="3" value="${q.options[3] || ""}" style="width: 100%; text-align: left; font-size: 12px;"></div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 12px; color: #fde047; font-weight: bold;">正確答案編號：</label>
          <select class="jrpg-select q-ans-select" style="font-size: 12px; padding: 2px 8px;">
            <option value="1" ${q.answer === 1 ? "selected" : ""}>選項 1 (A)</option>
            <option value="2" ${q.answer === 2 ? "selected" : ""}>選項 2 (B)</option>
            <option value="3" ${q.answer === 3 ? "selected" : ""}>選項 3 (C)</option>
            <option value="4" ${q.answer === 4 ? "selected" : ""}>選項 4 (D)</option>
          </select>
        </div>
        <div>
          <label style="font-size: 11px; color: #94a3b8;">題目解析說明：</label>
          <input type="text" class="jrpg-input q-exp-input" value="${q.explanation || ""}" style="width: 100%; text-align: left; font-size: 12px;">
        </div>
      `;

      // 監聽變更
      qCard.querySelector(".q-title-input")?.addEventListener("input", (e) => (q.question = e.target.value));
      qCard.querySelectorAll(".q-opt-input").forEach((inp) => {
        inp.addEventListener("input", (e) => {
          q.options[parseInt(inp.dataset.opt, 10)] = e.target.value;
        });
      });
      qCard.querySelector(".q-ans-select")?.addEventListener("change", (e) => (q.answer = parseInt(e.target.value, 10)));
      qCard.querySelector(".q-exp-input")?.addEventListener("input", (e) => (q.explanation = e.target.value));

      // 刪除題目
      qCard.querySelector(".btn-del-q")?.addEventListener("click", () => {
        currentEditingBank.questions.splice(idx, 1);
        renderBankEditorQuestions();
      });

      list.appendChild(qCard);
    });
  }

  // =========================================================================
  // Tab 2: 主題測驗管理
  // =========================================================================
  function setupExamManagement() {}

  function renderExamsTab() {
    const container = document.getElementById("admin-exams-list-container");
    if (!container) return;
    container.innerHTML = "";

    const exams = DataManager.exams || [];
    if (exams.length === 0) {
      container.innerHTML = `<div style="color: #94a3b8; padding: 16px; text-align: center;">目前無任何主題測驗，請至「題庫管理」勾選題庫進行派送！</div>`;
      return;
    }

    exams.forEach((exam) => {
      const card = document.createElement("div");
      card.style.cssText = "background: rgba(30, 41, 59, 0.7); border: 1.5px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; gap: 14px;";

      const isEnabled = exam.enabled !== false;
      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #fde047; font-size: 15px;">${exam.title}</strong>
            <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 11px; padding: 2px 8px; border-radius: 10px;">${exam.category || "一般"}</span>
            <span style="font-size: 11px; color: ${isEnabled ? "#34d399" : "#f87171"}; font-weight: bold;">${isEnabled ? "🟢 施測啟用中" : "🔴 已停用隱藏"}</span>
          </div>
          <div style="font-size: 12.5px; color: #cbd5e1; margin-top: 4px;">${exam.desc || "無說明"}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">綁定題庫組別：${(exam.bankIds || []).length} 組 ｜ 每次測驗題數：約 ${exam.questionCount || 15} 題</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="jrpg-btn btn-toggle-exam" style="background: ${isEnabled ? "#d97706" : "#059669"}; color: #fff; font-size: 12px; padding: 6px 12px;">
            ${isEnabled ? "⏸️ 停用此測驗" : "▶️ 啟用此測驗"}
          </button>
          <button class="jrpg-btn btn-del-exam" style="background: #b91c1c; color: #fff; font-size: 12px; padding: 6px 12px;">🗑️ 刪除</button>
        </div>
      `;

      card.querySelector(".btn-toggle-exam")?.addEventListener("click", async () => {
        exam.enabled = !isEnabled;
        await DataManager.saveExams(DataManager.exams);
        renderExamsTab();
      });

      card.querySelector(".btn-del-exam")?.addEventListener("click", async () => {
        if (confirm(`確定要刪除測驗【${exam.title}】嗎？`)) {
          const newExams = DataManager.exams.filter((e) => e.id !== exam.id);
          await DataManager.saveExams(newExams);
          renderExamsTab();
        }
      });

      container.appendChild(card);
    });
  }

  // =========================================================================
  // Tab 3: 學生作答分析與錯題本
  // =========================================================================
  function setupRecordAnalytics() {
    // 檢視切換：學生名冊 vs 錯題排行榜
    document.getElementById("view-btn-students")?.addEventListener("click", () => {
      document.getElementById("view-btn-students")?.classList.add("active");
      document.getElementById("view-btn-mistakes")?.classList.remove("active");
      document.getElementById("student-records-container")?.classList.remove("hidden");
      document.getElementById("mistake-analysis-container")?.classList.add("hidden");
    });

    document.getElementById("view-btn-mistakes")?.addEventListener("click", () => {
      document.getElementById("view-btn-mistakes")?.classList.add("active");
      document.getElementById("view-btn-students")?.classList.remove("active");
      document.getElementById("mistake-analysis-container")?.classList.remove("hidden");
      document.getElementById("student-records-container")?.classList.add("hidden");
      renderMistakeRankings();
    });

    // 累積錯題點擊快捷跳轉
    document.getElementById("card-stat-mistakes")?.addEventListener("click", () => {
      document.getElementById("view-btn-mistakes")?.click();
    });

    // 清除作答紀錄
    document.getElementById("btn-clear-records")?.addEventListener("click", async () => {
      if (confirm("⚠️ 警告：確定要清空所有學生的作答歷程紀錄嗎？此動作無法復原！")) {
        await DataManager.deleteRecord({ all: true });
        renderRecordsTab();
        alert("已清空所有學生作答紀錄！");
      }
    });

    // 將錯題打包成新題庫
    document.getElementById("btn-pack-mistakes")?.addEventListener("click", async () => {
      const records = DataManager.records || [];
      const mistakeMap = new Map();

      records.forEach((r) => {
        (r.details || []).forEach((d) => {
          if (!d.isCorrect) {
            if (!mistakeMap.has(d.question)) {
              mistakeMap.set(d.question, {
                question: d.question,
                options: d.options,
                answer: d.correctIndex + 1,
                explanation: d.explanation || "學生常見迷思概念題目",
              });
            }
          }
        });
      });

      if (mistakeMap.size === 0) {
        alert("目前沒有任何學生錯題可供打包！");
        return;
      }

      const questions = Array.from(mistakeMap.values());
      const newBank = {
        id: `bank_mistakes_${Date.now()}`,
        name: `🎯 精選全班錯題強化庫 (${new Date().toLocaleDateString("zh-TW")})`,
        category: "弱點補救",
        desc: "系統自動將學生答錯頻率最高之題目打包成專屬補救練習題庫",
        enabled: true,
        createdAt: new Date().toISOString(),
        questions,
      };

      DataManager.banks.push(newBank);
      await DataManager.saveQuestionBanks(DataManager.banks);

      alert(`🎉 成功將 ${questions.length} 道錯題打包建立為新題庫【${newBank.name}】！可至題庫分頁進行派送。`);
    });
  }

  function renderRecordsTab() {
    const records = DataManager.records || [];

    // 指標看板計算
    const totalStudents = records.length;
    let avgAcc = 0;
    let avgScore = 0;
    let totalMistakes = 0;

    if (totalStudents > 0) {
      const sumAcc = records.reduce((s, r) => s + (r.accuracy || 0), 0);
      const sumScore = records.reduce((s, r) => s + (r.score || 0), 0);
      avgAcc = Math.round(sumAcc / totalStudents);
      avgScore = Math.round(sumScore / totalStudents);

      const mistakeSet = new Set();
      records.forEach((r) => {
        (r.details || []).forEach((d) => {
          if (!d.isCorrect) mistakeSet.add(d.question);
        });
      });
      totalMistakes = mistakeSet.size;
    }

    document.getElementById("stat-total-students").textContent = totalStudents;
    document.getElementById("stat-avg-accuracy").textContent = `${avgAcc}%`;
    document.getElementById("stat-avg-score").textContent = avgScore;
    document.getElementById("stat-total-mistakes").textContent = `${totalMistakes} 題`;

    // 渲染學生歷程表格
    renderStudentRecordsTable(records);
  }

  function renderStudentRecordsTable(records) {
    const container = document.getElementById("student-records-container");
    if (!container) return;
    container.innerHTML = "";

    if (records.length === 0) {
      container.innerHTML = `<div style="color: #94a3b8; padding: 24px; text-align: center;">目前尚無任何學生作答歷程，學生開戰後數據將即時顯示在此。</div>`;
      return;
    }

    const table = document.createElement("table");
    table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;";
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.2); color: #fde047;">
          <th style="padding: 8px;">作答時間</th>
          <th style="padding: 8px;">學生姓名</th>
          <th style="padding: 8px;">冒險積分</th>
          <th style="padding: 8px;">答對率</th>
          <th style="padding: 8px;">答對 / 總題數</th>
          <th style="padding: 8px; text-align: right;">操作</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;

    const tbody = table.querySelector("tbody");
    records.forEach((r) => {
      const tr = document.createElement("tr");
      tr.style.cssText = "border-bottom: 1px solid rgba(255, 255, 255, 0.08);";
      const timeStr = r.completedAt ? new Date(r.completedAt).toLocaleString("zh-TW", { hour12: false }) : "-";

      tr.innerHTML = `
        <td style="padding: 8px; color: #94a3b8;">${timeStr}</td>
        <td style="padding: 8px; font-weight: bold; color: #f1f5f9;">${r.studentName}</td>
        <td style="padding: 8px; color: #fde047; font-weight: bold;">${r.score || 0}</td>
        <td style="padding: 8px; color: ${r.accuracy >= 80 ? "#34d399" : r.accuracy >= 60 ? "#fde047" : "#f87171"}; font-weight: bold;">${r.accuracy || 0}%</td>
        <td style="padding: 8px;">${r.correctCount || 0} / ${r.totalQuestions || 0}</td>
        <td style="padding: 8px; text-align: right;">
          <button class="jrpg-btn btn-view-detail" style="background: #0284c7; color: #fff; font-size: 11px; padding: 3px 8px;">📝 答題詳情</button>
        </td>
      `;

      tr.querySelector(".btn-view-detail")?.addEventListener("click", () => {
        openStudentDetailModal(r);
      });

      tbody.appendChild(tr);
    });

    container.appendChild(table);
  }

  function openStudentDetailModal(record) {
    const modal = document.getElementById("student-detail-modal");
    document.getElementById("student-detail-title").textContent = `📝 【${record.studentName}】作答詳情分析`;
    document.getElementById("student-detail-summary").innerHTML = `
      作答時間：${record.completedAt ? new Date(record.completedAt).toLocaleString("zh-TW") : "-"} ｜ 
      總分：<strong style="color: #fde047;">${record.score}</strong> ｜ 
      答對率：<strong style="color: #34d399;">${record.accuracy}%</strong>
    `;

    const list = document.getElementById("student-detail-questions-list");
    list.innerHTML = "";

    (record.details || []).forEach((d, idx) => {
      const card = document.createElement("div");
      card.style.cssText = `background: rgba(30, 41, 59, 0.7); border-left: 4px solid ${d.isCorrect ? "#10b981" : "#ef4444"}; border-radius: 6px; padding: 10px 14px;`;
      const userOpt = d.options[d.selectedIndex] || `選項 ${d.selectedIndex + 1}`;
      const correctOpt = d.options[d.correctIndex] || `選項 ${d.correctIndex + 1}`;

      card.innerHTML = `
        <div style="font-weight: bold; color: #f1f5f9; font-size: 13.5px; margin-bottom: 4px;">
          ${idx + 1}. ${d.question}
        </div>
        <div style="font-size: 12.5px; margin-bottom: 4px;">
          學生選答：<span style="color: ${d.isCorrect ? "#34d399" : "#f87171"}; font-weight: bold;">${userOpt}</span>
          ${!d.isCorrect ? ` ｜ 正確答案：<span style="color: #34d399; font-weight: bold;">${correctOpt}</span>` : ""}
        </div>
        <div style="font-size: 12px; color: #cbd5e1; background: rgba(0, 0, 0, 0.3); padding: 4px 8px; border-radius: 4px;">
          💡 解析：${d.explanation || "無補充解析"}
        </div>
      `;
      list.appendChild(card);
    });

    document.getElementById("btn-close-student-detail").onclick = () => modal.classList.add("hidden");
    modal.classList.remove("hidden");
  }

  // 渲染錯題排行榜
  function renderMistakeRankings() {
    const container = document.getElementById("mistake-analysis-container");
    if (!container) return;
    container.innerHTML = "";

    const records = DataManager.records || [];
    const questionMap = new Map();

    records.forEach((r) => {
      (r.details || []).forEach((d) => {
        if (!questionMap.has(d.question)) {
          questionMap.set(d.question, {
            question: d.question,
            options: d.options,
            correctIndex: d.correctIndex,
            explanation: d.explanation,
            chapterTitle: d.chapterTitle || "生態關卡",
            totalAnswers: 0,
            wrongCount: 0,
            optionPicks: [0, 0, 0, 0],
            wrongStudents: [], // { name, choice }
          });
        }

        const qData = questionMap.get(d.question);
        qData.totalAnswers++;
        if (d.selectedIndex >= 0 && d.selectedIndex < 4) {
          qData.optionPicks[d.selectedIndex]++;
        }
        if (!d.isCorrect) {
          qData.wrongCount++;
          qData.wrongStudents.push({
            name: r.studentName,
            choice: d.selectedIndex,
            choiceText: d.options[d.selectedIndex] || `選項 ${d.selectedIndex + 1}`,
          });
        }
      });
    });

    // 依照「答錯次數由多到少」排序
    const sortedList = Array.from(questionMap.values())
      .filter((q) => q.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount);

    presentationList = sortedList; // 供簡報模式投影使用

    if (sortedList.length === 0) {
      container.innerHTML = `<div style="color: #34d399; padding: 24px; text-align: center; font-size: 15px;">🎉 太厲害了！目前全班沒有任何累積錯題！</div>`;
      return;
    }

    // 頂部課堂簡報模式進入按鈕
    const topBar = document.createElement("div");
    topBar.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;";
    topBar.innerHTML = `
      <span style="font-size: 13.5px; color: #fde047; font-weight: bold;">共找出 ${sortedList.length} 道高頻迷思錯題（按答錯人數排序）：</span>
      <button id="btn-launch-presentation" class="jrpg-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-weight: 800; padding: 6px 16px; font-size: 13px;">
        📽️ 開啟課堂討論全畫面簡報模式
      </button>
    `;
    topBar.querySelector("#btn-launch-presentation")?.addEventListener("click", () => {
      openPresentationMode(0);
    });
    container.appendChild(topBar);

    sortedList.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "mistake-card";
      const accPct = Math.round(((q.totalAnswers - q.wrongCount) / q.totalAnswers) * 100);

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="background: ${idx === 0 ? "#ef4444" : idx === 1 ? "#f59e0b" : "#64748b"}; color: #fff; font-weight: 900; font-size: 12px; padding: 2px 8px; border-radius: 10px;">
            排行榜 TOP ${idx + 1}
          </span>
          <span style="font-size: 12px; color: #f87171; font-weight: bold;">全班答錯 ${q.wrongCount} 人 ｜ 答對率 ${accPct}%</span>
        </div>
        <div style="font-size: 14.5px; font-weight: 800; color: #fde047; margin-bottom: 8px;">${q.question}</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px;">
          ${q.options.map((opt, oIdx) => `
            <div style="background: ${oIdx === q.correctIndex ? "rgba(16, 185, 129, 0.25)" : "rgba(15, 23, 42, 0.6)"}; border: 1px solid ${oIdx === q.correctIndex ? "#10b981" : "rgba(255,255,255,0.1)"}; border-radius: 6px; padding: 6px 10px; font-size: 12px; display: flex; justify-content: space-between;">
              <span style="color: ${oIdx === q.correctIndex ? "#34d399" : "#cbd5e1"}; font-weight: ${oIdx === q.correctIndex ? "bold" : "normal"};">
                ${String.fromCharCode(65 + oIdx)}. ${opt} ${oIdx === q.correctIndex ? "✅" : ""}
              </span>
              <span style="color: #94a3b8;">${q.optionPicks[oIdx]} 人選</span>
            </div>
          `).join("")}
        </div>
        <div style="font-size: 12px; color: #cbd5e1; background: rgba(6, 78, 59, 0.4); padding: 6px 10px; border-radius: 6px; border-left: 3px solid #10b981; margin-bottom: 6px;">
          💡 <strong>觀念詳解：</strong>${q.explanation || "請注意此概念之關鍵細節！"}
        </div>
        <div style="font-size: 11.5px; color: #94a3b8;">
          👥 <strong>答錯學生名單：</strong>${q.wrongStudents.map((ws) => `<span style="color: #fca5a5; margin-right: 6px;">${ws.name} (選 ${String.fromCharCode(65 + ws.choice)})</span>`).join(", ")}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // =========================================================================
  // Tab 4: 勇者與關主數值調整 (修復切換點選與各項攻防數值即時讀寫)
  // =========================================================================
  let currentHeroKey = "hero_purple";
  let currentBossIdx = 0;

  function setupConfigEditor() {
    // 子標籤切換 (四大守護勇者設定 vs 五大關卡魔王設定)
    document.getElementById("subtab-btn-heroes")?.addEventListener("click", () => {
      AudioManager.playClick();
      document.getElementById("subtab-btn-heroes")?.classList.add("active");
      document.getElementById("subtab-btn-bosses")?.classList.remove("active");
      document.getElementById("subpanel-heroes-config")?.classList.remove("hidden");
      document.getElementById("subpanel-bosses-config")?.classList.add("hidden");
      loadHeroInputs(currentHeroKey);
    });

    document.getElementById("subtab-btn-bosses")?.addEventListener("click", () => {
      AudioManager.playClick();
      document.getElementById("subtab-btn-bosses")?.classList.add("active");
      document.getElementById("subtab-btn-heroes")?.classList.remove("active");
      document.getElementById("subpanel-bosses-config")?.classList.remove("hidden");
      document.getElementById("subpanel-heroes-config")?.classList.add("hidden");
      loadBossInputs(currentBossIdx);
    });

    // 勇者膠囊切換 (全按鈕安全綁定)
    const heroBtns = document.querySelectorAll("#admin-hero-pills-row button");
    heroBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        AudioManager.playClick();
        saveHeroInputs(currentHeroKey);

        heroBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentHeroKey = btn.dataset.heroKey || "hero_purple";
        loadHeroInputs(currentHeroKey);
      });
    });

    // 關主膠囊切換 (全按鈕安全綁定)
    const bossBtns = document.querySelectorAll("#admin-boss-pills-row button");
    bossBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        AudioManager.playClick();
        saveBossInputs(currentBossIdx);

        bossBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentBossIdx = parseInt(btn.dataset.chapterIdx, 10) || 0;
        loadBossInputs(currentBossIdx);
      });
    });

    // 儲存設定按鈕
    document.getElementById("btn-save-hero-config")?.addEventListener("click", async () => {
      AudioManager.playClick();
      saveHeroInputs(currentHeroKey);
      saveBossInputs(currentBossIdx);
      await DataManager.saveConfig(DataManager.config);
      alert("💾 勇者與關主各項攻防生命數值已成功儲存至 Game-data/config.json！");
    });
  }

  function loadHeroInputs(heroKey) {
    const hero = DataManager.config?.heroesConfig?.[heroKey];
    if (!hero) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : "";
    };

    setVal("cfg-hero-name", hero.name);
    setVal("cfg-hero-title", hero.title);
    setVal("cfg-hero-attack-name", hero.attackName);
    setVal("cfg-hero-rhyme", hero.rhyme);
    setVal("cfg-hero-desc", hero.desc);

    setVal("cfg-hero-hp", hero.hp || 100);
    setVal("cfg-hero-mp", hero.mp || 50);
    setVal("cfg-hero-atk", hero.atk || 35);
    setVal("cfg-hero-crit-rate", hero.critRate || 15);
    setVal("cfg-hero-crit-mult", hero.critMult || 2.2);
    setVal("cfg-hero-dmg-red", hero.dmgReduction || 10);

    // 特技 1
    const s1 = hero.skills?.skill1 || {};
    setVal("cfg-s1-name", s1.name);
    setVal("cfg-s1-cost", s1.cost || 15);
    setVal("cfg-s1-mult", s1.mult || 2.2);
    setVal("cfg-s1-desc", s1.desc);

    // 特技 2
    const s2 = hero.skills?.skill2 || {};
    setVal("cfg-s2-name", s2.name);
    setVal("cfg-s2-cost", s2.cost || 10);
    setVal("cfg-s2-heal", s2.heal || 45);
    setVal("cfg-s2-mana", s2.mana || 10);
    setVal("cfg-s2-desc", s2.desc);

    // 特技 3
    const s3 = hero.skills?.skill3 || {};
    setVal("cfg-s3-name", s3.name);
    setVal("cfg-s3-cost", s3.cost || 20);
    setVal("cfg-s3-remove", s3.removeCount || 2);
    setVal("cfg-s3-desc", s3.desc);
  }

  function saveHeroInputs(heroKey) {
    if (!DataManager.config) DataManager.config = {};
    if (!DataManager.config.heroesConfig) DataManager.config.heroesConfig = {};
    const hero = DataManager.config.heroesConfig[heroKey];
    if (!hero) return;

    const getVal = (id, fallback = "") => document.getElementById(id)?.value ?? fallback;

    hero.name = getVal("cfg-hero-name", hero.name);
    hero.title = getVal("cfg-hero-title", hero.title);
    hero.attackName = getVal("cfg-hero-attack-name", hero.attackName);
    hero.rhyme = getVal("cfg-hero-rhyme", hero.rhyme);
    hero.desc = getVal("cfg-hero-desc", hero.desc);

    hero.hp = parseInt(getVal("cfg-hero-hp", hero.hp), 10) || 100;
    hero.mp = parseInt(getVal("cfg-hero-mp", hero.mp), 10) || 50;
    hero.atk = parseInt(getVal("cfg-hero-atk", hero.atk), 10) || 35;
    hero.critRate = parseInt(getVal("cfg-hero-crit-rate", hero.critRate), 10) || 15;
    hero.critMult = parseFloat(getVal("cfg-hero-crit-mult", hero.critMult)) || 2.2;
    hero.dmgReduction = parseInt(getVal("cfg-hero-dmg-red", hero.dmgReduction), 10) || 10;

    hero.skills = hero.skills || {};
    hero.skills.skill1 = {
      name: getVal("cfg-s1-name", "特技一"),
      cost: parseInt(getVal("cfg-s1-cost", 15), 10) || 15,
      mult: parseFloat(getVal("cfg-s1-mult", 2.2)) || 2.2,
      desc: getVal("cfg-s1-desc", ""),
    };
    hero.skills.skill2 = {
      name: getVal("cfg-s2-name", "特技二"),
      cost: parseInt(getVal("cfg-s2-cost", 10), 10) || 10,
      heal: parseInt(getVal("cfg-s2-heal", 45), 10) || 45,
      mana: parseInt(getVal("cfg-s2-mana", 10), 10) || 10,
      desc: getVal("cfg-s2-desc", ""),
    };
    hero.skills.skill3 = {
      name: getVal("cfg-s3-name", "特技三"),
      cost: parseInt(getVal("cfg-s3-cost", 20), 10) || 20,
      removeCount: parseInt(getVal("cfg-s3-remove", 2), 10) || 2,
      desc: getVal("cfg-s3-desc", ""),
    };
  }

  function loadBossInputs(idx) {
    const boss = (DataManager.config?.bossesConfig || [])[idx];
    if (!boss) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : "";
    };

    setVal("cfg-boss-chapter-title", boss.chapterTitle || boss.title || "");
    setVal("cfg-boss-enemy-name", boss.enemyName || "");
    setVal("cfg-boss-hp", boss.hp || 100);
    setVal("cfg-boss-atk", boss.atk || 15);
    setVal("cfg-boss-attack-interval", boss.attackInterval || 5.0);
    setVal("cfg-boss-desc", boss.desc || "");
  }

  function saveBossInputs(idx) {
    if (!DataManager.config) DataManager.config = {};
    if (!DataManager.config.bossesConfig) DataManager.config.bossesConfig = [];
    const boss = DataManager.config.bossesConfig[idx];
    if (!boss) return;

    const getVal = (id, fallback = "") => document.getElementById(id)?.value ?? fallback;

    boss.chapterTitle = getVal("cfg-boss-chapter-title", boss.chapterTitle);
    boss.enemyName = getVal("cfg-boss-enemy-name", boss.enemyName);
    boss.hp = parseInt(getVal("cfg-boss-hp", boss.hp), 10) || 100;
    boss.atk = parseInt(getVal("cfg-boss-atk", boss.atk), 10) || 15;
    boss.attackInterval = parseFloat(getVal("cfg-boss-attack-interval", boss.attackInterval)) || 5.0;
    boss.desc = getVal("cfg-boss-desc", boss.desc);
  }

  function renderHeroesTab() {
    const heroBtns = document.querySelectorAll("#admin-hero-pills-row button");
    heroBtns.forEach((b) => {
      if (b.dataset.heroKey === currentHeroKey) b.classList.add("active");
      else b.classList.remove("active");
    });
    loadHeroInputs(currentHeroKey);

    const bossBtns = document.querySelectorAll("#admin-boss-pills-row button");
    bossBtns.forEach((b) => {
      if (parseInt(b.dataset.chapterIdx, 10) === currentBossIdx) b.classList.add("active");
      else b.classList.remove("active");
    });
    loadBossInputs(currentBossIdx);
  }

  // =========================================================================
  // Tab 5: 自訂圖片與 AI 生圖管理中心
  // =========================================================================
  function setupImageCenter() {
    // 壓縮檔上傳按鈕
    const zipInput = document.getElementById("input-zip-batch-upload");
    document.getElementById("btn-upload-zip")?.addEventListener("click", () => {
      zipInput?.click();
    });

    zipInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        const res = await fetch("/api/upload-zip-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipData: base64Data }),
        });
        const data = await res.json();
        if (data.success) {
          alert(`🎉 ${data.message}`);
          await DataManager.loadConfig();
          renderImagesTab();
        } else {
          alert(`上傳失敗: ${data.error}`);
        }
      };
      reader.readAsDataURL(file);
    });

    // 全部圖片恢復預設
    document.getElementById("btn-reset-all-images")?.addEventListener("click", async () => {
      if (confirm("確定要將全系統 20 張遊戲圖片全部恢復為預設官方圖片嗎？")) {
        const res = await fetch("/api/reset-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
        const data = await res.json();
        if (data.success) {
          alert("已成功將所有圖片改回預設！");
          await DataManager.loadConfig();
          renderImagesTab();
        }
      }
    });

    // 20 張 Prompt 產生器
    document.getElementById("btn-generate-all-prompts")?.addEventListener("click", () => {
      generateAiPrompts();
    });
    document.getElementById("btn-copy-agent-full-task")?.addEventListener("click", () => {
      const ta = document.getElementById("agent-task-prompt-textarea");
      if (ta) {
        navigator.clipboard.writeText(ta.value).then(() => {
          alert("📋 已複製 20 張全套生圖任務指令！可直接送交外部 AI Agent 產圖。");
        });
      }
    });

    // 快速風格與主題標籤
    document.querySelectorAll("#quick-style-tags .quick-chip-btn").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#quick-style-tags .quick-chip-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        document.getElementById("input-prompt-style").value = b.dataset.val;
        generateAiPrompts();
      });
    });

    document.querySelectorAll("#quick-theme-tags .quick-chip-btn").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#quick-theme-tags .quick-chip-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        document.getElementById("input-prompt-theme").value = b.dataset.val;
        generateAiPrompts();
      });
    });
  }

  function generateAiPrompts() {
    const style = document.getElementById("input-prompt-style")?.value.trim() || "鳥山明熱血冒險風格";
    const theme = document.getElementById("input-prompt-theme")?.value.trim() || "黑金魔法術永續食物循環";

    const promptText = `你現在是一位專業的遊戲原畫與 2D 美術概念設計大師。
請根據以下風格與故事主題，為教育答題 RPG 遊戲生成全套 20 張標準遊戲圖片：

【世界觀故事主題】：${theme}
【統一視覺風格】：${style}

【生成規範】：
1. 角色立繪 (PNG)：透明去背背景，動態戰鬥姿態，清晰輪廓線，尺寸建議 800x1000。
2. 角色頭像 (PNG)：透明去背背景，特寫頭部臉龐肖像，尺寸建議 400x400。
3. 戰鬥背景 (JPG)：16:9 寬螢幕場景，建議 1920x1080，無人物遮擋。

【全套 20 個標準固定檔名清單】：
1. hero_sprite.png (主角1 全身立繪)
2. avatar_purple.png (主角1 角色頭像)
3. hero_sprite_round.png (主角2 全身立繪)
4. avatar_round.png (主角2 角色頭像)
5. hero_sprite_syl.png (主角3 全身立繪)
6. avatar_syl.png (主角3 角色頭像)
7. hero_sprite_mul.png (主角4 全身立繪)
8. avatar_mul.png (主角4 角色頭像)
9. slime_sprite.png (第1關關主 戰鬥立繪)
10. mirage_sprite.png (第2關關主 戰鬥立繪)
11. demon_sprite.png (第3關關主 戰鬥立繪)
12. frost_sprite.png (第4關關主 戰鬥立繪)
13. boss_sprite.png (第5關終極關主 戰鬥立繪)
14. forest_bg.jpg (第1關戰鬥背景)
15. desert_bg.jpg (第2關戰鬥背景)
16. river_bg.jpg (第3關戰鬥背景)
17. highway_bg.jpg (第4關戰鬥背景)
18. sacred_bg.jpg (第5關戰鬥背景)
19. title_bg.jpg (遊戲啟程首頁大背景)
20. world_map.jpg (世界地圖冒險探索底圖)

請生成上述 20 張圖片並精確命名為固定檔名，打包為 ZIP 壓縮檔上傳！`;

    const ta = document.getElementById("agent-task-prompt-textarea");
    if (ta) ta.value = promptText;
  }

  async function renderImagesTab() {
    generateAiPrompts();
    let images = [];
    let customCount = 0;

    // 1. 優先嘗試從本機伺服器取得圖片狀態
    try {
      const res = await fetch("/api/images-status");
      if (res.ok) {
        const data = await res.json();
        images = data.images || [];
        customCount = data.customCount || 0;
      }
    } catch (e) {}

    // 2. 靜態 / GitHub Pages / Firebase 雲端模式備援
    if (images.length === 0 && window.GAME_IMAGES_META) {
      const customImages = DataManager.config?.customImages || {};
      images = window.GAME_IMAGES_META.map((meta) => {
        const isCustom = Boolean(customImages[meta.filename]);
        if (isCustom) customCount++;
        return {
          filename: meta.filename,
          name: meta.name,
          category: meta.category,
          categoryName: meta.categoryName,
          spec: meta.spec,
          desc: meta.desc,
          currentUrl: DataManager.resolveImageUrl(meta.filename, meta.defaultPath),
          isCustom,
        };
      });
    }

    const badgeCounter = document.getElementById("img-custom-badge-counter");
    if (badgeCounter) badgeCounter.textContent = `自訂 ${customCount} / 20 張`;

    const grid = document.getElementById("admin-images-grid-container");
    if (!grid) return;
    grid.innerHTML = "";

    images.forEach((img) => {
      const card = document.createElement("div");
      card.style.cssText = "background: rgba(30, 41, 59, 0.7); border: 1.5px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 12px; display: flex; gap: 12px; align-items: center;";

      card.innerHTML = `
        <div style="width: 80px; height: 80px; background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <img src="${img.currentUrl}" alt="${img.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; color: #fde047; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${img.name}</div>
          <div style="font-size: 11px; color: #38bdf8; font-family: monospace;">${img.filename}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${img.spec}</div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button class="jrpg-btn btn-upload-single" style="background: #0284c7; color: #fff; font-size: 11px; padding: 3px 8px;">📤 上傳取代</button>
            <button class="jrpg-btn btn-reset-single" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; font-size: 11px; padding: 3px 8px;">↺ 恢復預設</button>
          </div>
        </div>
      `;

      // 單圖上傳取代 (相容本地與 Firebase 雲端/Base64)
      card.querySelector(".btn-upload-single")?.addEventListener("click", () => {
        const input = document.getElementById("input-single-image-upload");
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            if (!DataManager.config) await DataManager.loadConfig();
            if (!DataManager.config.customImages) DataManager.config.customImages = {};
            DataManager.config.customImages[img.filename] = reader.result;
            await DataManager.saveConfig(DataManager.config);

            // 若有本機伺服器也同步寫入硬碟
            try {
              await fetch("/api/upload-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: img.filename, data: reader.result }),
              });
            } catch (err) {}

            alert(`✅ 已成功套用自訂圖片：【${img.name}】！`);
            renderImagesTab();
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });

      // 單圖恢復預設
      card.querySelector(".btn-reset-single")?.addEventListener("click", async () => {
        if (!DataManager.config) await DataManager.loadConfig();
        if (DataManager.config.customImages && DataManager.config.customImages[img.filename]) {
          delete DataManager.config.customImages[img.filename];
          await DataManager.saveConfig(DataManager.config);
        }

        try {
          await fetch("/api/reset-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: img.filename }),
          });
        } catch (err) {}

        alert(`✅ 已恢復【${img.name}】為官方預設圖片！`);
        renderImagesTab();
      });

      grid.appendChild(card);
    });
  }

  // =========================================================================
  // Tab 7: Firebase 雲端資料庫管理
  // =========================================================================
  function setupFirebaseManagement() {
    // 1. 貼上代碼快速解析按鈕
    document.getElementById("btn-parse-firebase-paste")?.addEventListener("click", () => {
      AudioManager.playClick();
      const text = document.getElementById("firebase-paste-textarea")?.value || "";
      if (!text.trim()) {
        alert("請先在文字框中貼上 Firebase 控制台提供的程式碼！");
        return;
      }
      const extract = (key) => {
        const regex = new RegExp(`['"]?${key}['"]?\\s*[:=]\\s*['"]([^'"]+)['"]`, "i");
        const m = text.match(regex);
        return m ? m[1].trim() : "";
      };

      const projId = extract("projectId");
      const apiKey = extract("apiKey");
      const appId = extract("appId");
      const authDomain = extract("authDomain");

      if (projId) document.getElementById("fb-input-projectId").value = projId;
      if (apiKey) document.getElementById("fb-input-apiKey").value = apiKey;
      if (appId) document.getElementById("fb-input-appId").value = appId;
      if (authDomain) document.getElementById("fb-input-authDomain").value = authDomain;

      if (projId || apiKey) {
        alert("✅ 解析成功！已自動帶入專案欄位，請點擊「儲存並啟用 Firebase 連線」生效。");
      } else {
        alert("⚠️ 無法自動解析，請確認貼上的文字中包含 projectId 與 apiKey，或手動填寫欄位。");
      }
    });

    // 2. 儲存設定並啟用
    document.getElementById("btn-save-firebase-config")?.addEventListener("click", async () => {
      AudioManager.playClick();
      const projectId = document.getElementById("fb-input-projectId")?.value.trim();
      const apiKey = document.getElementById("fb-input-apiKey")?.value.trim();
      const appId = document.getElementById("fb-input-appId")?.value.trim();
      const authDomain = document.getElementById("fb-input-authDomain")?.value.trim();

      if (!projectId || !apiKey) {
        alert("請至少填寫 Project ID 與 API Key！");
        return;
      }

      const cfg = {
        projectId,
        apiKey,
        appId: appId || "",
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
      };

      try {
        FirebaseService.saveConfigToStorage(cfg);
        const testRes = await FirebaseService.testConnection();
        if (testRes.success) {
          alert(`🎉 恭喜！Firebase 連線成功！\n專案：${testRes.projectId}\n延遲：${testRes.latencyMs} ms\n全班平板與電腦現已啟用雲端即時同步！`);
        } else {
          alert(`⚠️ 設定已儲存，但連線測試回傳：${testRes.error}\n請確認 Firestore 是否已建立，以及安全性規則 (Security Rules) 是否已開放！`);
        }
        renderFirebaseTab();
        await loadAllAdminData();
      } catch (err) {
        alert(`❌ 儲存失敗：${err.message}`);
      }
    });

    // 3. 測試雲端連線
    document.getElementById("btn-test-firebase-conn")?.addEventListener("click", async () => {
      AudioManager.playClick();
      const btn = document.getElementById("btn-test-firebase-conn");
      if (btn) btn.textContent = "連線中...";
      const res = await FirebaseService.testConnection();
      if (btn) btn.textContent = "⚡ 測試雲端連線";
      if (res.success) {
        alert(`🟢 Firebase 連線正常！\n專案：${res.projectId}\n連線延遲：${res.latencyMs} ms\n雲端 Firestore 運行中！`);
      } else {
        alert(`🔴 連線失敗：${res.error}\n請確認網路連線、專案 ID 是否正確，以及 Firestore 安全性規則。`);
      }
      renderFirebaseTab();
    });

    // 4. 清除自訂設定 (還原預設)
    document.getElementById("btn-clear-firebase-config")?.addEventListener("click", async () => {
      if (confirm("確定要清除自訂的 Firebase 設定嗎？清除後將還原為本機離線模式。")) {
        AudioManager.playClick();
        FirebaseService.clearConfigFromStorage();
        alert("已清除自訂 Firebase 設定，系統已切換為本機模式。");
        renderFirebaseTab();
        await loadAllAdminData();
      }
    });

    // 5. 一鍵將本地資料同步至 Firebase (Seed)
    document.getElementById("btn-seed-firebase-data")?.addEventListener("click", async () => {
      if (!FirebaseService.isAvailable()) {
        alert("請先完成 Firebase 連線設定並測試成功後，再執行同步！");
        return;
      }
      if (confirm("確定要將本機現有的題庫、主題測驗與遊戲數值一鍵同步寫入 Firebase 雲端資料庫嗎？\n這將作為雲端的初始資料提供全班學生使用。")) {
        AudioManager.playClick();
        try {
          await FirebaseService.seedInitialData({
            config: DataManager.config,
            exams: DataManager.exams,
            questionBanks: DataManager.banks,
          });
          alert("🎉 成功同步！已將所有題庫、測驗組與設定寫入 Firebase Firestore！全班學生現可即時取得最新考卷！");
          renderFirebaseTab();
        } catch (err) {
          alert(`❌ 同步失敗：${err.message}`);
        }
      }
    });

    // 6. 複製推薦安全性規則
    document.getElementById("btn-copy-security-rules")?.addEventListener("click", () => {
      const rules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
      navigator.clipboard.writeText(rules).then(() => {
        alert("📋 已複製推薦 Firestore 安全性規則到剪貼簿！\n請前往 Firebase 控制台 -> Firestore Database -> 規則 (Rules) 貼上並發布。");
      }).catch(() => {
        prompt("請手動複製以下規則：", rules);
      });
    });
  }

  function renderFirebaseTab() {
    const status = FirebaseService.getStatus();
    const badge = document.getElementById("badge-firebase-status");
    const desc = document.getElementById("firebase-status-desc");

    if (badge) {
      if (status.available) {
        badge.textContent = `🟢 已連線 (${status.projectId || "Firestore"})`;
        badge.style.background = "rgba(52, 211, 153, 0.2)";
        badge.style.color = "#34d399";
      } else if (status.configured) {
        badge.textContent = `🔴 連線失敗 (${status.error || "未授權"})`;
        badge.style.background = "rgba(239, 68, 68, 0.2)";
        badge.style.color = "#f87171";
      } else {
        badge.textContent = "🟡 本機離線模式 (尚未設定)";
        badge.style.background = "rgba(245, 158, 11, 0.2)";
        badge.style.color = "#fbbf24";
      }
    }

    if (desc) {
      if (status.available) {
        desc.textContent = `雲端 Firestore 運行中（專案：${status.projectId}）！學生無論使用 iPad 平板、手機或電腦，作答數據均會即時傳入本後台！`;
        desc.style.color = "#a7f3d0";
      } else if (status.configured) {
        desc.textContent = `已設定專案 ${status.projectId}，但目前無法讀寫 Firestore：${status.error || "請檢查安全性規則"}。`;
        desc.style.color = "#fca5a5";
      } else {
        desc.textContent = "目前運行於本機模式。若欲發布到 GitHub Pages 或供全班平板連線，請於下方填入 Firebase 金鑰。";
        desc.style.color = "#cbd5e1";
      }
    }

    // 帶入已儲存之設定值
    const cfg = FirebaseService.getStoredConfig();
    if (cfg) {
      const p = document.getElementById("fb-input-projectId");
      const k = document.getElementById("fb-input-apiKey");
      const a = document.getElementById("fb-input-appId");
      const d = document.getElementById("fb-input-authDomain");
      if (p) p.value = cfg.projectId || "";
      if (k) k.value = cfg.apiKey || "";
      if (a) a.value = cfg.appId || "";
      if (d) d.value = cfg.authDomain || "";
    }
  }

  // =========================================================================
  // Tab 6: 本地與雲端檔案儲存說明
  // =========================================================================
  function setupStorageInfo() {
    document.getElementById("btn-refresh-storage")?.addEventListener("click", () => {
      renderStorageTab();
    });
  }

  async function renderStorageTab() {
    let files = [];
    try {
      const res = await fetch("/api/storage-info");
      if (res.ok) {
        const data = await res.json();
        files = data.files || [];
      }
    } catch (e) {}

    const grid = document.getElementById("storage-files-grid");
    if (!grid) return;
    grid.innerHTML = "";

    // 雲端與本地狀態卡
    const fbStatus = FirebaseService.getStatus();
    const cloudCard = document.createElement("div");
    cloudCard.style.cssText = "background: rgba(30, 41, 59, 0.85); border: 1.5px solid #f59e0b; border-radius: 10px; padding: 12px 16px;";
    cloudCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <strong style="color: #fbbf24; font-size: 14px;">🔥 Firebase Firestore 雲端資料庫</strong>
        <span style="font-size: 11.5px; color: ${fbStatus.available ? "#34d399" : "#f59e0b"};">${fbStatus.available ? "🟢 雲端啟用中" : "⚪ 未連線 (本地模式)"}</span>
      </div>
      <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4; margin-bottom: 6px;">
        ${fbStatus.available ? `專案 ID：<strong>${fbStatus.projectId}</strong> ｜ 支援即時多載具作答數據同步` : "尚未配置 Firebase，資料將保存在本地瀏覽器快取 (localStorage) 與本機檔案。"}
      </div>
      <div style="font-size: 11px; color: #94a3b8; display: flex; gap: 16px;">
        <span>雲端紀錄：${DataManager.records?.length || 0} 筆</span>
        <span>題庫組數：${DataManager.banks?.length || 0} 組</span>
        <span>測驗組數：${DataManager.exams?.length || 0} 組</span>
      </div>
    `;
    grid.appendChild(cloudCard);

    if (files.length === 0) {
      files = [
        { title: "全域遊戲設定檔", relativePath: "Game-data/config.json", description: "儲存四大勇者與五大魔王 HP/MP/攻防等數值、選項隨機打亂狀態與換膚路徑。", sizeFormatted: "約 8 KB", recordCount: null, lastModified: "即時同步" },
        { title: "主題測驗清單檔", relativePath: "Game-data/exams.json", description: "儲存教師自訂的主題測驗考卷、勾選組合之題庫清單與啟用/停用開關。", sizeFormatted: "約 3 KB", recordCount: DataManager.exams?.length || 0, lastModified: "即時同步" },
        { title: "題庫分組與題目資料庫", relativePath: "Game-data/question_banks.json", description: "儲存各主題題庫的所有四選一單選題、選項文字、正解編號與教學解析。", sizeFormatted: "約 42 KB", recordCount: DataManager.banks?.length || 0, lastModified: "即時同步" },
        { title: "學生作答紀錄歷程", relativePath: "Game-data/student_records.json", description: "即時記錄全班學生姓名、選擇角色、冒險積分、答對率與完整答題軌跡。", sizeFormatted: "動態增長", recordCount: DataManager.records?.length || 0, lastModified: "即時同步" },
      ];
    }

    files.forEach((f) => {
      const card = document.createElement("div");
      card.style.cssText = "background: rgba(30, 41, 59, 0.7); border: 1.5px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 12px 16px;";

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #38bdf8; font-size: 14px;">📄 ${f.title}</strong>
          <code style="background: #0f172a; color: #fde047; padding: 2px 8px; border-radius: 4px; font-size: 11.5px;">${f.relativePath}</code>
        </div>
        <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4; margin-bottom: 6px;">${f.description}</div>
        <div style="font-size: 11px; color: #94a3b8; display: flex; gap: 16px;">
          <span>大小：${f.sizeFormatted}</span>
          <span>記錄筆數：${f.recordCount !== null ? `${f.recordCount} 筆` : "配置檔"}</span>
          <span>最後修改：${f.lastModified}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // =========================================================================
  // 6. 課堂全畫面簡報模式 (Presentation Mode)
  // =========================================================================
  function setupPresentationMode() {
    // 答案開關 (快捷鍵 H)
    document.getElementById("btn-pres-toggle-answer")?.addEventListener("click", () => {
      isPresAnswerVisible = !isPresAnswerVisible;
      updatePresAnswerVisibility();
    });

    // 關閉簡報 (快捷鍵 ESC)
    document.getElementById("btn-close-presentation")?.addEventListener("click", () => {
      document.getElementById("presentation-modal")?.classList.add("hidden");
    });

    // 全螢幕切換 (快捷鍵 F)
    document.getElementById("btn-pres-fullscreen")?.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // 上一題 / 下一題
    document.getElementById("btn-pres-prev")?.addEventListener("click", () => {
      if (currentPresIndex > 0) openPresentationMode(currentPresIndex - 1);
    });
    document.getElementById("btn-pres-next")?.addEventListener("click", () => {
      if (currentPresIndex < presentationList.length - 1) openPresentationMode(currentPresIndex + 1);
    });

    // 鍵盤快捷鍵
    window.addEventListener("keydown", (e) => {
      const presModal = document.getElementById("presentation-modal");
      if (!presModal || presModal.classList.contains("hidden")) return;

      if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
        document.getElementById("btn-pres-prev")?.click();
      } else if (e.key === "ArrowRight" || e.key === "n" || e.key === "N" || e.key === " ") {
        document.getElementById("btn-pres-next")?.click();
      } else if (e.key === "h" || e.key === "H") {
        document.getElementById("btn-pres-toggle-answer")?.click();
      } else if (e.key === "f" || e.key === "F") {
        document.getElementById("btn-pres-fullscreen")?.click();
      } else if (e.key === "Escape") {
        document.getElementById("btn-close-presentation")?.click();
      }
    });
  }

  function openPresentationMode(idx) {
    if (!presentationList || presentationList.length === 0) return;
    currentPresIndex = Math.max(0, Math.min(presentationList.length - 1, idx));
    isPresAnswerVisible = false; // 預設先隱藏答案，促進課堂思考

    const modal = document.getElementById("presentation-modal");
    modal.classList.remove("hidden");

    const q = presentationList[currentPresIndex];
    document.getElementById("pres-page-indicator").textContent = `第 ${currentPresIndex + 1} / ${presentationList.length} 題`;
    document.getElementById("pres-mini-progress-fill").style.width = `${((currentPresIndex + 1) / presentationList.length) * 100}%`;

    // 排名標籤
    document.getElementById("pres-rank-badge").textContent = `🥇 第 ${currentPresIndex + 1} 常錯題`;
    document.getElementById("pres-tag-category").textContent = `🏷️ ${q.chapterTitle || "生態關卡"}`;

    // 統計數據
    document.getElementById("pres-wrong-count").textContent = q.wrongCount;
    document.getElementById("pres-correct-count").textContent = q.totalAnswers - q.wrongCount;
    document.getElementById("pres-total-count").textContent = q.totalAnswers;
    const accPct = Math.round(((q.totalAnswers - q.wrongCount) / q.totalAnswers) * 100);
    document.getElementById("pres-accuracy-val").textContent = `${accPct}%`;

    document.getElementById("pres-ratio-correct").style.width = `${accPct}%`;
    document.getElementById("pres-ratio-wrong").style.width = `${100 - accPct}%`;

    // 題目內容大字
    document.getElementById("pres-question-text").textContent = q.question;

    // 四個大字選項卡片
    const optContainer = document.getElementById("pres-options-container");
    optContainer.innerHTML = "";

    q.options.forEach((optText, oIdx) => {
      const optCard = document.createElement("div");
      optCard.className = "pres-option-card";
      optCard.dataset.idx = oIdx;

      optCard.innerHTML = `
        <span style="background: #0f172a; color: #fde047; font-weight: 900; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
          ${String.fromCharCode(65 + oIdx)}
        </span>
        <span style="flex: 1;">${optText}</span>
        <span class="pres-opt-count" style="font-size: 14px; color: #94a3b8; display: none;">${q.optionPicks[oIdx]} 人選</span>
      `;
      optContainer.appendChild(optCard);
    });

    // 觀念詳解與學生名單
    document.getElementById("pres-explanation-text").textContent = q.explanation || "請牢記綠色生活與正確分類原則！";
    document.getElementById("pres-wrong-students-count").textContent = q.wrongStudents.length;

    const sList = document.getElementById("pres-students-list");
    sList.innerHTML = "";
    q.wrongStudents.forEach((ws) => {
      const tag = document.createElement("span");
      tag.style.cssText = "background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; font-size: 13px; padding: 3px 10px; border-radius: 20px;";
      tag.textContent = `${ws.name} (選 ${String.fromCharCode(65 + ws.choice)})`;
      sList.appendChild(tag);
    });

    updatePresAnswerVisibility();
  }

  function updatePresAnswerVisibility() {
    const q = presentationList[currentPresIndex];
    if (!q) return;

    const cards = document.querySelectorAll(".pres-option-card");
    const counts = document.querySelectorAll(".pres-opt-count");
    const expBox = document.getElementById("pres-explanation-box");
    const stuBox = document.getElementById("pres-students-box");
    const toggleBtn = document.getElementById("btn-pres-toggle-answer");

    if (isPresAnswerVisible) {
      toggleBtn.textContent = "👁️ 隱藏答案";
      cards.forEach((c) => {
        const oIdx = parseInt(c.dataset.idx, 10);
        if (oIdx === q.correctIndex) {
          c.classList.add("correct-revealed");
        } else {
          c.classList.remove("correct-revealed");
        }
      });
      counts.forEach((el) => (el.style.display = "inline"));
      expBox?.classList.remove("hidden");
      stuBox?.classList.remove("hidden");
    } else {
      toggleBtn.textContent = "👁️ 亮出答案";
      cards.forEach((c) => c.classList.remove("correct-revealed"));
      counts.forEach((el) => (el.style.display = "none"));
      expBox?.classList.add("hidden");
      stuBox?.classList.add("hidden");
    }
  }

  return {
    init,
    openPresentationMode,
  };
})();

window.AdminManager = AdminManager;
