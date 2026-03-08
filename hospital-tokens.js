// hospital-tokens.js

// Sidebar IDs
function initHospitalIds() {
  const hid = localStorage.getItem("hospitalId") || "UH-HOS-00000";
  const top = document.getElementById("sidebarHospitalId");
  const bottom = document.getElementById("sidebarHospitalIdBottom");
  if (top) top.textContent = hid;
  if (bottom) bottom.textContent = hid;
}

// Logout
function handleHospitalLogout() {
  localStorage.removeItem("hospitalId");
  window.location.href = "hospital-index.html";
}

// Theme toggle (tokens page only)
function tokensToggleTheme() {
  const isDark = document.body.classList.contains("dark");
  if (isDark) {
    document.body.classList.remove("dark");
    localStorage.setItem("uh-hospital-theme", "light");
  } else {
    document.body.classList.add("dark");
    localStorage.setItem("uh-hospital-theme", "dark");
  }
}

// Emergency override shared with patient app
function toggleEmergencyOverride(enabled) {
  const hospitalId = localStorage.getItem("hospitalId") || "UH-HOS-00000";
  if (!window.uhDbRef || !window.uhDbUpdate) return;

  const ref = uhDbRef(`Hospitals/${hospitalId}/settings`);
  uhDbUpdate(ref, { emergencyOverride: !!enabled });

  const txt = document.getElementById("overrideStatusText");
  if (txt) {
    txt.innerHTML =
      "Override is currently <strong>" +
      (enabled ? "ON" : "OFF") +
      "</strong>. " +
      (enabled
        ? "Emergency patients will jump the queue in both web and app."
        : "Normal queue order will be followed.");
  }

  if (typeof addAuditEntry === "function") {
    addAuditEntry(
      "TOKEN_OVERRIDE_TOGGLE",
      "Emergency override set to " + enabled
    );
  }
}

