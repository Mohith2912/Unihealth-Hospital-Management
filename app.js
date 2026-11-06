const $ = (selector, parent = document) => parent.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  doctors: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  beds: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  queue: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  audit: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  notes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  arrowRight: '<path d="M9 18l6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  pulse: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  emergency: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  moreDots: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  discharge: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  admit: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>'
};

const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
const page = document.body.dataset.page || 'dashboard';

const labels = {
  dashboard: 'Overview',
  doctors: 'Doctors',
  beds: 'Beds & Wards',
  tokens: 'Patient Queue',
  analytics: 'Analytics',
  audit: 'Audit Logs',
  'care-notes': 'Care Notes',
  settings: 'Settings'
};

const pageIcons = {
  dashboard: 'grid',
  doctors: 'doctors',
  beds: 'beds',
  tokens: 'queue',
  analytics: 'chart',
  audit: 'audit',
  'care-notes': 'notes',
  settings: 'settings'
};

// 15 realistic tokens strictly conforming to tokens database schema
const DEFAULT_DEMO_DB = {
  hospital: {
    id: 'UH-EGH-9921',
    name: 'Easwari General Hospital',
    email: 'admin@easwarihospital.org',
    phone: '+91 78451 22655',
    address: 'Padma Residency, Renga Nagar, Elambalur Road, Chennai',
    status: 'normal',
    admin_name: 'Dr. Mohith Dharshan',
    admin_role: 'Hospital Administrator'
  },
  wards: [
    { id: 'w1', hospital_id: 'UH-EGH-9921', name: 'General Ward', type: 'general', capacity: 200, occupied: 156, version: 1 },
    { id: 'w2', hospital_id: 'UH-EGH-9921', name: 'Critical Care ICU', type: 'icu', capacity: 48, occupied: 32, version: 1 },
    { id: 'w3', hospital_id: 'UH-EGH-9921', name: 'Emergency Trauma Ward', type: 'emergency', capacity: 50, occupied: 26, version: 1 },
    { id: 'w4', hospital_id: 'UH-EGH-9921', name: 'Pediatric Care Ward', type: 'general', capacity: 50, occupied: 30, version: 1 }
  ],
  doctors: [
    { id: 'd1', hospital_id: 'UH-EGH-9921', name: 'Dr. Sarah Mitchell, MD', specialty: 'Cardiology', license: 'MCI-88421', phone: '+91 98451 22001', email: 's.mitchell@easwarihospital.org', department: 'Cardiology', room: 'OPD-301', shift_start: '08:00', shift_end: '16:00', on_duty: true, version: 1 },
    { id: 'd2', hospital_id: 'UH-EGH-9921', name: 'Dr. Arjun Mehta, MBBS, MS', specialty: 'Trauma Surgery', license: 'MCI-77319', phone: '+91 98451 22002', email: 'a.mehta@easwarihospital.org', department: 'Trauma Surgery', room: 'OT-2', shift_start: '09:00', shift_end: '17:00', on_duty: true, version: 1 },
    { id: 'd3', hospital_id: 'UH-EGH-9921', name: 'Dr. Elena Rostova, MD', specialty: 'Emergency Medicine', license: 'MCI-66104', phone: '+91 98451 22003', email: 'e.rostova@easwarihospital.org', department: 'Emergency Medicine', room: 'ER-102', shift_start: '00:00', shift_end: '08:00', on_duty: true, version: 1 },
    { id: 'd4', hospital_id: 'UH-EGH-9921', name: 'Dr. Priya Raman, MD', specialty: 'Pediatrics', license: 'MCI-99520', phone: '+91 98451 22004', email: 'p.raman@easwarihospital.org', department: 'Pediatrics', room: 'OPD-108', shift_start: '10:00', shift_end: '18:00', on_duty: true, version: 1 },
    { id: 'd5', hospital_id: 'UH-EGH-9921', name: 'Dr. David Chen, MD, DM', specialty: 'Neurosciences', license: 'MCI-44812', phone: '+91 98451 22005', email: 'd.chen@easwarihospital.org', department: 'Neurosciences', room: 'OPD-405', shift_start: '08:00', shift_end: '16:00', on_duty: false, version: 1 }
  ],
  tokens: [
    { id: 't102', hospital_id: 'UH-EGH-9921', number: 102, patient: 'Arun Kumar S. (42M)', reason: 'Acute chest discomfort & palpitations', priority: 'emergency', status: 'in_progress', doctor_id: 'd1', doctor_name: 'Dr. Sarah Mitchell, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 30*60000).toISOString(), started_at: new Date(Date.now() - 15*60000).toISOString(), completed_at: null, version: 1 },
    { id: 't103', hospital_id: 'UH-EGH-9921', number: 103, patient: 'Priya R. (28F)', reason: 'High fever, persistent headache & nausea', priority: 'urgent', status: 'waiting', doctor_id: 'd3', doctor_name: 'Dr. Elena Rostova, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 25*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't104', hospital_id: 'UH-EGH-9921', number: 104, patient: 'Vignesh M. (36M)', reason: 'Closed fracture of right radius/ulna', priority: 'routine', status: 'waiting', doctor_id: 'd2', doctor_name: 'Dr. Arjun Mehta, MBBS, MS', visit_date: '2026-11-06', created_at: new Date(Date.now() - 22*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't105', hospital_id: 'UH-EGH-9921', number: 105, patient: 'Lakshmi D. (51F)', reason: 'Hypertensive urgency (175/105 mmHg)', priority: 'urgent', status: 'waiting', doctor_id: 'd1', doctor_name: 'Dr. Sarah Mitchell, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 18*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't106', hospital_id: 'UH-EGH-9921', number: 106, patient: 'Hari Prasad K. (19M)', reason: 'Acute allergic urticaria & facial rash', priority: 'routine', status: 'waiting', doctor_id: 'd5', doctor_name: 'Dr. David Chen, MD, DM', visit_date: '2026-11-06', created_at: new Date(Date.now() - 16*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't107', hospital_id: 'UH-EGH-9921', number: 107, patient: 'Deepa N. (34F)', reason: 'Blunt abdominal trauma post-motorcycle accident', priority: 'emergency', status: 'waiting', doctor_id: 'd3', doctor_name: 'Dr. Elena Rostova, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 14*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't108', hospital_id: 'UH-EGH-9921', number: 108, patient: 'Rajesh Verma (58M)', reason: 'Sudden onset focal numbness & mild dysarthria', priority: 'urgent', status: 'waiting', doctor_id: 'd5', doctor_name: 'Dr. David Chen, MD, DM', visit_date: '2026-11-06', created_at: new Date(Date.now() - 12*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't109', hospital_id: 'UH-EGH-9921', number: 109, patient: 'Ananya Deshmukh (29F)', reason: 'Severe vertigo and otalgia', priority: 'routine', status: 'waiting', doctor_id: 'd3', doctor_name: 'Dr. Elena Rostova, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 10*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't110', hospital_id: 'UH-EGH-9921', number: 110, patient: 'Suresh Babu (63M)', reason: 'Acute pulmonary congestion & bilateral crackles', priority: 'emergency', status: 'in_progress', doctor_id: 'd1', doctor_name: 'Dr. Sarah Mitchell, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 35*60000).toISOString(), started_at: new Date(Date.now() - 20*60000).toISOString(), completed_at: null, version: 1 },
    { id: 't111', hospital_id: 'UH-EGH-9921', number: 111, patient: 'Meenakshi Sundaram (47F)', reason: 'Right iliac fossa tenderness & fever', priority: 'urgent', status: 'waiting', doctor_id: 'd2', doctor_name: 'Dr. Arjun Mehta, MBBS, MS', visit_date: '2026-11-06', created_at: new Date(Date.now() - 8*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't112', hospital_id: 'UH-EGH-9921', number: 112, patient: 'Baby Aarav (3M)', reason: 'High fever, tachypnea & intercostal retractions', priority: 'emergency', status: 'waiting', doctor_id: 'd4', doctor_name: 'Dr. Priya Raman, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 6*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't113', hospital_id: 'UH-EGH-9921', number: 113, patient: 'Vikram Patel (61M)', reason: 'Post-laparoscopic surgery review & dressing', priority: 'routine', status: 'waiting', doctor_id: 'd2', doctor_name: 'Dr. Arjun Mehta, MBBS, MS', visit_date: '2026-11-06', created_at: new Date(Date.now() - 5*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't114', hospital_id: 'UH-EGH-9921', number: 114, patient: 'Kavitha R. (38F)', reason: 'Routine antenatal evaluation (32 weeks gestation)', priority: 'routine', status: 'waiting', doctor_id: 'd4', doctor_name: 'Dr. Priya Raman, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 3*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't115', hospital_id: 'UH-EGH-9921', number: 115, patient: 'Mohammed Farhan (45M)', reason: 'Chronic pleuritic chest pain & fatigue', priority: 'urgent', status: 'waiting', doctor_id: 'd3', doctor_name: 'Dr. Elena Rostova, MD', visit_date: '2026-11-06', created_at: new Date(Date.now() - 2*60000).toISOString(), started_at: null, completed_at: null, version: 1 },
    { id: 't116', hospital_id: 'UH-EGH-9921', number: 116, patient: 'Sandhya Nair (52F)', reason: 'Acute painful red eye with reduced visual acuity', priority: 'routine', status: 'waiting', doctor_id: 'd5', doctor_name: 'Dr. David Chen, MD, DM', visit_date: '2026-11-06', created_at: new Date().toISOString(), started_at: null, completed_at: null, version: 1 }
  ],
  audit: [
    { id: 4, hospital_id: 'UH-EGH-9921', actor: 'Dr. Sarah Mitchell, MD', action: 'tokens.status_changed', details: 'Token #102: Consultation started in OPD-301', created_at: new Date(Date.now() - 15*60000).toISOString() },
    { id: 3, hospital_id: 'UH-EGH-9921', actor: 'Dr. Mohith Dharshan', action: 'wards.updated', details: 'Bed #ICU-12 assigned to Patient P-4487', created_at: new Date(Date.now() - 25*60000).toISOString() },
    { id: 2, hospital_id: 'UH-EGH-9921', actor: 'Triage Desk', action: 'tokens.created', details: 'Emergency Token #107 issued for Deepa N. (34F)', created_at: new Date(Date.now() - 40*60000).toISOString() },
    { id: 1, hospital_id: 'UH-EGH-9921', actor: 'Dr. Mohith Dharshan', action: 'account.login', details: 'Administrator workspace session established', created_at: new Date(Date.now() - 120*60000).toISOString() }
  ]
};

const state = {
  hospital: null,
  summary: null,
  wards: [],
  doctors: [],
  tokens: [],
  audit: [],
  filterPriority: 'all',
  filterStatus: 'all',
  searchQuery: ''
};

let theme = localStorage.getItem('uh-hospital-theme') || 'light';
document.documentElement.dataset.theme = theme;
function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('uh-hospital-theme', theme);
}

function parseDate(v) { return new Date(String(v).replace(' ', 'T') + (String(v).includes('Z') ? '' : 'Z')); }
function date(v, full = true) {
  return v ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...(full ? { day: 'numeric', month: 'short' } : {}), hour: '2-digit', minute: '2-digit' }).format(parseDate(v)) : '—';
}
function timeAgo(dateString) {
  const sec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  return `${hr} hr ago`;
}

function getDemoDb() {
  try {
    const raw = localStorage.getItem('uh_demo_db');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem('uh_demo_db', JSON.stringify(DEFAULT_DEMO_DB));
  return JSON.parse(JSON.stringify(DEFAULT_DEMO_DB));
}
function saveDemoDb(db) {
  try { localStorage.setItem('uh_demo_db', JSON.stringify(db)); } catch (e) {}
}

// Synchronized cross-origin transport
const statusChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('unihealth_status') : null;
if (statusChannel) {
  statusChannel.onmessage = e => {
    if (e.data && e.data.status) applyHospitalStatusLocally(e.data.status);
  };
}

function applyHospitalStatusLocally(status) {
  if (state.hospital) state.hospital.status = status;
  document.documentElement.dataset.hospitalStatus = status;
  document.body.dataset.hospitalStatus = status;
  try { localStorage.setItem('uh_hospital_status', status); } catch (e) {}

  const badge = $('#ref-current-status-badge');
  if (badge) {
    const label = status === 'emergency' ? 'Emergency' : status === 'busy' ? 'Surge' : 'Normal';
    badge.textContent = `${label} ⌵`;
  }
  document.querySelectorAll('.ref-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === status);
  });
}

async function setHospitalStatus(status) {
  applyHospitalStatusLocally(status);
  if (statusChannel) statusChannel.postMessage({ status });
  try {
    await fetch('http://localhost:5002/api/hospital/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  } catch (e) {}
  try {
    await api('/hospital/status', { method: 'PATCH', body: { status } });
  } catch (e) {}
}

async function mockApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const db = getDemoDb();
  const body = options.body || {};

  if (path === '/me') return { hospital: db.hospital };
  if (path === '/summary') {
    const capacity = db.wards.reduce((s, w) => s + Number(w.capacity || 0), 0);
    const occupied = db.wards.reduce((s, w) => s + Number(w.occupied || 0), 0);
    const icu_capacity = db.wards.filter(w => w.type === 'icu').reduce((s, w) => s + Number(w.capacity || 0), 0);
    const icu_occupied = db.wards.filter(w => w.type === 'icu').reduce((s, w) => s + Number(w.occupied || 0), 0);
    const totalDocs = db.doctors.length;
    const onDutyDocs = db.doctors.filter(d => d.on_duty).length;
    const waiting = db.tokens.filter(t => t.status === 'waiting').length;
    const in_progress = db.tokens.filter(t => t.status === 'in_progress').length;
    const completed_today = db.tokens.filter(t => t.status === 'completed').length;
    const emergencies = db.tokens.filter(t => t.priority === 'emergency' && (t.status === 'waiting' || t.status === 'in_progress')).length;
    return {
      beds: { capacity, occupied, icu_capacity, icu_occupied },
      doctors: { total: totalDocs, on_duty: onDutyDocs },
      queue: { waiting, in_progress, completed_today, emergencies, average_wait: 12 },
      recent: db.audit.slice(0, 5),
      status: db.hospital.status || 'normal'
    };
  }
  if (path === '/tokens') {
    if (method === 'GET') return { items: db.tokens };
    if (method === 'POST') {
      const maxNum = db.tokens.reduce((m, t) => Math.max(m, t.number || 100), 100);
      const doc = db.doctors.find(d => d.id === body.doctor_id);
      const newToken = {
        id: 't' + Date.now(),
        hospital_id: db.hospital.id,
        number: maxNum + 1,
        patient: body.patient,
        reason: body.reason,
        priority: body.priority || 'routine',
        status: 'waiting',
        doctor_id: body.doctor_id || null,
        doctor_name: doc ? doc.name : null,
        visit_date: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        version: 1
      };
      db.tokens.unshift(newToken);
      db.audit.unshift({
        id: Date.now(),
        hospital_id: db.hospital.id,
        actor: 'Dr. Mohith Dharshan',
        action: 'tokens.created',
        details: `Token #${newToken.number} issued for ${newToken.patient}`,
        created_at: new Date().toISOString()
      });
      saveDemoDb(db);
      return { ok: true, id: newToken.id };
    }
  }
  if (path.startsWith('/tokens/')) {
    const id = path.split('/')[2];
    if (method === 'PATCH') {
      const idx = db.tokens.findIndex(t => t.id === id);
      if (idx !== -1) {
        const oldStatus = db.tokens[idx].status;
        db.tokens[idx].status = body.status;
        if (body.status === 'in_progress' && !db.tokens[idx].started_at) db.tokens[idx].started_at = new Date().toISOString();
        if (body.status === 'completed' || body.status === 'cancelled') db.tokens[idx].completed_at = new Date().toISOString();
        db.tokens[idx].version = (db.tokens[idx].version || 1) + 1;
        db.audit.unshift({
          id: Date.now(),
          hospital_id: db.hospital.id,
          actor: 'Dr. Mohith Dharshan',
          action: 'tokens.status_changed',
          details: `Token #${db.tokens[idx].number}: ${oldStatus} → ${body.status}`,
          created_at: new Date().toISOString()
        });
        saveDemoDb(db);
      }
      return { ok: true };
    }
  }
  if (path === '/wards') return { items: db.wards };
  if (path.startsWith('/wards/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const idx = db.wards.findIndex(w => w.id === id);
      if (idx !== -1) {
        db.wards[idx] = { ...db.wards[idx], ...body, version: (db.wards[idx].version || 1) + 1 };
        db.audit.unshift({ id: Date.now(), hospital_id: db.hospital.id, actor: 'Dr. Mohith Dharshan', action: 'wards.updated', details: `Ward ${db.wards[idx].name} updated`, created_at: new Date().toISOString() });
        saveDemoDb(db);
      }
      return { ok: true };
    }
  }
  if (path === '/doctors') return { items: db.doctors };
  if (path === '/hospital/status') {
    db.hospital.status = body.status || 'normal';
    db.audit.unshift({ id: Date.now(), hospital_id: db.hospital.id, actor: 'Dr. Mohith Dharshan', action: 'hospital.status_changed', details: `Status set to ${body.status}`, created_at: new Date().toISOString() });
    saveDemoDb(db);
    return { ok: true };
  }
  if (path.startsWith('/audit')) return { items: db.audit, total: db.audit.length, page: 1, pageSize: 30 };
  return { ok: true };
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch('/api' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });
  } catch {
    return mockApi(path, options);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json') || response.status === 404) {
    return mockApi(path, options);
  }
  try {
    return await response.json();
  } catch {
    return mockApi(path, options);
  }
}

