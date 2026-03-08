// hospital-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  const hospitalId = localStorage.getItem('hospitalId') || '0000';
  const db = firebase.database();

  // ---------- DOCTORS: on duty / off duty ----------

  const docOnEl = document.getElementById('dashDoctorsOn');
  const docAiEl = document.getElementById('dashDoctorsAi');

  db.ref(`Hospitals/${hospitalId}/doctors`).on('value', (snap) => {
    let onDuty = 0;
    let offDuty = 0;

    snap.forEach((child) => {
      const d = child.val() || {};

      // unified with doctors page
      const isOn =
        d.dutyStatus === 'ON_DUTY' ||
        d.onDuty === true ||
        d.status === 'on_duty';

      if (isOn) onDuty++;
      else offDuty++;
    });

    if (docOnEl) {
      docOnEl.textContent = `${onDuty} on / ${offDuty} off`;
    }

    if (docAiEl) {
      let msg;
      if (onDuty === 0) {
        msg = 'AI: No doctors on duty, critical.';
      } else if (offDuty > onDuty) {
        msg = 'AI: Coverage thin, consider calling backup.';
      } else {
        msg = 'AI: Coverage OK for current load.';
      }
      docAiEl.textContent = msg;
    }

    if (typeof addAuditEntry === 'function') {
      const total = onDuty + offDuty;
      addAuditEntry(
        'dashboard-doctors-refresh',
        `Dashboard doctors: ${onDuty} on / ${offDuty} off (total ${total})`
      );
    }
  });

  // ---------- BEDS: available / limited / full ----------

  const bedsEl = document.getElementById('dashBeds');
  const bedsAiEl = document.getElementById('dashBedsAi');

  db.ref(`Hospitals/${hospitalId}/beds`).on('value', (snap) => {
    let available = 0;
    let limited = 0;
    let full = 0;

    snap.forEach((child) => {
      const w = child.val() || {};
      const status = w.bedStatus || 'available';
      if (status === 'available') available++;
      else if (status === 'limited') limited++;
      else if (status === 'full') full++;
    });

    if (bedsEl) {
      bedsEl.textContent =
        `Wards: ${available} available · ${limited} limited · ${full} full`;
    }

    if (bedsAiEl) {
      let msg;
      if (full > 0 && full >= available) {
        msg = 'AI: High bed saturation. Consider diversion.';
      } else if (limited > available) {
        msg = 'AI: Beds getting tight. Prepare surge plan.';
      } else {
        msg = 'AI: Capacity sufficient for now.';
      }
      bedsAiEl.textContent = msg;
    }

    if (typeof addAuditEntry === 'function') {
      addAuditEntry(
        'dashboard-beds-refresh',
        `Dashboard beds: ${available} available, ${limited} limited, ${full} full`
      );
    }
  });

  // ---------- ICU SUMMARY: units / beds ----------

  const icuEl = document.getElementById('dashIcu');
  const icuAiEl = document.getElementById('dashIcuAi');

  db.ref(`Hospitals/${hospitalId}/icuSummary`).on('value', (snap) => {
    const data = snap.val() || {};
    const total = data.totalBeds || 0;
    const occ = data.occupiedBeds || 0;
    const status = data.status || 'available';

    if (icuEl) {
      icuEl.textContent = `${occ} / ${total} beds occupied`;
    }

    if (icuAiEl) {
      let msg;
      if (status === 'full') {
        msg = 'AI: ICU full. Divert critical patients.';
      } else if (status === 'limited') {
        msg =
          'AI: ICU close to capacity. Keep elective ICU cases on hold.';
      } else {
        msg = 'AI: ICU load within safe range.';
      }
      icuAiEl.textContent = msg;
    }

    if (typeof addAuditEntry === 'function') {
      addAuditEntry(
        'dashboard-icu-refresh',
        `Dashboard ICU: ${occ}/${total} beds, status ${status}`
      );
    }
  });

  // ---------- TOKENS + AVERAGE WAITING TIME ----------

  const tokTotalsEl = document.getElementById('dashTokensTotals');
  const tokQueueEl = document.getElementById('dashTokensQueue');
  const tokAvgEl = document.getElementById('dashTokensAvg');
  const tokAiEl = document.getElementById('dashTokensAi');

  db.ref(`Hospitals/${hospitalId}/tokensSummary`).on('value', (snap) => {
    const t = snap.val() || {};
    const total = t.total || 0;
    const emergency = t.emergency || 0;
    const pending = t.pending || 0;
    const inHospital = t.inHospital || 0;
    const nextToken = t.nextToken || '-';
    const avgTime = t.avgTimeMinutes || 0;

    if (tokTotalsEl) {
      tokTotalsEl.textContent =
        `Total: ${total} · Emergency: ${emergency} · Pending: ${pending}`;
    }

    if (tokQueueEl) {
      tokQueueEl.textContent =
        `In hospital: ${inHospital} · Next token: ${nextToken}`;
    }

    if (tokAvgEl) {
      tokAvgEl.textContent = `${avgTime} min`;
    }

    if (tokAiEl) {
      let msg;
      if (avgTime >= 60) {
        msg =
          'AI: Very high waiting time. Add more doctors or slow new bookings.';
      } else if (avgTime >= 30) {
        msg = 'AI: Queue may need throttling soon.';
      } else {
        msg = 'AI: Waiting time within acceptable limits.';
      }
      tokAiEl.textContent = msg;
    }

    if (typeof addAuditEntry === 'function') {
      addAuditEntry(
        'dashboard-tokens-refresh',
        `Dashboard tokens: total ${total}, emergency ${emergency}, pending ${pending}, avg ${avgTime} min`
      );
    }
  });

  // ---------- GLOBAL EMERGENCY STATUS BANNER ----------

  const emStatusRef = db.ref(`Hospitals/${hospitalId}/emergencyStatus`);
  emStatusRef.on('value', (snap) => {
    const status = snap.val() || 'normal';
    if (window.hosSetEmergencyStatus) {
      hosSetEmergencyStatus(status);
    }
  });
});