// Main init for tokens page
function initTokensPage() {
  const root = document.getElementById("tokensPageRoot");
  if (!root) return;

  // Theme
  const storedTheme = localStorage.getItem("uh-hospital-theme") || "light";
  if (storedTheme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", tokensToggleTheme);
  }

  initHospitalIds();

  const hospitalId = localStorage.getItem("hospitalId") || "UH-HOS-00000";

  const tbody = document.getElementById("tokensTableBody");
  const totalEl = document.getElementById("tokensTotal");
  const emergEl = document.getElementById("tokensEmergency");
  const pendingEl = document.getElementById("tokensPending");
  const inHospEl = document.getElementById("tokensInHospital");
  const nextTokenEl = document.getElementById("tokensNext");
  const avgTimeEl = document.getElementById("tokensAvgTime");
  const filterSelect = document.getElementById("tokenFilter");
  const overrideToggle = document.getElementById("overrideToggle");

  if (!tbody || !window.uhDbRef || !window.uhDbOnValue) return;

  // Listen to override setting
  const settingsRef = uhDbRef(`Hospitals/${hospitalId}/settings`);
  uhDbOnValue(settingsRef, (snap) => {
    const data = snap.val() || {};
    const enabled = !!data.emergencyOverride;
    if (overrideToggle) overrideToggle.checked = enabled;
    const txt = document.getElementById("overrideStatusText");
    if (txt) {
      txt.innerHTML =
        "Override is currently <strong>" +
        (enabled ? "ON" : "OFF") +
        "</strong>. " +
        (enabled
          ? "Emergency patients will jump the queue in both web and app."
          : "Normal queue order will be followed.");
    }
  });

  // FINAL TOKEN LOCATION: Hospitals/{hospitalId}/tokens/{YYYY-MM-DD}/{tokenId}
  const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const ref = uhDbRef(`Hospitals/${hospitalId}/tokens/${todayKey}`);

  let currentTokens = [];

  function renderTable() {
    const filter = filterSelect ? filterSelect.value : "all";
    tbody.innerHTML = "";

    let total = 0;
    let emergency = 0;
    let pending = 0;
    let inHospitalCount = 0;

    let totalMinutes = 0;
    let waitingCount = 0;

    const rows = [];
    const now = Date.now();

    currentTokens.forEach(({ key, data }) => {
      const statusRaw = (data.status || "waiting").toLowerCase();
      const status =
        statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);

      const tokenNum = data.tokenNum || key;
      const patientName = data.patientName || "-";
      const reason = data.type || "normal"; // or real reason field
      const type = (data.type || "normal").toLowerCase();

      const isEmergency = type === "emergency";

      // Filter
      if (filter === "emergency" && !isEmergency) return;
      if (
        filter === "waiting" &&
        !(
          statusRaw === "waiting" ||
          statusRaw === "requested" ||
          statusRaw === "pending"
        )
      ) {
        return;
      }

      total++;
      if (isEmergency) emergency++;

      const isWaiting =
        statusRaw === "waiting" ||
        statusRaw === "requested" ||
        statusRaw === "pending";
      if (isWaiting) {
        pending++;
        const ts = data.updatedAt || now;
        const diffMinutes = Math.max(
          0,
          Math.round((now - ts) / 60000)
        );
        totalMinutes += diffMinutes;
        waitingCount++;
      }

      if (statusRaw === "approved") inHospitalCount++;

      const ts = data.updatedAt || now;
      const timeStr = new Date(ts).toLocaleTimeString();

      let badgeClass =
        "badge rounded-pill small bg-warning-subtle text-warning-emphasis";
      if (statusRaw === "approved") {
        badgeClass =
          "badge rounded-pill small bg-success-subtle text-success-emphasis";
      } else if (statusRaw === "completed") {
        badgeClass =
          "badge rounded-pill small bg-primary-subtle text-primary-emphasis";
      } else if (statusRaw === "cancelled") {
        badgeClass =
          "badge rounded-pill small bg-secondary-subtle text-secondary-emphasis";
      }

      const row = document.createElement("tr");
      row.dataset.tokenKey = key;
      row.dataset.tokenId = tokenNum;
      row.innerHTML = `
        <td>${tokenNum}</td>
        <td>${patientName}<br />
          <small class="text-muted">${data.phone || ""}</small>
        </td>
        <td>${reason}</td>
        <td>${timeStr}</td>
        <td>
          <span class="${badgeClass}" data-token-status-badge>
            ${status}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-success me-1"
                  data-action="approve" data-id="${tokenNum}">
            Approve
          </button>
          <button class="btn btn-sm btn-outline-secondary me-1"
                  data-action="complete" data-id="${tokenNum}">
            Complete
          </button>
          <button class="btn btn-sm btn-outline-danger me-1"
                  data-action="cancel" data-id="${tokenNum}">
            Cancel
          </button>
          <button class="btn btn-sm btn-outline-primary"
                  data-action="set-next" data-id="${tokenNum}">
            Set Next
          </button>
        </td>
      `;
      rows.push(row);
    });

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="text-muted">No tokens yet.</td></tr>
      `;
    } else {
      rows.forEach((r) => tbody.appendChild(r));
    }

    if (totalEl) totalEl.textContent = String(total);
    if (emergEl) emergEl.textContent = String(emergency);
    if (pendingEl) pendingEl.textContent = String(pending);
    if (inHospEl) inHospEl.textContent = String(inHospitalCount);

    // Next token: waiting, emergency first, then smallest tokenNum
    let nextTokenNumber = "-";
    const waitingTokens = currentTokens.filter(({ data }) => {
      const s = (data.status || "waiting").toLowerCase();
      return (
        s === "waiting" ||
        s === "requested" ||
        s === "pending"
      );
    });
    if (waitingTokens.length > 0) {
      waitingTokens.sort((a, b) => {
        const aType = (a.data.type || "normal").toLowerCase();
        const bType = (b.data.type || "normal").toLowerCase();
        const aEmerg = aType === "emergency" ? 0 : 1;
        const bEmerg = bType === "emergency" ? 0 : 1;
        if (aEmerg !== bEmerg) return aEmerg - bEmerg;

        const aNum = a.data.tokenNum || 999999;
        const bNum = b.data.tokenNum || 999999;
        return aNum - bNum;
      });
      nextTokenNumber =
        waitingTokens[0].data.tokenNum || waitingTokens[0].key;
    }

    if (nextTokenEl) nextTokenEl.textContent = nextTokenNumber;

    let avg = 0;
    if (waitingCount > 0) {
      avg = Math.round(totalMinutes / waitingCount);
    }
    if (avgTimeEl) avgTimeEl.textContent = `${avg}m`;

    const hospitalIdSummary =
      localStorage.getItem("hospitalId") || "UH-HOS-00000";

    if (window.uhDbRef && window.uhDbUpdate && hospitalIdSummary) {
      const summaryRef = uhDbRef(
        `Hospitals/${hospitalIdSummary}/tokensSummary`
      );
      uhDbUpdate(summaryRef, {
        total,
        emergency,
        pending,
        inHospital: inHospitalCount,
        nextToken: nextTokenNumber,
        avgTimeMinutes: avg,
      });
    }

    if (typeof addAuditEntry === "function") {
      addAuditEntry(
        "TOKENS_UPDATED",
        `Next ${nextTokenNumber}, pending ${pending}, avg ${avg} min`
      );
    }
  }

  uhDbOnValue(ref, (snap) => {
    currentTokens = [];

    const val = snap.val() || {};
    Object.entries(val).forEach(([key, data]) => {
      currentTokens.push({ key, data });
    });

    currentTokens.sort((a, b) => {
      const ta = a.data.updatedAt || 0;
      const tb = b.data.updatedAt || 0;
      return tb - ta;
    });

    renderTable();
  });

  if (filterSelect) {
    filterSelect.addEventListener("change", renderTable);
  }

  function updateTokenStatus(tokenId, status) {
    const hospitalIdLocal =
      localStorage.getItem("hospitalId") || "UH-HOS-00000";
    if (!window.uhDbRef || !window.uhDbUpdate) return;

    const match = currentTokens.find(
      ({ key, data }) =>
        String(data.tokenNum || key) === String(tokenId)
    );
    if (!match) return;

    const tokenRef = uhDbRef(
      `Hospitals/${hospitalIdLocal}/tokens/${todayKey}/${match.key}`
    );
    uhDbUpdate(tokenRef, {
      status: status.toLowerCase(),
      updatedAt: Date.now(),
    });

    if (typeof addAuditEntry === "function") {
      addAuditEntry(
        "TOKEN_STATUS_UPDATED",
        `Token ${tokenId} status -> ${status}`
      );
    }
  }

  function setNextToken(tokenId) {
    const hospitalIdLocal =
      localStorage.getItem("hospitalId") || "UH-HOS-00000";
    if (!window.uhDbRef || !window.uhDbUpdate) return;

    updateTokenStatus(tokenId, "waiting");

    const summaryRef = uhDbRef(
      `Hospitals/${hospitalIdLocal}/tokensSummary`
    );
    uhDbUpdate(summaryRef, { nextToken: tokenId });

    if (typeof addAuditEntry === "function") {
      addAuditEntry(
        "TOKEN_NEXT_SET",
        `Admin set next token to ${tokenId}`
      );
    }
  }

  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const tokenId = btn.getAttribute("data-id");
      if (!tokenId) return;

      if (action === "approve") {
        updateTokenStatus(tokenId, "approved");
      } else if (action === "complete") {
        updateTokenStatus(tokenId, "completed");
      } else if (action === "cancel") {
        updateTokenStatus(tokenId, "cancelled");
      } else if (action === "set-next") {
        setNextToken(tokenId);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initTokensPage);