async function loadData() {
  const [meData, sumData, wardsData, docsData, tokensData] = await Promise.all([
    api('/me'),
    api('/summary'),
    api('/wards'),
    api('/doctors'),
    api('/tokens')
  ]);
  state.hospital = meData.hospital;
  state.summary = sumData;
  state.wards = wardsData.items || [];
  state.doctors = docsData.items || [];
  state.tokens = tokensData.items || [];
}

function promptEmergencyConfirm() {
  const dialog = $('#editor');
  dialog.innerHTML = `
    <form id="emergency-confirm-form" class="emergency-confirm-dialog">
      <div class="dialog-header" style="border-bottom: 2px solid var(--danger); padding: 18px 24px;">
        <div>
          <span class="eyebrow" style="color:var(--danger);">CRITICAL CLINICAL ACTION</span>
          <h2 id="dialog-title" style="color:var(--danger); display:flex; align-items:center; gap:8px;">
            ${icon('emergency')} Activate Code Red Emergency Protocol?
          </h2>
        </div>
        <button type="button" class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button>
      </div>
      <div style="padding: 18px 24px; color: var(--text-secondary); line-height: 1.6; font-size: 14px;">
        <p style="margin-bottom: 12px;">This will switch Easwari General Hospital into <strong>Emergency Code Red</strong>:</p>
        <ul style="margin: 0 0 16px 20px; padding: 0;">
          <li>All trauma resuscitation bays prioritize critical arrivals.</li>
          <li>ICU and Critical Care surge beds locked for incoming patients.</li>
          <li>Broadcasted live to <strong>Pharmacy Portal (5001)</strong> and <strong>Patient Companion (5003)</strong>.</li>
        </ul>
      </div>
      <div class="dialog-footer" style="padding: 16px 24px;">
        <span></span>
        <div style="display:flex; gap:10px;">
          <button type="button" class="secondary" data-action="close-dialog">Cancel</button>
          <button type="submit" class="danger">${icon('emergency')} Confirm Code Red Activation</button>
        </div>
      </div>
    </form>
  `;
  dialog.showModal();
  $('#emergency-confirm-form').addEventListener('submit', async event => {
    event.preventDefault();
    dialog.close();
    await setHospitalStatus('emergency');
    await refresh();
  });
}

