// ---------- GLOBAL AUTH ----------
let regOtpCode = "1234"; // registration OTP demo
let fpOtpCode = "1234"; // forgot-password OTP demo
let fidOtpCode = "1234"; // forgot UH-HOS-ID OTP demo

// ---------- GLOBAL AUDIT ----------
let uhAuditEntries = []; // {time,user,role,action,details}

function addAuditEntry(action, details) {
  const now = new Date();
  const entry = {
    time: now.toISOString(),
    user: "Admin User",
    role: "ADMIN",
    action,
    details,
  };

  // keep in-memory (for current page)
  uhAuditEntries.push(entry);

  // persist across pages
  const existing = JSON.parse(localStorage.getItem("uhAuditEntries") || "[]");
  existing.push(entry);
  localStorage.setItem("uhAuditEntries", JSON.stringify(existing));
  const hospitalId = localStorage.getItem('hospitalId') || 'UH-HOS-00000';
  if (window.uhDbRef && window.uhDbUpdate) {
    const ref = window.uhDbRef(`Hospitals/${hospitalId}/audit_logs`).push();
    ref.set(entry);
  }
}


// ---------- THEME (AUTH + APP) ----------
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  localStorage.setItem("uh-hospital-theme", theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
}

// emergency visual mode class on body
function setBodyEmergencyMode(status) {
  document.body.classList.remove("mode-normal", "mode-busy", "mode-overloaded");
  if (status === "normal") document.body.classList.add("mode-normal");
  else if (status === "busy") document.body.classList.add("mode-busy");
  else if (status === "overloaded") document.body.classList.add("mode-overloaded");
}

// ---------- VIEW SWITCHING (AUTH) ----------
function showView(view) {
  const loginView = document.getElementById("login-view");
  const registerView = document.getElementById("register-view");
  const forgotView = document.getElementById("forgot-view");
  const forgotIdView = document.getElementById("forgot-id-view");
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");

  if (!loginView || !registerView || !forgotView) return;

  // hide all
  loginView.classList.add("d-none");
  registerView.classList.add("d-none");
  forgotView.classList.add("d-none");
  if (forgotIdView) forgotIdView.classList.add("d-none");

  if (view === "login") {
    loginView.classList.remove("d-none");
    if (title) title.textContent = "Portal Login";
    if (subtitle) {
      subtitle.textContent = "Access your UniHealth hospital dashboard.";
    }
  } else if (view === "reg") {
    registerView.classList.remove("d-none");
    if (title) title.textContent = "Hospital Registration";
    if (subtitle) {
      subtitle.textContent = "Create a new UniHealth Hospital account.";
    }
  } else if (view === "forgot") {
    forgotView.classList.remove("d-none");
    if (title) title.textContent = "Forgot Password";
    if (subtitle) {
      subtitle.textContent =
        "Reset your admin password using OTP verification.";
    }
  } else if (view === "forgot-id") {
    if (forgotIdView) forgotIdView.classList.remove("d-none");
    if (title) title.textContent = "Forgot UH-HOS-ID";
    if (subtitle) {
      subtitle.textContent =
        "Recover your hospital ID using email, phone and OTP verification.";
    }
  }
}

// ---------- REGISTRATION ----------
function generateHospitalId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `UH-HOS-${num}`;
}

function startOtpFlow() {
  const pass = document.getElementById("regPass").value.trim();
  const confirm = document.getElementById("regPassConfirm").value.trim();

  if (!pass || !confirm) {
    alert("Please set a password before continuing.");
    return;
  }
  if (pass !== confirm) {
    alert("Password mismatch. Please ensure both password fields are identical.");
    return;
  }

  const requiredIds = [
    "hosName",
    "hosPlace",
    "hosAddress",
    "adminAadhaar",
    "adminEmail",
    "hosPhone",
  ];
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      alert("Please fill all required hospital details before continuing.");
      return;
    }
  }

  alert("Demo OTP for registration: 1234");
  document.getElementById("reg-step-1").classList.add("d-none");
  document.getElementById("reg-step-2").classList.remove("d-none");
}

function resendOtp() {
  alert("Resent demo OTP: 1234");
}

function backToRegDetails() {
  document.getElementById("reg-step-2").classList.add("d-none");
  document.getElementById("reg-step-1").classList.remove("d-none");
}

function handleRegistration() {
  const otpInput = document.getElementById("regOtp").value.trim();
  if (!otpInput) {
    alert("Please enter the OTP.");
    return;
  }
  if (otpInput !== regOtpCode) {
    alert("Invalid OTP. Please check and try again.");
    return;
  }

  const autoId = generateHospitalId();
  document.getElementById("regId").value = autoId;

  alert(
    `UniHealth Hospital Registration Successful!\nYour Hospital ID is ${autoId}`
  );
  localStorage.setItem("hospitalId", autoId);
  showView("login");
  document.getElementById("loginId").value = autoId;
}

// ---------- LOGIN ----------
function handleLogin() {
  const id = document.getElementById("loginId").value.trim();
  const pass = document.getElementById("loginPass").value;

  if (!id || !pass) {
    alert("Please enter your Hospital ID and Password.");
    return;
  }

  localStorage.setItem("hospitalId", id);
  window.location.href = "hospital-dashboard.html";
}

// ---------- FORGOT PASSWORD ----------
function fpStart() {
  const email = document.getElementById("fpEmail").value.trim();
  if (!email) {
    alert("Enter your registered admin email.");
    return;
  }
  alert("Demo OTP for forgot password: 1234");
  document.getElementById("fp-step-1").classList.add("d-none");
  document.getElementById("fp-step-2").classList.remove("d-none");
}

function fpResend() {
  alert("Resent demo OTP: 1234");
}

function fpVerifyOtp() {
  const otp = document.getElementById("fpOtp").value.trim();
  if (otp !== fpOtpCode) {
    alert("Invalid OTP. Use 1234 for demo.");
    return;
  }
  document.getElementById("fp-step-2").classList.add("d-none");
  document.getElementById("fp-step-3").classList.remove("d-none");
}

function fpSetNewPassword() {
  const p1 = document.getElementById("fpNewPass").value.trim();
  const p2 = document.getElementById("fpNewPassConfirm").value.trim();

  if (!p1 || !p2) {
    alert("Fill both password fields.");
    return;
  }
  if (p1 !== p2) {
    alert("Passwords do not match.");
    return;
  }

  alert("Password updated (demo). You can now login with your Hospital ID.");
  showView("login");
}

// ---------- FORGOT HOSPITAL ID ----------
function fidStart() {
  const email = document.getElementById("fidEmail")?.value.trim();
  const phone = document.getElementById("fidPhone")?.value.trim();

  if (!email || !phone) {
    alert("Enter your registered admin email and phone number.");
    return;
  }

  // TODO: call backend to validate and send real OTP
  alert("Demo OTP for UH-HOS-ID recovery: 1234");

  const step1 = document.getElementById("fid-step-1");
  const step2 = document.getElementById("fid-step-2");
  const step3 = document.getElementById("fid-step-3");
  if (step1) step1.classList.add("d-none");
  if (step2) step2.classList.remove("d-none");
  if (step3) step3.classList.add("d-none");

  addAuditEntry(
    "forgotid-start",
    `UH-HOS-ID recovery started for ${email} / ${phone}`
  );
}

function fidResend() {
  // TODO: backend resend logic
  alert("Resent demo OTP 1234 for UH-HOS-ID recovery.");
}

