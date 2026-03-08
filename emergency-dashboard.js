// emergency-dashboard.js

// ---- THEME ----
function applyEmTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  localStorage.setItem("uh-em-theme", theme);
}

function toggleEmTheme() {
  const isDark = document.body.classList.contains("dark");
  applyEmTheme(isDark ? "light" : "dark");
}

// ---- STATUS + UI SYNC ----
function setEmergencyStatus(status) {
  const banner = document.getElementById("emergencyBanner");
  const pill   = document.getElementById("emStatusPill");
  const text   = document.getElementById("emStatusText");
  const sentence = document.getElementById("emStatusSentence");

  let label, pillClass, bannerGradient, desc;

  if (status === "normal") {
    label = "NORMAL";
    pillClass = "bg-success text-white";
    bannerGradient = "linear-gradient(90deg,#dcfce7,#e0f2fe)";
    desc = "Hospital load is currently normal.";
  } else if (status === "busy") {
    label = "BUSY";
    pillClass = "bg-warning text-dark";
    bannerGradient = "linear-gradient(90deg,#fef3c7,#fee2e2)";
    desc = "Hospital load is currently busy.";
  } else {
    label = "OVERLOADED";
    pillClass = "bg-danger text-white";
    bannerGradient = "linear-gradient(90deg,#fee2e2,#fecaca)";
    desc = "Hospital is currently overloaded. Redirect recommended.";
  }

  pill.className = "badge rounded-pill me-2 " + pillClass;
  pill.textContent = label;
  text.textContent = label[0] + label.slice(1).toLowerCase();
  banner.style.background = bannerGradient;
  sentence.innerHTML = `${desc}`;
}

// ---- LAST UPDATED LABEL ----
function updateLastUpdatedLabel() {
  const el = document.getElementById("lastUpdatedLabel");
  const now = new Date();
  el.textContent = `Last updated: ${now.toLocaleTimeString()} (Auto‑synced)`;
}

// ---- ACTIVITY LIST DEMO ----
function addActivityEntry(status) {
  const list = document.getElementById("activityList");
  const li = document.createElement("li");
  const now = new Date();

  li.innerHTML = `
    <span class="em-activity-dot"></span>
    Emergency mode: ${status}
    <span class="em-activity-meta">
      Admin • ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
    </span>
  `;
  list.prepend(li);
}

// ---- INITIALIZE ----
window.addEventListener("DOMContentLoaded", () => {
  // theme init
  const savedTheme = localStorage.getItem("uh-em-theme") || "light";
  applyEmTheme(savedTheme);

  const themeBtn = document.getElementById("emThemeToggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleEmTheme);

  // status select
  const select = document.getElementById("emStatusSelect");
  setEmergencyStatus(select.value);
  select.addEventListener("change", () => {
    const status = select.value;
    setEmergencyStatus(status);
    addActivityEntry(status);
    updateLastUpdatedLabel();
  });

  // manual "refresh" for activity
  const btnAddActivity = document.getElementById("btnAddActivity");
  if (btnAddActivity) {
    btnAddActivity.addEventListener("click", () => {
      addActivityEntry("busy");
      updateLastUpdatedLabel();
    });
  }

  // initial timestamp
  updateLastUpdatedLabel();
});
// LIVE EMERGENCY DASHBOARD SYNC - emergency-dashboard.html
window.addEventListener('DOMContentLoaded', () => {
  const hospitalId = localStorage.getItem('hospitalId') || 'UH-HOS-00000';
  if (!window.uhDbOnValue || !window.uhDbRef) return;

  const dashRef = window.uhDbRef(`Hospitals/${hospitalId}/emergency_dashboard`);
  window.uhDbOnValue(dashRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    // Numeric cards
    const bedsAvailEl = document.getElementById('bedsAvailable');
    const bedsTotalEl = document.getElementById('bedsTotal');
    const icuAvailEl  = document.getElementById('icuAvailable');
    const avgWaitEl   = document.getElementById('avgWait');
    const docsEl      = document.getElementById('doctorsOnDuty');

    if (bedsAvailEl) bedsAvailEl.textContent = data.bedsAvailable || 0;
    if (bedsTotalEl) bedsTotalEl.textContent = data.bedsTotal || 0;
    if (icuAvailEl)  icuAvailEl.textContent  = data.icuAvailable || 0;
    if (avgWaitEl)   avgWaitEl.textContent   = data.avgWait || 'N/A';
    if (docsEl)      docsEl.textContent      = data.doctorsOnDuty || 0;

    // Status dropdown + banner
    const select = document.getElementById('emStatusSelect');
    if (select) select.value = data.status || 'normal';
    if (typeof setEmergencyStatus === 'function') {
      setEmergencyStatus(data.status || 'normal');
    }

    // Last updated label
    const lastLbl = document.getElementById('lastUpdatedLabel');
    if (lastLbl) {
      lastLbl.textContent = `Last updated ${new Date().toLocaleTimeString()} (Live)`;
    }
  });
});