function promptIcuReserveModal() {
  const dialog = $('#editor');
  dialog.innerHTML = `
    <form id="icu-reserve-form">
      <div class="dialog-header" style="padding: 18px 24px; border-bottom: 1px solid var(--ref-card-border);">
        <div>
          <span class="eyebrow" style="color:#00a896;">CRITICAL CARE ADMISSION</span>
          <h2 id="dialog-title">ICU & Critical Care · Rapid Bed Allocation</h2>
        </div>
        <button type="button" class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button>
      </div>
      <div class="form-grid" style="padding: 20px 24px;">
        <label class="field"><span>Emergency Patient Name</span><input name="patient" required placeholder="e.g. Critical Trauma Patient (45M)"/></label>
        <label class="field"><span>Target Bed Bay</span>
          <select name="bed_select">
            <option>Bed #ICU-13 (Ventilator Pre-Connected)</option>
            <option>Bed #ICU-14 (ECG Telemetry)</option>
            <option>Bed #ICU-15 (Isolation Bay)</option>
          </select>
        </label>
        <label class="field full-span"><span>Clinical Indication</span>
          <select name="indication">
            <option>Acute Coronary Syndrome / STEMI</option>
            <option>Severe Polytrauma & Resuscitation</option>
            <option>Acute Respiratory Distress (Ventilator)</option>
            <option>Acute Stroke / Neurocritical Care</option>
          </select>
        </label>
      </div>
      <div class="dialog-footer" style="padding: 16px 24px;">
        <span class="muted" style="font-size:12px;">${icon('shield')} Connects to live ICU ward telemetry</span>
        <div style="display:flex; gap:10px;">
          <button type="button" class="secondary" data-action="close-dialog">Cancel</button>
          <button type="submit" class="primary" style="background:#00a896;">Confirm Allocation</button>
        </div>
      </div>
    </form>
  `;
  dialog.showModal();
  $('#icu-reserve-form').addEventListener('submit', async event => {
    event.preventDefault();
    const icu = state.wards.find(w => w.type === 'icu');
    if (icu && icu.occupied < icu.capacity) {
      await api(`/wards/${icu.id}`, { method: 'PUT', body: { ...icu, occupied: icu.occupied + 1 } });
    }
    dialog.close();
    await refresh();
    notice('ICU Bed Allocation confirmed.');
  });
}