function fidVerifyOtp() {
  const otp = document.getElementById("fidOtp")?.value.trim();
  if (!otp) {
    alert("Please enter the OTP.");
    return;
  }
  if (otp !== fidOtpCode) {
    alert("Invalid OTP. Use 1234 for demo.");
    return;
  }

  const step2 = document.getElementById("fid-step-2");
  const step3 = document.getElementById("fid-step-3");
  if (step2) step2.classList.add("d-none");
  if (step3) step3.classList.remove("d-none");

  // TODO: backend should now send secure email link
  alert(
    "OTP verified. A secure link has been sent to your registered email. " +
      "From that page, after Save & Submit, you will receive your UH-HOS-ID."
  );

  addAuditEntry(
    "forgotid-otp-verified",
    "UH-HOS-ID recovery OTP verified and email link sent"
  );
}

function fidBackToLogin() {
  showView("login");
}

// =======================================================
// HOSPITAL DASHBOARD + APP PAGES
// (unchanged business logic below)
// =======================================================

// shared theme helpers
function hosApplyTheme(theme) {
  applyTheme(theme);
}

function hosToggleTheme() {
  const isDark = document.body.classList.contains("dark");
  hosApplyTheme(isDark ? "light" : "dark");
}

// ---------- DASHBOARD emergency status AI text ----------
function hosSetEmergencyStatus(status) {
  const banner = document.getElementById("emergencyBanner");
  const pill = document.getElementById("emStatusPill");
  const textSpan = document.getElementById("emStatusText");
  const sentence = document.getElementById("emStatusSentence");
  const lastLbl = document.getElementById("lastUpdatedLabel");
  const bullets = document.getElementById("emAiBullets");
  if (!banner || !pill || !textSpan || !sentence) return;

  let label, pillClass, bg, desc, aiLines;
  if (status === "normal") {
    label = "NORMAL";
    pillClass = "badge rounded-pill me-2 bg-success text-white";
    bg = "linear-gradient(90deg,#dcfce7,#e0f2fe)";
    desc = "Hospital load is currently normal.";
    aiLines = [
      "AI: Beds and doctors within stable range.",
      "AI: Ideal window for elective procedures.",
    ];
  } else if (status === "busy") {
    label = "BUSY";
    pillClass = "badge rounded-pill me-2 bg-warning text-dark";
    bg = "linear-gradient(90deg,#fef3c7,#fee2e2)";
    desc = "Hospital load is currently busy.";
    aiLines = [
      "AI: Prepare for peak around 12 PM.",
      "AI: Consider throttling low-priority tokens.",
    ];
  } else {
    label = "OVERLOADED";
    pillClass = "badge rounded-pill me-2 bg-danger text-white";
    bg = "linear-gradient(90deg,#fee2e2,#fecaca)";
    desc = "Hospital is currently overloaded. Redirect recommended.";
    aiLines = [
      "AI: Activate diversion protocol for new ambulances.",
      "AI: Postpone non-critical admissions.",
    ];
  }

  pill.className = pillClass;
  pill.textContent = label;
  textSpan.textContent = label[0] + label.slice(1).toLowerCase();
  banner.style.background = bg;
  sentence.textContent = desc;

  if (bullets) {
    bullets.innerHTML = aiLines.map((l) => `<li>${l}</li>`).join("");
  }

  if (lastLbl) {
    const now = new Date();
    lastLbl.textContent = `Last updated ${now.toLocaleString()}`;
  }

  setBodyEmergencyMode(status);
  addAuditEntry(
    "emergency-status-update",
    `Emergency mode ${label.toLowerCase()}`
  );
}

// ---------- DASHBOARD card navigation ----------
// ---------- DASHBOARD card navigation ----------
function hosInitCardNavigation() {
  document
    .querySelectorAll('.card-lg.clickable')
    .forEach((card) => {
      card.addEventListener('click', () => {
        const dest = card.getAttribute('data-nav');
        let url = null;
        let label = dest;

        if (dest === 'beds') {
          url = 'hospital-beds.html';
          label = 'Beds';
        } else if (dest === 'icu') {
          url = 'hospital-beds.html';
          label = 'ICU';
        } else if (dest === 'doctors') {
          url = 'hospital-doctors.html';
          label = 'Doctors';
        } else if (dest === 'tokens') {
          url = 'hospital-tokens.html';
          label = 'Tokens';
        } else if (dest === 'analytics') {
          url = 'hospital-analytics.html';
          label = 'Analytics';
        } else if (dest === 'emergency-dashboard') {
          url = 'emergency-dashboard.html';
          label = 'Emergency Dashboard';
        }

        if (url) {
          if (typeof addAuditEntry === 'function') {
            addAuditEntry(
              'dashboard-card-open',
              `Opened ${label} from main dashboard`
            );
          }
          window.location.href = url;
        }
      });
    });
}


// ---------- DASHBOARD INIT ----------
function initHospitalDashboard() {
  const root = document.getElementById("emDashboardRoot");
  if (!root) return;

  const theme = localStorage.getItem("uh-hospital-theme") || "light";
  hosApplyTheme(theme);

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.addEventListener("click", hosToggleTheme);

  const select = document.getElementById("emStatusSelect");
  if (select) {
    select.addEventListener("change", () => hosSetEmergencyStatus(select.value));
    hosSetEmergencyStatus(select.value || "busy");
  } else {
    hosSetEmergencyStatus("busy");
  }

  hosInitCardNavigation();

  const hosId = localStorage.getItem("hospitalId");
  if (hosId) {
    const span = document.getElementById("sidebarHospitalId");
    if (span) span.textContent = hosId;
  }
}

