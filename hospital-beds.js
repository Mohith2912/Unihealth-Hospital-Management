// hospital-beds.js

function getHospitalId() {
  return localStorage.getItem('hospitalId');
}

function handleHospitalLogout() {
  localStorage.removeItem('hospitalId');
  window.location.href = 'hospital-index.html';
}

function buildBedCard(key, ward) {
  const card = document.createElement('div');
  card.className = 'panel panel-lg bed-card';
  card.dataset.wardId = key;
  card.dataset.wardType = ward.wardType || 'general';
  card.dataset.wardName = ward.wardCode || '';

  const bedStatus = ward.bedStatus || 'available';

  function applyStatusStyle(status) {
    card.dataset.bedStatus = status;
    card.classList.remove(
      'bed-status-available',
      'bed-status-limited',
      'bed-status-full'
    );
    if (status === 'available') card.classList.add('bed-status-available');
    else if (status === 'limited') card.classList.add('bed-status-limited');
    else card.classList.add('bed-status-full');
  }

  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div>
        <div class="bed-ward-name fw-semibold">${ward.wardName || 'Ward'}</div>
        <div class="text-muted small">${(ward.wardType || 'general').toUpperCase()}</div>
      </div>
    </div>

    <div class="small mb-2">Bed:</div>
    <div class="btn-group w-100 mb-2" role="group">
      <button type="button" class="btn btn-sm btn-outline-success bed-status-btn" data-status="available">
        Available
      </button>
      <button type="button" class="btn btn-sm btn-outline-warning bed-status-btn" data-status="limited">
        Limited
      </button>
      <button type="button" class="btn btn-sm btn-outline-danger bed-status-btn" data-status="full">
        Fully occupied
      </button>
    </div>

    <div class="bed-updated small text-muted mt-1">
      Updated by
      <span data-field="updatedBy">${ward.lastUpdatedBy || 'Admin'}</span>
      ·
      <span data-field="updated">${ward.lastUpdatedAt || '--/--/---- --:--'}</span>
    </div>

    <div class="d-flex justify-content-end mt-2">
      <button class="btn btn-sm btn-primary bed-save-btn" type="button">
        Save
      </button>
    </div>
  `;

  applyStatusStyle(bedStatus);
  wireBedCardEvents(card, key, applyStatusStyle);
  return card;
}

function wireBedCardEvents(card, key, applyStatusStyle) {
  const hospitalId = getHospitalId();
  const updatedByEl = card.querySelector('[data-field="updatedBy"]');
  const updatedEl = card.querySelector('[data-field="updated"]');
  const statusButtons = card.querySelectorAll('.bed-status-btn');
  const saveBtn = card.querySelector('.bed-save-btn');

  let currentStatus = card.dataset.bedStatus || 'available';

  function markActiveButton() {
    statusButtons.forEach((btn) => {
      const s = btn.dataset.status;
      if (s === currentStatus) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  statusButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentStatus = btn.dataset.status;
      applyStatusStyle(currentStatus);
      markActiveButton();
    });
  });

  saveBtn.addEventListener('click', () => {
    const wardName = card
      .querySelector('.bed-ward-name')
      .textContent.trim();
    const wardType = card.dataset.wardType || 'general';
    const wardCode = card.dataset.wardName || '';

    const now = new Date();
    const ts =
      now.toLocaleDateString('en-IN') +
      ' ' +
      now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });

    updatedByEl.textContent = 'Admin';
    updatedEl.textContent = ts;

    const wardRef = firebase
      .database()
      .ref('Hospitals/' + hospitalId + '/beds/' + key);

    wardRef
      .update({
        wardName,
        wardCode,
        wardType,
        bedStatus: currentStatus,
        lastUpdatedBy: 'Admin',
        lastUpdatedAt: ts
      })
      .then(() => {
        if (window.addAuditEntry) {
          const readable =
            currentStatus === 'available'
              ? 'Beds available'
              : currentStatus === 'limited'
              ? 'Beds limited'
              : 'Beds fully occupied';
          addAuditEntry(
            'BEDS_STATUS_UPDATED',
            wardName + ' -> ' + readable
          );
        }

        // ICU summary update
        if (wardType === 'icu') {
          const icuRef = firebase
            .database()
            .ref('Hospitals/' + hospitalId + '/icuSummary');

          icuRef
            .update({
              totalBeds: 1,
              occupiedBeds: currentStatus === 'full' ? 1 : 0,
              status: currentStatus
            })
            .then(() => {
              if (window.addAuditEntry) {
                addAuditEntry(
                  'ICU_UPDATED',
                  wardName + ' -> status ' + currentStatus
                );
              }
            });
        }
      })
      .catch((err) => {
        alert('Failed to save: ' + err.message);
      });
  });

  markActiveButton();
}

document.addEventListener('DOMContentLoaded', function initBedManagement() {
  const hospitalId = getHospitalId();
  console.log('initBedManagement running, hospitalId =', hospitalId);

  const root = document.getElementById('bedsPageRoot');
  if (!root) {
    console.error('bedsPageRoot not found');
    return;
  }

  const bedsGrid = document.getElementById('bedsGrid');
  const sidebarTop = document.getElementById('sidebarHospitalId');
  const sidebarBottom = document.getElementById('sidebarHospitalIdBottom');
  if (sidebarTop) sidebarTop.textContent = hospitalId;
  if (sidebarBottom) sidebarBottom.textContent = hospitalId;

  const bedsRef = firebase
    .database()
    .ref('Hospitals/' + hospitalId + '/beds');

  bedsRef.on('value', (snap) => {
    bedsGrid.innerHTML = '';
    if (!snap.exists()) {
      bedsGrid.innerHTML =
        '<div class="text-muted small">No wards configured yet. Use "Add Ward" to create one.</div>';
      return;
    }

    snap.forEach((child) => {
      const key = child.key;
      const ward = child.val() || {};
      const card = buildBedCard(key, ward);
      bedsGrid.appendChild(card);
    });
  });

  // Add Ward handler
  const typeSelect = document.getElementById('addWardType');
  const codeInput = document.getElementById('addWardName');
  const addBtn = document.getElementById('addWardBtn');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const wardType = typeSelect.value || 'general';
      const wardCode = codeInput.value.trim();

      if (!wardCode) {
        alert('Please enter ward code.');
        return;
      }

      const wardName =
        wardType === 'icu'
          ? 'ICU Unit ' + wardCode
          : wardType === 'emergency'
          ? 'Emergency Ward ' + wardCode
          : 'General Ward ' + wardCode;

      const now = new Date();
      const ts =
        now.toLocaleDateString('en-IN') +
        ' ' +
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });

      const path = 'Hospitals/' + hospitalId + '/beds';
      const newRef = firebase.database().ref(path).push();

      newRef
        .set({
          wardType,
          wardCode,
          wardName,
          bedStatus: 'available',
          lastUpdatedBy: 'Admin',
          lastUpdatedAt: ts
        })
        .then(() => {
          codeInput.value = '';
          if (window.addAuditEntry) {
            addAuditEntry(
              'WARD_ADDED',
              'Added ward ' + wardName + ' (Beds available)'
            );
          }
        })
        .catch((error) => {
          console.error('Error adding ward:', error);
          alert('Failed to add ward: ' + error.message);
        });
    });
  }
});