function promptTicketAction(tokenId) {
  const t = state.tokens.find(item => item.id === tokenId);
  if (!t) return;
  const dialog = $('#editor');
  dialog.innerHTML = `
    <div style="padding: 24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0; font-size:18px;">Token #${t.number} · ${escape(t.patient)}</h3>
        <button type="button" class="icon-button" data-action="close-dialog">${icon('close')}</button>
      </div>
      <p style="color:var(--ref-text-muted); font-size:13px; margin-bottom:20px;">
        Reason: <strong>${escape(t.reason)}</strong><br/>
        Priority: <strong style="text-transform:capitalize;">${t.priority}</strong> · Specialist: <strong>${escape(t.doctor_name || 'Unassigned')}</strong> · Status: <strong>${t.status}</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${t.status === 'waiting' ? `<button class="primary" data-action="token-start" data-id="${t.id}" style="background:#00a896;">Start Consultation</button>` : ''}
        ${t.status === 'in_progress' ? `<button class="primary" data-action="token-complete" data-id="${t.id}" style="background:#00a896;">Complete Consultation & Discharge</button>` : ''}
        ${['waiting','in_progress'].includes(t.status) ? `<button class="secondary danger-text" data-action="token-cancel" data-id="${t.id}">Cancel Token</button>` : ''}
      </div>
    </div>
  `;
  dialog.showModal();
}