// ---------- BEDS PAGE (ONE CARD PER ROW, ADD + ICU + AUDIT) ----------
function initBedManagement() {
  const root = document.getElementById("bedsPageRoot");
  if (!root) return;

  const theme = localStorage.getItem("uh-hospital-theme") || "light";
  hosApplyTheme(theme);

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.addEventListener("click", hosToggleTheme);

  const hosId = localStorage.getItem("hospitalId");
  if (hosId) {
    const span = document.getElementById("sidebarHospitalId");
    if (span) span.textContent = hosId;
    const spanBottom = document.getElementById("sidebarHospitalIdBottom");
    if (spanBottom) spanBottom.textContent = hosId;
  }

  const cardsWrapper = root.querySelector(".beds-grid");
  if (!cardsWrapper) return;
  const cards = () => root.querySelectorAll(".bed-card");

  // ---------- ICU AI summary ----------
  const icuAiSummary = document.getElementById("icuAiSummary");
  const icuAiDetails = document.getElementById("icuAiDetails");
  const icuAiPill = document.getElementById("icuAiPill");

  function updateIcuAiCard() {
    if (!icuAiSummary || !icuAiDetails || !icuAiPill) return;

    let icuTotalBeds = 0;
    let icuOccupied = 0;
    let icuUnits = 0;
    let icuCount = 0;

    cards().forEach((card) => {
      if (card.getAttribute("data-ward-type") !== "icu") return;
      icuCount += 1;
      const totalEl = card.querySelector("[data-field='total']");
      const occEl = card.querySelector("[data-field='occupied']");
      const unitInput = card.querySelector(".icu-unit-input");
      const total = totalEl ? parseInt(totalEl.textContent, 10) || 0 : 0;
      const occ = occEl ? parseInt(occEl.textContent, 10) || 0 : 0;
      icuTotalBeds += total;
      icuOccupied += occ;
      if (unitInput) icuUnits += parseInt(unitInput.value, 10) || 0;
    });

    if (!icuCount) {
      icuAiSummary.textContent = "No ICU units configured.";
      icuAiDetails.textContent = "Use Add Ward to create ICU units.";
      icuAiPill.textContent = "N/A";
      icuAiPill.className =
        "badge bg-secondary-subtle text-secondary-emphasis";
      return;
    }

    const ratio = icuTotalBeds === 0 ? 0 : icuOccupied / icuTotalBeds;
    let label = "Stable";
    let pillClass = "badge bg-success-subtle text-success-emphasis";
    let detail = "";

    if (ratio < 0.5) {
      label = "Stable";
      pillClass = "badge bg-success-subtle text-success-emphasis";
      detail = `ICU occupancy at ${Math.round(
        ratio * 100
      )}% across ${icuUnits} unit(s).`;
    } else if (ratio < 0.75) {
      label = "Near Full";
      pillClass = "badge bg-warning-subtle text-warning-emphasis";
      detail = `ICU nearing high load (${Math.round(
        ratio * 100
      )}%). Prepare backup beds.`;
    } else {
      label = "Critical";
      pillClass = "badge bg-danger-subtle text-danger-emphasis";
      detail = `ICU at critical load (${Math.round(
        ratio * 100
      )}%). Consider diversions.`;
    }

    icuAiSummary.textContent = `ICU beds: ${icuOccupied}/${icuTotalBeds} occupied across ${icuUnits} unit(s).`;
    icuAiDetails.textContent = detail;
    icuAiPill.textContent = label;
    icuAiPill.className = pillClass;
  }

  // ---------- bed color thresholds ----------
  function applyBedColor(card, ratio) {
    const pill = card.querySelector("[data-pill='status']");
    const riskEl = card.querySelector("[data-field='risk']");
    card.classList.remove("bed-critical", "bed-warning", "bed-stable");
    let statusLabel = "stable";

    if (ratio < 0.5) {
      card.classList.add("bed-stable");
      statusLabel = "stable";
      if (pill) {
        pill.textContent = "Stable";
        pill.className =
          "badge bg-success-subtle text-success-emphasis bed-pill";
      }
      if (riskEl) riskEl.textContent = "AI: Capacity sufficient for now.";
    } else if (ratio < 0.75) {
      card.classList.add("bed-warning");
      statusLabel = "near full";
      if (pill) {
        pill.textContent = "Near Full";
        pill.className =
          "badge bg-warning-subtle text-warning-emphasis bed-pill";
      }
      if (riskEl) {
        riskEl.textContent =
          "AI: Beds above 50%. Monitor admissions closely.";
      }
    } else {
      card.classList.add("bed-critical");
      statusLabel = "critical";
      if (pill) {
        pill.textContent = "Critical";
        pill.className =
          "badge bg-danger-subtle text-danger-emphasis bed-pill";
      }
      if (riskEl) {
        riskEl.textContent =
          "AI: Critical level. Consider diversion or surge capacity.";
      }
    }

    card.setAttribute("data-bed-status-label", statusLabel);
  }

  function wireBedCard(card) {
    const totalEl = card.querySelector("[data-field='total']");
    const occEl = card.querySelector("[data-field='occupied']");
    const availEl = card.querySelector("[data-field='available']");
    const updatedEl = card.querySelector("[data-field='updated']");
    const minusBtn = card.querySelector(".bed-btn-decrease");
    const plusBtn = card.querySelector(".bed-btn-increase");
    const saveBtn = card.querySelector(".bed-save-btn");
    const icuUnitInput = card.querySelector(".icu-unit-input");

    if (!totalEl || !occEl || !availEl) return;

    function recalc(delta) {
      let total = parseInt(totalEl.textContent, 10) || 0;
      let occ = parseInt(occEl.textContent, 10) || 0;

      // EXACTLY one bed per click
      if (delta < 0) {
        if (occ <= 0) return;
        occ -= 1;
      } else if (delta > 0) {
        if (occ >= total) return;
        occ += 1;
      }

      if (occ < 0) occ = 0;
      if (occ > total) occ = total;

      const avail = Math.max(total - occ, 0);
      occEl.textContent = occ;
      availEl.textContent = avail;

      const ratio = total === 0 ? 0 : occ / total;
      applyBedColor(card, ratio);

      const now = new Date();
      if (updatedEl) updatedEl.textContent = now.toLocaleTimeString();

      // no audit here; only on Save
      if (card.getAttribute("data-ward-type") === "icu") {
        updateIcuAiCard();
      }
    }

    const initTotal = parseInt(totalEl.textContent, 10) || 0;
    const initOcc = parseInt(occEl.textContent, 10) || 0;
    applyBedColor(card, initTotal === 0 ? 0 : initOcc / initTotal);

    // clear any inline handlers, then attach ONE listener
    if (minusBtn) {
      minusBtn.onclick = null;
      minusBtn.addEventListener("click", () => recalc(-1));
    }
    if (plusBtn) {
      plusBtn.onclick = null;
      plusBtn.addEventListener("click", () => recalc(1));
    }

    if (icuUnitInput) {
      icuUnitInput.addEventListener("change", () => {
        const wardNameEl = card.querySelector(".bed-ward-name");
        const units = parseInt(icuUnitInput.value, 10) || 0;
        addAuditEntry(
          "icu-unit-update",
          `${wardNameEl ? wardNameEl.textContent : "ICU"} units set to ${units}`
        );
        updateIcuAiCard();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const now = new Date();
        if (updatedEl) updatedEl.textContent = now.toLocaleTimeString();
        const wardNameEl = card.querySelector(".bed-ward-name");
        const total = parseInt(totalEl.textContent, 10) || 0;
        const occ = parseInt(occEl.textContent, 10) || 0;
        const statusLabel =
          card.getAttribute("data-bed-status-label") || "stable";
        addAuditEntry(
          "bed-save",
          `${wardNameEl ? wardNameEl.textContent : "Ward"} saved with ${occ}/${total} ${statusLabel}`
        );
        if (card.getAttribute("data-ward-type") === "icu") {
          updateIcuAiCard();
        }
        const hospitalId = localStorage.getItem('hospitalId') || 'UH-HOS-00000';
if (hospitalId && window.uhDbRef && window.uhDbUpdate) {
  const wardTitle = wardNameEl ? wardNameEl.textContent : 'Unknown Ward';
  const type = card.getAttribute('data-ward-type') || 'general';
  const code = card.getAttribute('data-ward-name') || '';
  const icuUnitInput = card.querySelector('.icu-unit-input');
  const icuUnits = icuUnitInput ? (parseInt(icuUnitInput.value, 10) || 0) : 0;
  const cleanKey = wardTitle.replace(/[.#$/\[\]]/g, '_');

  window.uhDbUpdate(
    window.uhDbRef(`Hospitals/${hospitalId}/beds/${cleanKey}`),
    {
      name: wardTitle,
      type,
      code,
      total,
      occupied: occ,
      available: avail,
      icuUnits,
      updatedAt: now.toISOString()
    }
  );
}

        alert("Bed configuration saved.");
      });
    }
  }

  // wire existing cards
  cards().forEach((card) => wireBedCard(card));
  updateIcuAiCard();

  // ---------- ADD WARD UI ----------
  const addBtn = document.getElementById("addWardBtn");
  const addType = document.getElementById("addWardType");
  const addName = document.getElementById("addWardName");
  const addTotal = document.getElementById("addWardTotal");
  const addOcc = document.getElementById("addWardOccupied");

  if (addBtn && addType && addName && addTotal && addOcc) {
    addBtn.addEventListener("click", () => {
      const type = (addType.value || "").toLowerCase();
      const nameCode = addName.value.trim().toUpperCase();
      const total = parseInt(addTotal.value, 10) || 0;
      let occ = parseInt(addOcc.value, 10) || 0;
      if (!type || !nameCode || total <= 0) {
        alert("Fill ward type, name and total beds.");
        return;
      }
      if (occ < 0) occ = 0;
      if (occ > total) occ = total;
      const avail = total - occ;

      let wardTitle = "";
      if (type === "general") wardTitle = `General Ward ${nameCode}`;
      else if (type === "emergency") wardTitle = `Emergency Ward ${nameCode}`;
      else if (type === "icu") wardTitle = `ICU Unit ${nameCode}`;
      else wardTitle = `Ward ${nameCode}`;

      const isIcu = type === "icu";

      const cardDiv = document.createElement("div");
      cardDiv.className = "panel panel-lg bed-card";
      cardDiv.setAttribute("data-ward", wardTitle);
      cardDiv.setAttribute("data-ward-type", type);
      cardDiv.setAttribute("data-ward-name", nameCode);

      cardDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <div class="bed-ward-name fw-semibold">${wardTitle}</div>
            <div class="text-muted small">${
              type === "icu"
                ? "Critical Care"
                : type === "emergency"
                ? "Emergency"
                : "General"
            }</div>
          </div>
          <span class="badge bg-success-subtle text-success-emphasis bed-pill" data-pill="status">
            Stable
          </span>
        </div>

        <div class="bed-row">
          <div class="bed-label">Total</div>
          <div class="bed-value" data-field="total">${total}</div>
        </div>
        <div class="bed-row">
          <div class="bed-label">Occupied</div>
          <div class="bed-value" data-field="occupied">${occ}</div>
        </div>
        <div class="bed-row">
          <div class="bed-label">Available</div>
          <div class="bed-value" data-field="available">${avail}</div>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-2">
          <button class="btn btn-sm btn-outline-secondary bed-btn-decrease" type="button">−</button>
          <button class="btn btn-sm btn-outline-secondary bed-btn-increase" type="button">+</button>
        </div>

        ${
          isIcu
            ? `
        <div class="mt-2 icu-unit-row">
          <label class="small text-muted mb-1">ICU Units</label>
          <input type="number" min="1"
            class="form-control form-control-sm icu-unit-input"
            value="1" />
        </div>`
            : ""
        }

        <div class="bed-updated small text-muted mt-2">
          Updated by: Admin • <span data-field="updated">--:--:--</span>
        </div>
        <div class="small mt-1" data-field="risk">
          AI: Capacity sufficient for now.
        </div>

        <div class="d-flex justify-content-end mt-2">
          <button class="btn btn-sm btn-primary bed-save-btn" type="button">
            Save
          </button>
        </div>
      `;

      cardsWrapper.appendChild(cardDiv);
      wireBedCard(cardDiv);
      updateIcuAiCard();

      addAuditEntry(
        "bed-add",
        `${wardTitle} created with ${occ}/${total} beds`
      );
      if (isIcu) {
        addAuditEntry("icu-unit-update", `${wardTitle} units initialised`);
      }

      addName.value = "";
      addTotal.value = "";
      addOcc.value = "";
      alert("Ward added.");
    });
  }
  function loadBedsFromDb() {
  const hospitalId = localStorage.getItem('hospitalId') || 'UH-HOS-00000';
  if (!hospitalId || !window.uhDbOnValue || !window.uhDbRef) return;

  const root = document.getElementById('bedsPageRoot');
  if (!root) return;
  const cardsWrapper = root.querySelector('.beds-grid');
  if (!cardsWrapper) return;

  const ref = window.uhDbRef(`Hospitals/${hospitalId}/beds`);
  window.uhDbOnValue(ref, (snap) => {
    const data = snap.val();
    if (!data) return; // keep static demo if nothing yet

    cardsWrapper.innerHTML = '';
    Object.values(data).forEach((bed) => {
      // create card from bed data (same HTML structure as your static cards)
      // then call wireBedCard(cardDiv);
    });
    updateIcuAiCard();
  });
}

// At end of initBedManagement:
loadBedsFromDb();

}
function updateBedSummaryToDb() {
  const hospitalId = localStorage.getItem('hospitalId');
  if (!hospitalId || !window.uhDbRef || !window.uhDbUpdate) return;

  const root = document.getElementById('bedsPageRoot');
  if (!root) return;

  const cards = root.querySelectorAll('.bed-card');

  let totalBeds = 0;
  let occupiedBeds = 0;
  let icuTotal = 0;
  let icuOccupied = 0;

  cards.forEach(card => {
    const totalEl = card.querySelector('[data-field="total"]');
    const occEl = card.querySelector('[data-field="occupied"]');
    const type = card.getAttribute('data-ward-type');

    const total = totalEl ? parseInt(totalEl.textContent, 10) || 0 : 0;
    const occ = occEl ? parseInt(occEl.textContent, 10) || 0 : 0;

    totalBeds += total;
    occupiedBeds += occ;

    if (type === 'icu') {
      icuTotal += total;
      icuOccupied += occ;
    }
  });

  const availableBeds = Math.max(totalBeds - occupiedBeds, 0);
  const icuAvailable = Math.max(icuTotal - icuOccupied, 0);

window.uhDbUpdate(
  window.uhDbRef(`Hospitals/${hospitalId}/bedSummary`),
  { totalBeds, occupiedBeds, availableBeds, icuTotal, icuAvailable }
);

}



// ---------- DOCTORS PAGE ----------
function initDoctorsPage() {
  const root = document.getElementById("doctorsPageRoot");
  if (!root) return;

  const theme = localStorage.getItem("uh-hospital-theme") || "light";
  hosApplyTheme(theme);

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.addEventListener("click", hosToggleTheme);

  const hosId = localStorage.getItem("hospitalId");
  if (hosId) {
    const spanTop = document.getElementById("sidebarHospitalId");
    if (spanTop) spanTop.textContent = hosId;
    const spanBottom = document.getElementById("sidebarHospitalIdBottom");
    if (spanBottom) spanBottom.textContent = hosId;
  }

  const emSelect = document.getElementById("docEmStatusSelect");
  if (emSelect) {
    emSelect.addEventListener("change", () => {
      setBodyEmergencyMode(emSelect.value);
      addAuditEntry(
        "emergency-status-update",
        `Doctors page emergency mode set to ${emSelect.value}`
      );
    });
    setBodyEmergencyMode(emSelect.value || "busy");
  }

  const doctorCardsWrapper = document.getElementById("doctorCardsWrapper");

  function hhmmToMinutes(str) {
    if (!str) return null;
    const [h, m] = str.split(":").map((v) => parseInt(v, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  function isNowWithinRange(startStr, endStr) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const start = hhmmToMinutes(startStr);
    const end = hhmmToMinutes(endStr);
    if (start == null || end == null) return false;

    if (end >= start) {
      return nowMin >= start && nowMin <= end;
    }
    // overnight shifts (e.g., 22:00–06:00)
    return nowMin >= start || nowMin <= end;
  }

  const summary = document.getElementById("docSummaryText");

  function getAllToggles() {
    return root.querySelectorAll(".doc-toggle");
  }

  function updateDocCounts() {
    const toggles = getAllToggles();
    let total = 0;
    let onDuty = 0;
    toggles.forEach((t) => {
      total += 1;
      if (t.checked) onDuty += 1;
    });
    if (summary) {
      summary.textContent = `${onDuty} of ${total} doctors currently on duty`;
    }
  }

  function wireDoctorCard(card) {
    const toggle = card.querySelector(".doc-toggle");
    if (!toggle) return;
    const pill = card.querySelector(".doc-pill");

    function applyToggleState(checked) {
      if (!pill) return;
      if (checked) {
        pill.textContent = "On Duty";
        pill.className =
          "badge bg-success-subtle text-success-emphasis ms-auto doc-pill";
        card.classList.remove("off-duty");
      } else {
        pill.textContent = "Off Duty";
        pill.className =
          "badge bg-secondary-subtle text-secondary-emphasis ms-auto doc-pill";
        card.classList.add("off-duty");
      }
    }

    toggle.addEventListener("change", () => {
      applyToggleState(toggle.checked);
      const nameEl = card.querySelector(".fw-semibold");
      if (nameEl) {
        addAuditEntry(
          "doctor-status-update",
          `${nameEl.textContent} ${toggle.checked ? "On Duty" : "Off Duty"}`
        );
      }

      // persist manual toggle to Firebase
      const hospitalId = localStorage.getItem("hospitalId");
      const docId = card.getAttribute("data-doc-id");
      if (hospitalId && docId && window.uhDbUpdate && window.uhDbRef) {
        window.uhDbUpdate(
  window.uhDbRef(`Hospitals/${hospitalId}/doctors/${docId}`),
  { onDuty: toggle.checked, fromNewDoctorsPage: true }
);

      }

      updateDocCounts();
    });

    applyToggleState(toggle.checked);
  }

  function refreshDoctorSchedule() {
    const cards = root.querySelectorAll(".doc-card");
    const now = new Date();

    cards.forEach((card) => {
      const toggle = card.querySelector(".doc-toggle");
      const pill = card.querySelector(".doc-pill");
      if (!toggle || !pill) return;

      const startStr = card.getAttribute("data-start-time");
      const endStr = card.getAttribute("data-end-time");
      const shouldBeOn = isNowWithinRange(startStr, endStr);

      if (toggle.checked !== shouldBeOn) {
        toggle.checked = shouldBeOn;
        if (shouldBeOn) {
          pill.textContent = "On Duty";
          pill.className =
            "badge bg-success-subtle text-success-emphasis ms-auto doc-pill";
          card.classList.remove("off-duty");
        } else {
          pill.textContent = "Off Duty";
          pill.className =
            "badge bg-secondary-subtle text-secondary-emphasis ms-auto doc-pill";
          card.classList.add("off-duty");
        }

        // persist auto change to Firebase so dashboard sees it
        const hospitalId = localStorage.getItem("hospitalId");
        const docId = card.getAttribute("data-doc-id");
        if (hospitalId && docId && window.uhDbUpdate && window.uhDbRef) {
          window.uhDbUpdate(
  window.uhDbRef(`Hospitals/${hospitalId}/doctors/${docId}`),
  { onDuty: shouldBeOn, fromNewDoctorsPage: true }
);

        }

        const nameEl = card.querySelector(".fw-semibold");
        if (nameEl) {
          addAuditEntry(
            "doctor-status-update",
            `${nameEl.textContent} auto ${
              shouldBeOn ? "On Duty" : "Off Duty"
            } ${now.toLocaleTimeString()}`
          );
        }
      }
    });

    updateDocCounts();
  }

  // --- Load doctors from Firebase and build cards ---
  (function loadDoctorsFromDb() {
    const hospitalId = localStorage.getItem("hospitalId");
    if (
      !hospitalId ||
      !window.uhDbOnValue ||
      !window.uhDbRef ||
      !doctorCardsWrapper
    )
      return;

    const ref = window.uhDbRef(`Hospitals/${hospitalId}/doctors`);

    window.uhDbOnValue(ref, (snap) => {
      const data = snap.val() || {};
      doctorCardsWrapper.innerHTML = "";

      Object.entries(data).forEach(([id, doc]) => {
        const col = document.createElement("div");
        col.className = "col-12";

        const startTime = doc.startTime || "09:00";
        const endTime = doc.endTime || "17:00";

        function formatLabel(hhmm) {
          if (!hhmm) return "";
          const [hStr, mStr] = hhmm.split(":");
          let h = parseInt(hStr, 10);
          const m = mStr || "00";
          const ampm = h >= 12 ? "PM" : "AM";
          if (h === 0) h = 12;
          else if (h > 12) h -= 12;
          return `${h}:${m} ${ampm}`;
        }

        const timeLabel = `${formatLabel(startTime)} – ${formatLabel(endTime)}`;

        col.innerHTML = `
          <div class="panel doc-card"
               data-start-time="${startTime}"
               data-end-time="${endTime}"
               data-doc-id="${id}">
            <div class="d-flex align-items-center mb-3">
              <img src="doctor-hos.jpg" alt="Doctor"
                class="rounded-circle me-3"
                style="width: 56px; height: 56px; object-fit: cover" />
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2">
                  <span class="doc-status-dot"></span>
                  <div class="fw-semibold">${doc.name || "Doctor"}</div>
                </div>
                <div class="text-muted small">
                  ${doc.specialization || "General"} ${doc.degrees || "MBBS"}
                </div>
                <div class="text-muted small">
                  <i class="fa-regular fa-clock me-1"></i>
                  <span class="doc-time-range">${timeLabel}</span>
                </div>
              </div>
              <span class="badge bg-secondary-subtle text-secondary-emphasis ms-auto doc-pill">
                Off Duty
              </span>
            </div>
            <div class="small mb-2">
              <strong>Department</strong> ${
                doc.department || doc.specialization || "General"
              }
              &nbsp;&nbsp;&nbsp;
              <strong>Experience</strong> ${doc.experience || "0"} years
            </div>
            <div class="small mb-2">
              <strong>Languages</strong> ${doc.languages || "English"}
            </div>
            <hr class="my-2" />
            <div class="d-flex justify-content-between align-items-center small">
              <span>Duty Status</span>
              <div class="form-check form-switch m-0">
                <input class="form-check-input doc-toggle" type="checkbox" ${
                  doc.onDuty ? "checked" : ""
                } />
              </div>
            </div>
          </div>
        `;
        doctorCardsWrapper.appendChild(col);
        wireDoctorCard(col.querySelector(".doc-card"));
      });

      // apply schedule immediately after loading
      refreshDoctorSchedule();
    });
  })();

  // --- Save new doctor into Firebase ---
  const saveBtn = document.getElementById("btnSaveDoctor");
  if (saveBtn && doctorCardsWrapper) {
    saveBtn.addEventListener("click", () => {
      const firstName = document.getElementById("docFirstName").value.trim();
      const middleName = document.getElementById("docMiddleName").value.trim();
      const lastName = document.getElementById("docLastName").value.trim();

      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ");

      if (!fullName) {
        alert("Please enter at least first and last name.");
        return;
      }

      const specialization =
        document.getElementById("docSpecialization").value.trim() || "General";
      const degrees =
        document.getElementById("docDegrees").value.trim() || "MBBS";
      const experience =
        document.getElementById("docExperience").value.trim() || "0";
      const department =
        document.getElementById("docDepartment").value.trim() || specialization;
      const languages =
        document.getElementById("docLanguages").value.trim() || "English";
      const startTime =
        document.getElementById("docStartTime").value || "09:00";
      const endTime =
        document.getElementById("docEndTime").value || "17:00";

      const hospitalId = localStorage.getItem("hospitalId");
      if (hospitalId && window.uhDbRef && window.uhDbUpdate) {
        const newKey = Date.now().toString();
        window.uhDbUpdate(
          window.uhDbRef(`Hospitals/${hospitalId}/doctors/${newKey}`),
          {
            name: `Dr. ${fullName}`,
            specialization,
            degrees,
            experience,
            department,
            startTime,
            endTime,
            languages,
            onDuty: false,
            fromNewDoctorsPage: true,
          }
        );
      }

      addAuditEntry("doctor-add", `New doctor added Dr. ${fullName}`);

      const modalEl = document.getElementById("addDoctorModal");
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      const form = document.getElementById("addDoctorForm");
      if (form) form.reset();
    });
  }

  // initial run + schedule
  refreshDoctorSchedule();
  setInterval(refreshDoctorSchedule, 60000);

  updateDocCounts();
}
// ---------- TOKENS: FIREBASE + PAGE LOGIC ----------

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTokensBaseRef() {
  const hospitalId = localStorage.getItem("hospitalId") || "UH-HOS-00000";
  return window.uhDbRef(`Hospitals/${hospitalId}/tokens`);
}

function saveTokenToDb(token) {
  const baseRef = getTokensBaseRef();
  const todayKey = getTodayKey();

  const tid = token.tokenId || baseRef.child(todayKey).push().key;
  const nowIso = new Date().toISOString();

  const tokenData = {
    tokenId: tid,
    patientName: token.patientName || "",
    reason: token.reason || "Normal",
    eta: token.eta || "",
    status: token.status || "Waiting",
    priority:
      token.priority || (token.reason === "Emergency" ? "emergency" : "normal"),
    createdAt: token.createdAt || nowIso,
    updatedAt: nowIso,
  };

  window.uhDbUpdate(baseRef.child(`${todayKey}/${tid}`), tokenData);
  if (typeof addAuditEntry === "function") {
    addAuditEntry(
      "token-save",
      `Token ${tid} updated with status ${tokenData.status}`
    );
  }
  return tid;
}

function updateTokenStatusInDb(tokenId, partial) {
  const baseRef = getTokensBaseRef();
  const todayKey = getTodayKey();
  const nowIso = new Date().toISOString();

  const patch = { ...partial, updatedAt: nowIso };

  window.uhDbUpdate(baseRef.child(`${todayKey}/${tokenId}`), patch);
  if (typeof addAuditEntry === "function") {
    addAuditEntry(
      "token-status",
      `Token ${tokenId} patched: ${JSON.stringify(patch)}`
    );
  }
}

function listenTodayTokens(callback) {
  const baseRef = getTokensBaseRef();
  const todayKey = getTodayKey();

  window.uhDbOnValue(baseRef.child(todayKey), (snap) => {
    const data = snap.val() || {};
    const list = Object.values(data);
    callback(list);
  });
}
function initTokensPage() {
  const root = document.getElementById("tokensPageRoot");
  if (!root) return;

  const tableBody = root.querySelector("#tokensTableBody");
  const totalEl = root.querySelector("#tokensTotal");
  const emergencyEl = root.querySelector("#tokensEmergency");
  const pendingEl = root.querySelector("#tokensPending");
  const inHospitalEl = root.querySelector("#tokensInHospital");
  const nextTokenEl = root.querySelector("#tokensNext");
  const avgTimeEl = root.querySelector("#tokensAvgTime");

  function renderTokens(tokens) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    let total = tokens.length;
    let emergencyCount = 0;
    let pendingCount = 0;
    let inHospital = 0;
    let nextToken = "-";
    let totalMinutes = 0;

    const sorted = [...tokens].sort((a, b) => {
      const pa = a.priority === "emergency" ? 0 : 1;
      const pb = b.priority === "emergency" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.tokenId || "").localeCompare(b.tokenId || "");
    });

    if (sorted.length) {
      const next = sorted.find((t) => t.status === "Waiting");
      if (next) nextToken = next.tokenId;
    }

    sorted.forEach((t) => {
      if (t.reason === "Emergency") emergencyCount++;
      if (t.status === "Waiting") pendingCount++;
      if (t.status === "Approved") inHospital++;

      const m = (t.eta || "").match(/(\d+)/);
      if (m) totalMinutes += parseInt(m[1], 10);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.tokenId || "-"}</td>
        <td>${t.patientName || "-"}</td>
        <td>${t.reason || "-"}</td>
        <td>${t.eta || "-"}</td>
        <td>${t.status || "-"}</td>
        <td>
          <button class="btn btn-sm btn-outline-success me-1" data-action="approve" data-id="${t.tokenId}">Approve</button>
          <button class="btn btn-sm btn-outline-secondary me-1" data-action="complete" data-id="${t.tokenId}">Complete</button>
          <button class="btn btn-sm btn-outline-danger" data-action="cancel" data-id="${t.tokenId}">Cancel</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    if (totalEl) totalEl.textContent = total;
    if (emergencyEl) emergencyEl.textContent = emergencyCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (inHospitalEl) inHospitalEl.textContent = inHospital;
    if (nextTokenEl) nextTokenEl.textContent = nextToken;
    if (avgTimeEl) {
      avgTimeEl.textContent = total ? `${Math.round(totalMinutes / total)}m` : "0m";
    }
  }

  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const tokenId = btn.getAttribute("data-id");
      if (!tokenId) return;

      if (action === "approve") {
        updateTokenStatusInDb(tokenId, { status: "Approved" });
      } else if (action === "complete") {
        updateTokenStatusInDb(tokenId, { status: "Completed" });
      } else if (action === "cancel") {
        updateTokenStatusInDb(tokenId, { status: "Cancelled" });
      }
    });
  }

  const newForm = root.querySelector("#newTokenForm");
  if (newForm) {
    newForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const tokenId = newForm.querySelector("#newTokenId").value.trim();
      const name = newForm.querySelector("#newTokenName").value.trim();
      const reason =
        newForm.querySelector("#newTokenReason").value || "Normal";
      const eta = newForm.querySelector("#newTokenEta").value.trim();

      if (!tokenId || !name) {
        alert("Token ID and Patient Name are required.");
        return;
      }

      saveTokenToDb({
        tokenId,
        patientName: name,
        reason,
        eta,
        status: "Waiting",
      });

      newForm.reset();
    });
  }

  listenTodayTokens(renderTokens);
}

// expose for hospital-doctors.html
window.initDoctorsPage = initDoctorsPage;


// ---------- ANALYTICS PAGE ----------
function initAnalyticsPage() {
  const root = document.getElementById("analyticsPageRoot");
  if (!root) return;

  const theme = localStorage.getItem("uh-hospital-theme") || "light";
  hosApplyTheme(theme);

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.addEventListener("click", hosToggleTheme);

  const hosId = localStorage.getItem("hospitalId");
  if (hosId) {
    const span = document.getElementById("sidebarHospitalId");
    if (span) span.textContent = hosId;
  }

  updateEmergencyFlowNodes({ normal: 72, busy: 24, overloaded: 4 });
  buildPatientFlowchart();
}

// ---------- AUDIT PAGE ----------
function initAuditPage() {
  const root = document.getElementById("auditPageRoot");
  if (!root) return;

  const theme = localStorage.getItem("uh-hospital-theme") || "light";
  hosApplyTheme(theme);

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.addEventListener("click", hosToggleTheme);

  const hosId = localStorage.getItem("hospitalId");
  if (hosId) {
    const span = document.getElementById("sidebarHospitalId");
    if (span) span.textContent = hosId;
  }

  const table = document.getElementById("auditTable");
  const tbody = table ? table.querySelector("tbody") : null;
  const countSpan = document.getElementById("auditCount");
  const totalEventsEl = document.getElementById("auditTotalEvents");
  const events24hEl = document.getElementById("audit24hEvents");
  const critEventsEl = document.getElementById("auditCriticalEvents");
  const lastSyncEl = document.getElementById("auditLastSyncLabel");

  const stored = JSON.parse(localStorage.getItem("uhAuditEntries") || "[]");
  uhAuditEntries = stored;

  if (tbody && tbody.children.length && !stored.length) {
    Array.from(tbody.children).forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length === 6) {
        stored.push({
          time: tds[1].textContent,
          user: tds[2].textContent,
          role: tds[3].textContent,
          action: tds[4].textContent,
          details: tds[5].textContent,
        });
      }
    });
    localStorage.setItem("uhAuditEntries", JSON.stringify(stored));
    uhAuditEntries = stored;
  }

  function inferDomain(action, details) {
    const a = action.toLowerCase();
    const d = details.toLowerCase();
    if (a.includes("bed")) return "bed";
    if (a.includes("doctor")) return "doctor";
    if (a.includes("token")) return "token";
    if (a.includes("emergency") || d.includes("overload")) return "emergency";
    return "other";
  }

  function inferSeverity(action, details) {
    const txt = (action + " " + details).toLowerCase();
    if (txt.includes("overload") || txt.includes("critical")) return "critical";
    if (txt.includes("near") || txt.includes("busy")) return "warning";
    return "info";
  }

  function parseTimeToDate(timeStr) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  function isWithinRange(date, range) {
    if (!date) return false;
    if (range === "all") return true;
    const now = new Date();
    const diffMs = now - date;
    const diffH = diffMs / (1000 * 60 * 60);
    if (range === "24h") return diffH <= 24;
    if (range === "1h") return diffH <= 1;
    return true;
  }

  function renderTable(filterText = "", actionFilter = "all", timeRange = "all") {
    if (!tbody) return;
    const term = filterText.toLowerCase();
    tbody.innerHTML = "";

    let total = 0;
    let last24h = 0;
    let critical = 0;

    uhAuditEntries.forEach((e) => {
      const rowText = `${e.time} ${e.user} ${e.role} ${e.action} ${e.details}`.toLowerCase();
      const domain = inferDomain(e.action, e.details);
      if (actionFilter !== "all" && domain !== actionFilter) return;

      const dateObj = parseTimeToDate(e.time);
      if (!isWithinRange(dateObj, timeRange)) return;

      if (term && !rowText.includes(term)) return;

      const severity = inferSeverity(e.action, e.details);
      const isCritical = severity === "critical";

      total += 1;
      if (isWithinRange(dateObj, "24h")) last24h += 1;
      if (isCritical) critical += 1;

      let iconClass = "fa-solid fa-circle-info";
      if (domain === "bed") iconClass = "fa-solid fa-bed-pulse";
      else if (domain === "doctor") iconClass = "fa-solid fa-user-doctor";
      else if (domain === "emergency") iconClass = "fa-solid fa-triangle-exclamation";
      else if (domain === "token") iconClass = "fa-solid fa-ticket";

      let badgeClass =
        "badge bg-secondary-subtle text-secondary-emphasis";
      if (domain === "bed")
        badgeClass = "badge bg-primary-subtle text-primary-emphasis";
      else if (domain === "doctor")
        badgeClass = "badge bg-success-subtle text-success-emphasis";
      else if (domain === "emergency")
        badgeClass = "badge bg-danger-subtle text-danger-emphasis";
      else if (domain === "token")
        badgeClass = "badge bg-warning-subtle text-warning-emphasis";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="audit-icon-cell"><i class="${iconClass}"></i></td>
        <td>${e.time}</td>
        <td>${e.user}</td>
        <td>${e.role}</td>
        <td><span class="${badgeClass}">${e.action}</span></td>
        <td>${e.details}</td>
      `;
      tbody.appendChild(tr);
    });

    if (countSpan) countSpan.textContent = uhAuditEntries.length.toString();
    if (totalEventsEl) totalEventsEl.textContent = total.toString();
    if (events24hEl) events24hEl.textContent = last24h.toString();
    if (critEventsEl) critEventsEl.textContent = critical.toString();
    if (lastSyncEl) {
      const now = new Date();
      lastSyncEl.textContent = `Last refresh ${now.toLocaleTimeString()}`;
    }

    updateAiBox(total, last24h, critical, actionFilter, timeRange);
  }

  function updateAiBox(total, last24h, critical, actionFilter, timeRange) {
    const aiSummary = document.getElementById("auditAiSummary");
    const aiList = document.getElementById("auditAiList");
    if (!aiSummary || !aiList) return;

    const rangeLabel =
      timeRange === "1h"
        ? "last hour"
        : timeRange === "24h"
        ? "last 24 hours"
        : "current window";

    aiSummary.textContent = `AI scanned ${total} entries in the ${rangeLabel} across emergency mode, beds and doctors.`;

    const bedChanges = uhAuditEntries.filter(
      (e) => e.action === "bed-update"
    ).length;
    const docChanges = uhAuditEntries.filter(
      (e) => e.action === "doctor-status-update"
    ).length;
    const overloads = uhAuditEntries.filter((e) =>
      /overloaded|overload/i.test(e.details)
    ).length;

    aiList.innerHTML = "";

    const li1 = document.createElement("li");
    li1.textContent = `Bed updates ${bedChanges}, Doctor status changes ${docChanges}.`;
    aiList.appendChild(li1);

    const li2 = document.createElement("li");
    if (overloads > 0) {
      li2.textContent =
        "Overload events detected – monitor ICU and emergency beds closely.";
    } else {
      li2.textContent =
        "No overload events in this window – utilisation looks stable.";
    }
    aiList.appendChild(li2);

    const li3 = document.createElement("li");
    if (critical > 0) {
      li3.textContent = `Detected critical ${critical} signals. Consider reviewing emergency mode changes and capacity decisions.`;
    } else {
      li3.textContent = "No critical signals found in recent activity.";
    }
    aiList.appendChild(li3);
  }

  let currentSearch = "";
  let currentActionFilter = "all";
  let currentTimeRange = "all";

  renderTable(currentSearch, currentActionFilter, currentTimeRange);

  const filterInput = document.getElementById("auditFilter");
  if (filterInput) {
    filterInput.addEventListener("input", () => {
      currentSearch = filterInput.value;
      renderTable(currentSearch, currentActionFilter, currentTimeRange);
    });
  }

  const chips = root.querySelectorAll(".audit-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentActionFilter = chip.getAttribute("data-action-filter") || "all";
      renderTable(currentSearch, currentActionFilter, currentTimeRange);
    });
  });

  const timeSelect = document.getElementById("auditTimeRange");
  if (timeSelect) {
    timeSelect.addEventListener("change", () => {
      currentTimeRange = timeSelect.value || "all";
      renderTable(currentSearch, currentActionFilter, currentTimeRange);
    });
  }

  const exportBtn = document.getElementById("btnExportAudit");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (!uhAuditEntries.length) {
        alert("No audit entries to export.");
        return;
      }
      const header = ["Time", "User", "Role", "Action", "Details"];
      const rows = uhAuditEntries.map((e) => [
        e.time,
        e.user,
        e.role,
        e.action,
        e.details,
      ]);
      const csv =
        [header, ...rows]
          .map((row) =>
            row
              .map((cell) => String(cell).replace(/"/g, '""'))
              .map((cell) => `"${cell}"`)
              .join(",")
          )
          .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "unihealth-audit-log.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

// ---------- TOKENS PAGE ----------
function initTokensPage() {
  const root = document.getElementById("tokensPageRoot");
  if (!root) return;

  const theme = localStorage.getItem("uh-hospital-theme") || "light";
  hosApplyTheme(theme);

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) themeBtn.addEventListener("click", hosToggleTheme);

  const hosId = localStorage.getItem("hospitalId");
  if (hosId) {
    const span = document.getElementById("sidebarHospitalId");
    if (span) span.textContent = hosId;
  }

  const filter = document.getElementById("tokenFilter");
  const table = document.getElementById("tokenTable");
  const tbody = table ? table.querySelector("tbody") : null;

  function applyFilter() {
    if (!tbody || !filter) return;
    const mode = filter.value;
    Array.from(tbody.children).forEach((tr) => {
      const type = tr.getAttribute("data-token-type");
      const status = tr.getAttribute("data-token-status");
      let show = true;
      if (mode === "emergency" && type !== "emergency") show = false;
      if (mode === "waiting" && status !== "waiting") show = false;
      tr.style.display = show ? "" : "none";
    });
  }

  if (filter) filter.addEventListener("change", applyFilter);
  applyFilter();

  if (tbody) {
    tbody.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-token-action]");
      if (!btn) return;
      const tr = btn.closest("tr");
      if (!tr) return;

      const tokenId = tr.getAttribute("data-token-id") || "Unknown token";
      const patientName =
        tr.getAttribute("data-patient-name") || "Unknown patient";
      const currentStatus =
        tr.getAttribute("data-token-status") || "unknown";
      const actionType = btn.getAttribute("data-token-action");

      let newStatus = currentStatus;
      let detailText = `${tokenId} ${patientName}`;
      if (actionType === "approve") {
        newStatus = "approved";
        detailText += " approved";
      } else if (actionType === "cancel") {
        newStatus = "cancelled";
        detailText += " cancelled";
      } else if (actionType === "delay") {
        newStatus = "delayed";
        detailText += " delayed";
      } else {
        return;
      }

      tr.setAttribute("data-token-status", newStatus);
      const statusBadge = tr.querySelector("[data-token-status-badge]");
      if (statusBadge) {
        statusBadge.textContent =
          newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        statusBadge.className =
          "badge rounded-pill small";
        if (newStatus === "approved") {
          statusBadge.classList.add(
            "bg-success-subtle",
            "text-success-emphasis"
          );
        } else if (newStatus === "cancelled") {
          statusBadge.classList.add(
            "bg-danger-subtle",
            "text-danger-emphasis"
          );
        } else if (newStatus === "delayed") {
          statusBadge.classList.add(
            "bg-warning-subtle",
            "text-warning-emphasis"
          );
        } else {
          statusBadge.classList.add(
            "bg-secondary-subtle",
            "text-secondary-emphasis"
          );
        }
      }

      addAuditEntry("token-update", detailText);
      applyFilter();
    });
  }
}

// ---------- ENTRY POINT ----------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("login-view")) {
    const theme = localStorage.getItem("uh-hospital-theme") || "light";
    applyTheme(theme);

    const tBtn = document.getElementById("themeToggleBtn");
    if (tBtn) tBtn.addEventListener("click", toggleTheme);

    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) loginBtn.addEventListener("click", handleLogin);

    const linkToReg = document.getElementById("linkToRegister");
    if (linkToReg) linkToReg.addEventListener("click", () => showView("reg"));

    const linkToForgot = document.getElementById("linkToForgot");
    if (linkToForgot) linkToForgot.addEventListener("click", () => showView("forgot"));

    const linkBackToLoginFromReg = document.getElementById(
      "linkBackToLoginFromReg"
    );
    if (linkBackToLoginFromReg) {
      linkBackToLoginFromReg.addEventListener("click", () => showView("login"));
    }

    const linkBackToLoginFromForgot = document.getElementById(
      "linkBackToLoginFromForgot"
    );
    if (linkBackToLoginFromForgot) {
      linkBackToLoginFromForgot.addEventListener("click", () => showView("login"));
    }

    const startOtpBtn = document.getElementById("startOtpBtn");
    if (startOtpBtn) startOtpBtn.addEventListener("click", startOtpFlow);

    const completeRegBtn = document.getElementById("completeRegBtn");
    if (completeRegBtn) {
      completeRegBtn.addEventListener("click", handleRegistration);
    }

    const resendOtpBtn = document.getElementById("resendOtpBtn");
    if (resendOtpBtn) resendOtpBtn.addEventListener("click", resendOtp);

    const editRegDetailsLink = document.getElementById("editRegDetailsLink");
    if (editRegDetailsLink) {
      editRegDetailsLink.addEventListener("click", backToRegDetails);
    }

    const fpSendOtpBtn = document.getElementById("fpSendOtpBtn");
    if (fpSendOtpBtn) fpSendOtpBtn.addEventListener("click", fpStart);

    const fpResendBtn = document.getElementById("fpResendBtn");
    if (fpResendBtn) fpResendBtn.addEventListener("click", fpResend);

    const fpVerifyOtpBtn = document.getElementById("fpVerifyOtpBtn");
    if (fpVerifyOtpBtn) fpVerifyOtpBtn.addEventListener("click", fpVerifyOtp);

    const fpSetNewPassBtn = document.getElementById("fpSetNewPassBtn");
    if (fpSetNewPassBtn) {
      fpSetNewPassBtn.addEventListener("click", fpSetNewPassword);
    }

    // NEW: Forgot UH-HOS-ID wiring
    const linkToForgotId = document.getElementById("linkToForgotId");
    if (linkToForgotId) {
      linkToForgotId.addEventListener("click", () => showView("forgot-id"));
    }

    const linkBackToLoginFromForgotId = document.getElementById(
      "linkBackToLoginFromForgotId"
    );
    if (linkBackToLoginFromForgotId) {
      linkBackToLoginFromForgotId.addEventListener("click", fidBackToLogin);
    }

    const fidSendOtpBtn = document.getElementById("fidSendOtpBtn");
    if (fidSendOtpBtn) fidSendOtpBtn.addEventListener("click", fidStart);

    const fidResendBtn = document.getElementById("fidResendBtn");
    if (fidResendBtn) fidResendBtn.addEventListener("click", fidResend);

    const fidVerifyOtpBtn = document.getElementById("fidVerifyOtpBtn");
    if (fidVerifyOtpBtn) fidVerifyOtpBtn.addEventListener("click", fidVerifyOtp);

    const fidDoneBtn = document.getElementById("fidDoneBtn");
    if (fidDoneBtn) fidDoneBtn.addEventListener("click", fidBackToLogin);

    showView("login");
    return;
  }
   if (document.getElementById("tokensPageRoot")) {
    initTokensPage();
  }

  // Non-auth pages
  initHospitalDashboard();
  initBedManagement();
  initDoctorsPage();
  initAnalyticsPage();
  initAuditPage();
  initTokensPage();
});