function notice(msg) {
  const alertBox = $('#notice');
  if (!alertBox) return;
  alertBox.textContent = msg;
  alertBox.className = 'notice';
  alertBox.hidden = false;
  setTimeout(() => { alertBox.hidden = true; }, 3500);
}

function renderDashboard() {
  const h = state.hospital;
  const b = state.summary.beds;
  const d = state.summary.doctors;
  const q = state.summary.queue;
  const recent = state.summary.recent || [];

  const icuPercent = b.icu_capacity ? Math.round((b.icu_occupied / b.icu_capacity) * 100) : 0;
  const totalOccupancyPercent = b.capacity ? Math.round((b.occupied / b.capacity) * 100) : 0;
  const donutOffset = 238.76 - (238.76 * totalOccupancyPercent) / 100;

  // Filter dynamic tokens
  const qSearch = state.searchQuery.toLowerCase();
  const filteredTokens = state.tokens.filter(t => {
    const matchPriority = state.filterPriority === 'all' || t.priority === state.filterPriority;
    const matchStatus = state.filterStatus === 'all' || t.status === state.filterStatus;
    const matchSearch = !qSearch || (
      String(t.number).includes(qSearch) ||
      t.patient.toLowerCase().includes(qSearch) ||
      (t.doctor_name && t.doctor_name.toLowerCase().includes(qSearch)) ||
      t.priority.toLowerCase().includes(qSearch) ||
      t.reason.toLowerCase().includes(qSearch)
    );
    return matchPriority && matchStatus && matchSearch;
  });

  return `
    <!-- Top Greeting Area -->
    <section class="ref-welcome-card">
      <div class="ref-welcome-left">
        <h1 class="ref-welcome-title">👋 Good Afternoon, Dr. Mohith</h1>
        <p class="ref-welcome-sub">Here's what's happening at Easwari General Hospital today.</p>
      </div>
      <div class="ref-welcome-right">
        <div class="ref-welcome-hospital-meta">
          <div class="ref-welcome-hospital-name">${escape(h.name)}</div>
          <div class="ref-welcome-hospital-loc">📍 ${escape(h.address)}</div>
        </div>
        <div class="ref-welcome-hospital-thumb">
          <img src="/assets/hospital-welcome-facility.svg" alt="Easwari General Hospital Facade" />
        </div>
      </div>
    </section>

    <!-- Operational Mode Strip -->
    <section class="ref-mode-strip">
      <div class="ref-mode-left">
        <div class="ref-pulse-box">
          ${icon('pulse')}
        </div>
        <span class="ref-mode-label">Operational Mode:</span>
        <span class="ref-mode-badge-dropdown" id="ref-current-status-badge">${h.status === 'emergency' ? 'Emergency' : h.status === 'busy' ? 'Surge' : 'Normal'} ⌵</span>
      </div>

      <!-- Segmented Button Controls -->
      <div class="ref-mode-switch-group" role="radiogroup" aria-label="Hospital operational mode">
        <button type="button" class="ref-mode-btn normal ${h.status === 'normal' ? 'active' : ''}" data-mode="normal">
          Normal
        </button>
        <button type="button" class="ref-mode-btn surge ${h.status === 'busy' ? 'active' : ''}" data-mode="busy">
          ⚠️ Surge
        </button>
        <button type="button" class="ref-mode-btn emergency ${h.status === 'emergency' ? 'active' : ''}" data-mode="emergency">
          🚨 Emergency
        </button>
      </div>

      <div class="ref-mode-right">
        <div class="ref-sys-status-text">
          <span class="ref-sys-status-title">
            <span class="ref-sys-status-dot"></span> All systems operational
          </span>
          <span class="ref-sys-status-updated">Hospital Time: ${date(new Date().toISOString(), true)}</span>
        </div>
        <button type="button" class="ref-refresh-icon-btn" data-action="refresh" title="Refresh metrics">
          ${icon('refresh')}
        </button>
      </div>
    </section>

    <!-- Four KPI Cards Grid (Computed from actual data) -->
    <section class="ref-kpi-grid">
      <!-- Total Beds -->
      <article class="ref-kpi-card">
        <div class="ref-kpi-icon-box beds">${icon('beds')}</div>
        <div class="ref-kpi-content">
          <span class="ref-kpi-title">Total Beds</span>
          <span class="ref-kpi-number">${b.capacity}</span>
          <span class="ref-kpi-sub positive">↑ ${b.capacity - b.occupied} available</span>
        </div>
      </article>

      <!-- ICU Beds -->
      <article class="ref-kpi-card">
        <div class="ref-kpi-icon-box icu">${icon('heart')}</div>
        <div class="ref-kpi-content">
          <span class="ref-kpi-title">ICU Beds</span>
          <span class="ref-kpi-number">${b.icu_occupied} / ${b.icu_capacity}</span>
          <span class="ref-kpi-sub">${icuPercent}% occupied</span>
        </div>
      </article>

      <!-- Doctors On Duty -->
      <article class="ref-kpi-card">
        <div class="ref-kpi-icon-box doctors">${icon('user')}</div>
        <div class="ref-kpi-content">
          <span class="ref-kpi-title">Doctors On Duty</span>
          <span class="ref-kpi-number">${d.on_duty}</span>
          <span class="ref-kpi-sub positive">of ${d.total} on duty</span>
        </div>
      </article>

      <!-- OPD Queue -->
      <article class="ref-kpi-card">
        <div class="ref-kpi-icon-box queue">${icon('queue')}</div>
        <div class="ref-kpi-content">
          <span class="ref-kpi-title">OPD Queue</span>
          <span class="ref-kpi-number">${q.waiting}</span>
          <span class="ref-kpi-sub">~ ${q.average_wait} min avg. wait</span>
        </div>
      </article>
    </section>

    <!-- Three-Panel Middle Row -->
    <section class="ref-mid-row-grid">
      <!-- Ward Occupancy -->
      <article class="ref-card-panel">
        <div class="ref-panel-header">
          <div class="ref-panel-header-left">
            <span class="ref-panel-icon">${icon('beds')}</span>
            <div class="ref-panel-title-wrap">
              <h3>Ward Occupancy</h3>
              <p>Overall Bed Utilization</p>
            </div>
          </div>
          <a href="/hospital-beds.html" class="ref-panel-link">View Wards ➔</a>
        </div>

        <div class="ref-ward-occ-body">
          <div class="ref-ward-donut-wrap">
            <svg class="ref-ward-donut-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#e6eff2" stroke-width="12" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#00a896" stroke-width="12"
                      stroke-dasharray="238.76" stroke-dashoffset="${donutOffset}" stroke-linecap="round" />
            </svg>
            <div class="ref-donut-center">
              <span class="ref-donut-pct">${totalOccupancyPercent}%</span>
              <span class="ref-donut-lbl">Occupied</span>
            </div>
          </div>

          <!-- Real Ward Bars from Database -->
          <div class="ref-ward-bars-list">
            ${state.wards.map(w => {
              const pct = w.capacity ? Math.round((w.occupied / w.capacity) * 100) : 0;
              return `
                <div class="ref-ward-bar-item">
                  <div class="ref-ward-bar-meta">
                    <span class="ref-ward-name-dot">
                      <span class="ref-ward-dot"></span>
                      ${escape(w.name)}
                    </span>
                    <span class="ref-ward-count">${w.occupied} / ${w.capacity}</span>
                  </div>
                  <div class="ref-ward-prog-track">
                    <div class="ref-ward-prog-fill" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </article>

      <!-- Recent Activity (Computed from actual audit logs) -->
      <article class="ref-card-panel">
        <div class="ref-panel-header">
          <div class="ref-panel-header-left">
            <span class="ref-panel-icon">${icon('clock')}</span>
            <div class="ref-panel-title-wrap">
              <h3>Recent Activity</h3>
              <p>Live Updates</p>
            </div>
          </div>
          <a href="/hospital-audit.html" class="ref-panel-link">View All ➔</a>
        </div>

        <div class="ref-activity-list">
          ${recent.slice(0, 4).map(a => `
            <div class="ref-activity-item">
              <div class="ref-activity-item-left">
                <div class="ref-act-icon-dot ${a.action.includes('token') ? 'purple' : a.action.includes('ward') ? 'cyan' : 'green'}">
                  ${a.action.includes('ward') ? icon('beds') : a.action.includes('token') ? icon('user') : icon('shield')}
                </div>
                <span class="ref-act-desc">${escape(a.details)}</span>
              </div>
              <span class="ref-act-time">${timeAgo(a.created_at)}</span>
            </div>
          `).join('')}
        </div>
      </article>

      <!-- Today's Summary (Computed from actual records) -->
      <article class="ref-card-panel">
        <div class="ref-panel-header">
          <div class="ref-panel-header-left">
            <span class="ref-panel-icon">${icon('cal')}</span>
            <div class="ref-panel-title-wrap">
              <h3>Today's Summary</h3>
              <p>${date(new Date().toISOString(), true).slice(0, 11)}</p>
            </div>
          </div>
        </div>

        <div class="ref-summary-list">
          <div class="ref-summary-row">
            <div class="ref-summary-row-left">
              <span style="color:#16a34a;">${icon('admit')}</span>
              <span>Total Tokens</span>
            </div>
            <strong class="ref-summary-val">${String(state.tokens.length).padStart(2, '0')}</strong>
          </div>
          <div class="ref-summary-row">
            <div class="ref-summary-row-left">
              <span style="color:#0284c7;">${icon('discharge')}</span>
              <span>Discharged Today</span>
            </div>
            <strong class="ref-summary-val">${String(q.completed_today).padStart(2, '0')}</strong>
          </div>
          <div class="ref-summary-row">
            <div class="ref-summary-row-left">
              <span style="color:#dc2626;">${icon('scissors')}</span>
              <span>Active Consultations</span>
            </div>
            <strong class="ref-summary-val">${String(q.in_progress).padStart(2, '0')}</strong>
          </div>
          <div class="ref-summary-row">
            <div class="ref-summary-row-left">
              <span style="color:#ea580c;">${icon('emergency')}</span>
              <span>Emergency Cases</span>
            </div>
            <strong class="ref-summary-val">${String(q.emergencies).padStart(2, '0')}</strong>
          </div>
        </div>
      </article>
    </section>

    <!-- Bottom Row: OPD Triage Queue Table & ICU Feature Card -->
    <section class="ref-bottom-row-grid">
      <!-- Left: Real OPD Triage Queue Table with 15 dynamic tickets -->
      <article class="ref-opd-panel">
        <div class="ref-panel-header">
          <div class="ref-panel-header-left">
            <span class="ref-panel-icon">${icon('queue')}</span>
            <div class="ref-panel-title-wrap">
              <h3>OPD Triage Queue</h3>
              <p>Live patient queue and consultation status (${filteredTokens.length} active tickets)</p>
            </div>
          </div>
          <div class="ref-opd-header-filters">
            <select class="ref-select-pill" id="ref-filter-priority" aria-label="Filter priority">
              <option value="all" ${state.filterPriority === 'all' ? 'selected' : ''}>All Priority ⌵</option>
              <option value="emergency" ${state.filterPriority === 'emergency' ? 'selected' : ''}>Emergency</option>
              <option value="urgent" ${state.filterPriority === 'urgent' ? 'selected' : ''}>Urgent</option>
              <option value="routine" ${state.filterPriority === 'routine' ? 'selected' : ''}>Routine</option>
            </select>
            <select class="ref-select-pill" id="ref-filter-status" aria-label="Filter status">
              <option value="all" ${state.filterStatus === 'all' ? 'selected' : ''}>All Status ⌵</option>
              <option value="waiting" ${state.filterStatus === 'waiting' ? 'selected' : ''}>Waiting</option>
              <option value="in_progress" ${state.filterStatus === 'in_progress' ? 'selected' : ''}>In Consultation</option>
              <option value="completed" ${state.filterStatus === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${state.filterStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        <div class="ref-table-wrap">
          <table class="ref-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Name</th>
                <th>Reason</th>
                <th>Priority</th>
                <th>Specialist</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTokens.map(t => `
                <tr>
                  <td class="ref-token-id">#${t.number}</td>
                  <td>
                    <div class="ref-patient-cell">
                      <div class="ref-patient-icon">${icon('user')}</div>
                      <span>${escape(t.patient)}</span>
                    </div>
                  </td>
                  <td><span style="font-size:12px;color:var(--ref-text-muted);">${escape(t.reason)}</span></td>
                  <td>
                    <span class="ref-priority-pill ${t.priority}">
                      ${t.priority === 'emergency' ? 'Emergency' : t.priority === 'urgent' ? 'Urgent' : 'Routine'}
                    </span>
                  </td>
                  <td>${escape(t.doctor_name || 'Unassigned')}</td>
                  <td>
                    <div class="ref-status-cell ${t.status === 'in_progress' ? 'consultation' : t.status}">
                      <span class="ref-status-dot"></span>
                      ${t.status === 'in_progress' ? 'In Consultation' : t.status === 'waiting' ? 'Waiting' : t.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </div>
                  </td>
                  <td>
                    <button type="button" class="ref-action-dots-btn" data-action="ticket-actions" data-id="${t.id}" title="Care actions">
                      ${icon('moreDots')}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </article>

      <!-- Right: ICU & Critical Care Card -->
      <article class="ref-icu-card">
        <img class="ref-icu-card-bg-img" src="/assets/icu-operating-theater.svg" alt="Surgical ICU & Critical Care" />
        <div class="ref-icu-card-overlay"></div>
        <div class="ref-icu-card-bottom">
          <div class="ref-icu-card-info">
            <div class="ref-icu-heart-icon-box">
              ${icon('shield')}
            </div>
            <div class="ref-icu-title-wrap">
              <h4>ICU & Critical Care</h4>
              <p>Real-time monitoring: ${b.icu_occupied}/${b.icu_capacity} Beds</p>
            </div>
          </div>
          <button type="button" class="ref-icu-arrow-btn" data-action="open-icu-modal" title="Reserve ICU bed">
            ${icon('arrowRight')}
          </button>
        </div>
      </article>
    </section>
  `;
}

function renderSecondaryPage(viewName) {
  if (viewName === 'doctors') {
    return `
      <div class="ref-card-panel" style="margin-top:16px;">
        <div class="ref-panel-header">
          <div class="ref-panel-header-left">
            <span class="ref-panel-icon">${icon('doctors')}</span>
            <div class="ref-panel-title-wrap">
              <h3>Doctor Duty Management</h3>
              <p>Manage care team duty shift coverage</p>
            </div>
          </div>
        </div>
        <div class="ref-table-wrap">
          <table class="ref-table">
            <thead>
              <tr><th>Doctor Name</th><th>Specialty</th><th>Department</th><th>Shift Time</th><th>Room</th><th>Duty Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${state.doctors.map(d => `
                <tr>
                  <td><strong>${escape(d.name)}</strong></td>
                  <td>${escape(d.specialty)}</td>
                  <td>${escape(d.department)}</td>
                  <td>${d.shift_start} – ${d.shift_end}</td>
                  <td>${escape(d.room)}</td>
                  <td><span class="badge ${d.on_duty ? 'in_progress' : 'off_duty'}">${d.on_duty ? 'On Duty' : 'Off Duty'}</span></td>
                  <td><button class="secondary" data-action="toggle-duty" data-id="${d.id}">${d.on_duty ? 'Set Off Duty' : 'Mark On Duty'}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  if (viewName === 'beds') {
    return `
      <div class="ref-card-panel" style="margin-top:16px;">
        <div class="ref-panel-header">
          <div class="ref-panel-header-left">
            <span class="ref-panel-icon">${icon('beds')}</span>
            <div class="ref-panel-title-wrap">
              <h3>Hospital Wards & Bed Headroom</h3>
              <p>Occupancy and capacity configuration</p>
            </div>
          </div>
        </div>
        <div class="ref-table-wrap">
          <table class="ref-table">
            <thead>
              <tr><th>Ward Name</th><th>Type</th><th>Total Capacity</th><th>Occupied</th><th>Available</th><th>Utilization</th></tr>
            </thead>
            <tbody>
              ${state.wards.map(w => {
                const pct = w.capacity ? Math.round((w.occupied / w.capacity) * 100) : 0;
                return `
                  <tr>
                    <td><strong>${escape(w.name)}</strong></td>
                    <td><span class="badge in_progress">${escape(w.type)}</span></td>
                    <td>${w.capacity} beds</td>
                    <td>${w.occupied} occupied</td>
                    <td><strong>${w.capacity - w.occupied} beds</strong></td>
                    <td><span class="badge ${pct >= 85 ? 'emergency' : pct >= 70 ? 'urgent' : 'available'}">${pct}%</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  return renderDashboard();
}

function shell() {
  const h = state.hospital;
  const currentView = page === 'dashboard' || page === 'tokens' ? renderDashboard() : renderSecondaryPage(page);

  $('#app').innerHTML = `
    <div class="workspace">
      <!-- Left Navigation Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div>
          <!-- Brand Logo & Title -->
          <div class="ref-brand-header">
            <div class="ref-brand-icon-box">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 4v16m-8-8h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>
            </div>
            <div>
              <div class="ref-brand-title">UniHealth</div>
              <div class="ref-brand-subtitle">Healthcare Ecosystem</div>
            </div>
          </div>

          <div class="ref-sidebar-section-title">Hospital Management</div>

          <!-- Nav Items -->
          <nav aria-label="Hospital Management Navigation">
            ${Object.entries(labels).map(([key, name]) => `
              <a href="/hospital-${key === 'dashboard' ? 'dashboard' : key}.html" class="${key === page ? 'active' : ''}">
                ${icon(pageIcons[key])}
                <span>${name}</span>
              </a>
            `).join('')}
          </nav>
        </div>

        <!-- Sidebar Bottom Exterior Photo -->
        <div class="ref-sidebar-image-card">
          <img src="/assets/hospital-sidebar-building.svg" alt="UniHealth Medical Center" />
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrap">
        <!-- Topbar -->
        <header class="topbar">
          <!-- Search Input with Ctrl+K -->
          <div class="ref-topbar-search">
            ${icon('search')}
            <input type="search" id="ref-global-search" placeholder="Search patient, doctor, ward, or medicine..." aria-label="Search" value="${escape(state.searchQuery)}"/>
            <kbd class="ref-search-kbd">Ctrl + K</kbd>
          </div>

          <!-- Right Controls -->
          <div class="ref-topbar-right">
            <button type="button" class="ref-topbar-icon-btn" data-action="theme" aria-label="Toggle theme">
              ${icon('sun')}
            </button>
            <button type="button" class="ref-topbar-icon-btn" data-action="notifications" aria-label="Notifications" title="Notifications">
              ${icon('bell')}
              <span class="ref-bell-badge"></span>
            </button>
            <div class="ref-user-profile">
              <div class="ref-user-avatar">
                <img src="/assets/admin-avatar.svg" alt="Dr. Mohith Dharshan" />
              </div>
              <div class="ref-user-info">
                <span class="ref-user-name">${escape(h.admin_name)}</span>
                <span class="ref-user-role">${escape(h.admin_role)}</span>
              </div>
              <span class="ref-user-chevron">⌵</span>
            </div>
          </div>
        </header>

        <main id="main" tabindex="-1">
          <div id="content">${currentView}</div>
        </main>
      </div>
    </div>

    <div id="sidebar-backdrop" class="sidebar-backdrop" data-action="close-sidebar"></div>
    <dialog id="editor" aria-labelledby="dialog-title"></dialog>
    <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
  `;

  attachEventListeners();
}

function attachEventListeners() {
  // Global search input
  $('#ref-global-search')?.addEventListener('input', e => {
    state.searchQuery = e.target.value.trim();
    $('#content').innerHTML = page === 'dashboard' || page === 'tokens' ? renderDashboard() : renderSecondaryPage(page);
    attachEventListeners();
  });

  // Operational mode buttons
  document.querySelectorAll('.ref-mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      if (mode === state.hospital.status) return;
      if (mode === 'emergency') {
        promptEmergencyConfirm();
      } else {
        await setHospitalStatus(mode);
        await refresh();
      }
    });
  });

  // Priority filter
  $('#ref-filter-priority')?.addEventListener('change', e => {
    state.filterPriority = e.target.value;
    $('#content').innerHTML = renderDashboard();
    attachEventListeners();
  });

  // Status filter
  $('#ref-filter-status')?.addEventListener('change', e => {
    state.filterStatus = e.target.value;
    $('#content').innerHTML = renderDashboard();
    attachEventListeners();
  });
}

async function refresh() {
  await loadData();
  $('#content').innerHTML = page === 'dashboard' || page === 'tokens' ? renderDashboard() : renderSecondaryPage(page);
  attachEventListeners();
}

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id } = target.dataset;

  if (action === 'theme') {
    toggleTheme();
  } else if (action === 'close-dialog') {
    $('#editor')?.close();
  } else if (action === 'open-icu-modal') {
    promptIcuReserveModal();
  } else if (action === 'ticket-actions') {
    promptTicketAction(id);
  } else if (action === 'token-start') {
    const t = state.tokens.find(item => item.id === id);
    if (t) {
      await api(`/tokens/${id}`, { method: 'PATCH', body: { status: 'in_progress', version: t.version } });
      $('#editor')?.close();
      await refresh();
      notice(`Consultation started for Token #${t.number}.`);
    }
  } else if (action === 'token-complete') {
    const t = state.tokens.find(item => item.id === id);
    if (t) {
      await api(`/tokens/${id}`, { method: 'PATCH', body: { status: 'completed', version: t.version } });
      $('#editor')?.close();
      await refresh();
      notice(`Token #${t.number} marked as completed and discharged.`);
    }
  } else if (action === 'token-cancel') {
    const t = state.tokens.find(item => item.id === id);
    if (t) {
      await api(`/tokens/${id}`, { method: 'PATCH', body: { status: 'cancelled', version: t.version } });
      $('#editor')?.close();
      await refresh();
      notice(`Token #${t.number} cancelled.`);
    }
  } else if (action === 'toggle-duty') {
    const d = state.doctors.find(item => item.id === id);
    if (d) {
      await api(`/doctors/${id}`, { method: 'PUT', body: { ...d, on_duty: !d.on_duty } });
      await refresh();
      notice(`Dr. ${d.name} marked ${!d.on_duty ? 'ON DUTY' : 'OFF DUTY'}.`);
    }
  } else if (action === 'refresh') {
    await refresh();
    notice('Live hospital records refreshed.');
  }
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
    event.preventDefault();
    $('#ref-global-search')?.focus();
  }
  if (event.key === 'Escape') {
    $('#editor')?.close();
  }
});

async function init() {
  await loadData();
  const currentStatus = localStorage.getItem('uh_hospital_status') || state.hospital.status || 'normal';
  state.hospital.status = currentStatus;
  shell();
}

init();
