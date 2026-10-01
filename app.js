const $ = (selector, parent = document) => parent.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  doctors: '<path d="M8 3v5a4 4 0 0 0 8 0V3M6 3h4m4 0h4M12 12v3a5 5 0 0 0 10 0v-3"/><circle cx="21" cy="9" r="2"/>',
  beds: '<path d="M3 18V7m0 8h18v6M3 18h18M7 15V9h11a3 3 0 0 1 3 3v3M3 21v-3"/><path d="M3 9h4v6"/>',
  queue: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/>',
  chart: '<path d="M4 3v17h17M9 16V9m5 7V5m5 11v-5"/>',
  audit: '<path d="M8 4H5v17h14V4h-3M9 11h6m-6 5h6"/><rect x="8" y="2" width="8" height="5" rx="2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M18 18a8 8 0 0 1-13-3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  logout: '<path d="M9 4H4v16h5m5-13 5 5-5 5m-6-5h13"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
const brand = `<span class="brand-mark" aria-hidden="true">${icon('plus')}</span><span>UniHealth<span class="brand-sub">HOSPITAL WORKSPACE</span></span>`;
const page = document.body.dataset.page;
const labels = { dashboard: 'Overview', doctors: 'Doctors', beds: 'Beds & wards', tokens: 'Patient queue', analytics: 'Analytics', audit: 'Audit log' };
const hints = { dashboard: 'A clear view of your hospital, all in one place.', doctors: 'Manage your care team and keep duty status up to date.', beds: 'Keep an accurate picture of capacity across your hospital.', tokens: 'Coordinate arrivals, consultations, and the next step in care.', analytics: 'Understand activity using records from your hospital.', audit: 'A traceable history of changes across your workspace.' };
const pageIcons = { dashboard: 'grid', doctors: 'doctors', beds: 'beds', tokens: 'queue', analytics: 'chart', audit: 'audit' };
const state = { hospital: null, doctors: [], wards: [], tokens: [], summary: null, analytics: null, audit: null, auditPage: 1, auditQuery: '' };
let theme = localStorage.getItem('uh-hospital-theme') || 'light';
// Retire the previous browser-only identity and fabricated audit history.
for (const key of ['hospitalId', 'uhAuditEntries']) localStorage.removeItem(key);
document.documentElement.dataset.theme = theme;
function toggleTheme() { theme = theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; localStorage.setItem('uh-hospital-theme', theme); }
function parseDate(value) { return new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z')); }
function date(value, full = true) { return value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...(full ? { day: 'numeric', month: 'short' } : {}), hour: '2-digit', minute: '2-digit' }).format(parseDate(value)) : '—'; }
const label = value => String(value).replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase());
const badge = (value, content = label(value)) => `<span class="badge ${escape(value)}"><span class="dot"></span>${escape(content)}</span>`;
const empty = (title, description, action = '') => `<div class="empty">${icon(pageIcons[page] || 'grid')}<h3>${title}</h3><p>${description}</p>${action}</div>`;
const button = (text, action, className = 'primary', data = '') => `<button type="button" class="${className}" data-action="${action}" ${data}>${action.startsWith('add') ? icon('plus') : ''}${text}</button>`;
async function api(path, options = {}) {
  let response;
  try { response = await fetch('/api' + path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, ...(options.body ? { body: JSON.stringify(options.body) } : {}) }); }
  catch { throw new Error('Cannot reach the server. Check your connection and try again.'); }
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && page !== 'auth') location.replace('/index.html');
    const error = new Error(data.error || 'Something went wrong. Please try again.'); error.fields = data.fields; throw error;
  }
  return data;
}
function notice(message, error = false) {
  const box = $('#notice'); box.className = `notice ${error ? 'error' : ''}`; box.textContent = message; box.hidden = false;
  if (!error) { clearTimeout(notice.timer); notice.timer = setTimeout(() => { box.hidden = true; }, 5000); }
}
function field(name, title, type = 'text', value = '', extra = '', required = true) {
  return `<label class="field" for="f-${name}"><span>${title}${required ? ' <span class="required">*</span>' : ''}</span><input id="f-${name}" name="${name}" type="${type}" value="${escape(value)}" ${required ? 'required' : ''} ${extra}/><small class="field-error" data-error="${name}"></small></label>`;
}
function select(name, title, options, value = '', required = true) {
  return `<label class="field" for="f-${name}"><span>${title}</span><select id="f-${name}" name="${name}" ${required ? 'required' : ''}>${options.map(([v,t]) => `<option value="${escape(v)}" ${String(v) === String(value) ? 'selected' : ''}>${escape(t)}</option>`).join('')}</select><small class="field-error" data-error="${name}"></small></label>`;
}
function showFormErrors(form, error) {
  $('.form-error', form).textContent = error.message; $('.form-error', form).hidden = false; $('.form-error', form).focus();
  for (const [name, message] of Object.entries(error.fields || {})) {
    const input = form.elements.namedItem(name); if (input) { input.setAttribute('aria-invalid', 'true'); const output = $(`[data-error="${name}"]`, form); if (output) { output.textContent = message; output.id = `error-${name}`; input.setAttribute('aria-describedby', output.id); } }
  }
}
async function submitForm(form, callback) {
  if (!form.reportValidity()) return;
  const submit = $('button[type="submit"]', form); const original = submit.textContent; submit.disabled = true; submit.textContent = 'Saving…';
  $('.form-error', form).hidden = true;
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  try { await callback(Object.fromEntries(new FormData(form))); }
  catch (error) { showFormErrors(form, error); }
  finally { submit.disabled = false; submit.textContent = original; }
}

function authView(mode = 'login') {
  const resetToken = location.hash.startsWith('#reset=') ? location.hash.slice(7) : null;
  if (resetToken) mode = 'reset';
  const titles = { login: 'Welcome back.', register: 'Create your workspace.', recover: 'Recover your account.', reset: 'Set a new password.' };
  const subtitles = { login: 'Sign in to keep your hospital moving.', register: 'Start with a clean workspace for your care team.', recover: 'Get your hospital ID and a password reset link by email.', reset: 'Use a unique password with at least 12 characters.' };
  let fields = '';
  if (mode === 'login') fields = field('identifier', 'Hospital ID or email', 'text', '', 'autocomplete="username" maxlength="254"') + field('password', 'Password', 'password', '', 'autocomplete="current-password" maxlength="128"');
  if (mode === 'register') fields = field('name', 'Hospital name', 'text', '', 'autocomplete="organization" maxlength="120"') + field('email', 'Administrator email', 'email', '', 'autocomplete="email" maxlength="254"') + field('phone', 'Hospital phone', 'tel', '', 'autocomplete="tel" maxlength="30"') + field('address', 'Hospital address', 'text', '', 'autocomplete="street-address" maxlength="500"') + field('password', 'Password', 'password', '', 'autocomplete="new-password" minlength="12" maxlength="128"') + '<p class="helper">At least 12 characters. You can use your email to sign in.</p>';
  if (mode === 'recover') fields = field('email', 'Administrator email', 'email', '', 'autocomplete="email"');
  if (mode === 'reset') fields = field('password', 'New password', 'password', '', 'autocomplete="new-password" minlength="12" maxlength="128"');
  $('#app').innerHTML = `<main class="auth-layout"><section class="auth-story"><a href="/" class="brand">${brand}</a><div class="story-copy"><span class="eyebrow">BUILT AROUND BETTER CARE</span><h1>One workspace.<br>A connected<br><span>care team.</span></h1><p>Bring your people, capacity, and patient flow together. Make every handoff clearer.</p><div class="story-features"><div>${icon('doctors')}<span>Your team, in sync</span></div><div>${icon('beds')}<span>Capacity, at a glance</span></div><div>${icon('queue')}<span>Every arrival, accounted for</span></div></div></div><p class="story-footer">UniHealth / Hospital management</p></section><section class="auth-form-panel"><button class="icon-button auth-theme" aria-label="Toggle light and dark theme" data-action="theme">${icon('sun')}</button><div class="auth-form-wrap"><span class="eyebrow">YOUR HOSPITAL STARTS HERE</span><h2>${titles[mode]}</h2><p class="muted">${subtitles[mode]}</p><form id="auth-form"><div class="form-error" role="alert" tabindex="-1" hidden></div>${fields}<button class="primary wide" type="submit">${{ login: 'Sign in to workspace', register: 'Create hospital account', recover: 'Send recovery email', reset: 'Update password' }[mode]}${icon('arrow')}</button></form><div class="auth-links">${mode === 'login' ? '<button class="text-button" data-auth="recover">Forgot your password or hospital ID?</button><p>New to UniHealth? <button class="text-button" data-auth="register">Create a workspace</button></p>' : '<button class="text-button" data-auth="login">Back to sign in</button>'}</div><p class="secure-note">${icon('shield')}Secure access for hospital administrators</p></div></section></main>`;
  $('#auth-form').addEventListener('submit', event => { event.preventDefault(); submitForm(event.currentTarget, async data => {
    const result = await api(`/auth/${mode === 'recover' ? 'recover' : mode}`, { method: 'POST', body: mode === 'reset' ? { ...data, token: resetToken } : data });
    if (mode === 'login' || mode === 'register') location.assign('/hospital-dashboard.html');
    else { if (mode === 'reset') history.replaceState(null, '', '/index.html'); authView('login'); notice(result.message); }
  }); });
}

function shell() {
  const h = state.hospital;
  $('#app').innerHTML = `<a class="skip" href="#main">Skip to main content</a><div class="workspace"><aside class="sidebar" id="sidebar"><a class="brand" href="/hospital-dashboard.html">${brand}</a><div class="workspace-tag">Hospital workspace</div><nav aria-label="Main navigation">${Object.entries(labels).map(([key, name]) => `<a href="/hospital-${key}.html" ${key === page ? 'aria-current="page" class="active"' : ''}>${icon(pageIcons[key])}<span>${name}</span>${key === page ? '<span class="nav-indicator"></span>' : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="care-note">${icon('shield')}<strong>Care starts with clarity.</strong><p>One shared view for your hospital operations.</p></div><div class="profile"><span class="avatar">${escape(h.name.slice(0, 2).toUpperCase())}</span><div><strong>${escape(h.name)}</strong><small>Administrator</small></div></div><button class="logout" data-action="logout">${icon('logout')}Sign out</button></div></aside><div class="main-wrap"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><span>Workspace</span><span class="separator">/</span><strong>${labels[page]}</strong></div><div class="topbar-actions"><span class="date-today">${new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span><button class="icon-button" data-action="theme" aria-label="Toggle light and dark theme">${icon('sun')}</button><span class="avatar small">${escape(h.name.slice(0, 2).toUpperCase())}</span></div></header><main id="main" tabindex="-1"><div class="page-heading"><div><div class="eyebrow">HOSPITAL OPERATIONS</div><h1>${labels[page]}</h1><p>${hints[page]}</p></div><div class="heading-actions"><button class="secondary" data-action="refresh">${icon('refresh')}Refresh</button>${['doctors','beds','tokens'].includes(page) ? button({ doctors: 'Add doctor', beds: 'Add ward', tokens: 'New patient token' }[page], `add-${page}`) : ''}</div></div><div class="status-strip"><div>${icon('shield')}<span>Hospital status</span><strong id="current-status">${label(h.status)}</strong></div><label class="status-control">Set status<select id="hospital-status" aria-label="Hospital operational status">${['normal','busy','overloaded','emergency'].map(s => `<option value="${s}" ${h.status === s ? 'selected' : ''}>${label(s)}</option>`).join('')}</select></label></div><div id="content"><div class="loading" role="status">Loading your workspace…</div></div><footer class="page-footer"><span>UniHealth <span class="footer-dot">·</span> ${escape(h.id)}</span><span id="updated">Hospital time: Asia/Kolkata</span></footer></main></div></div><dialog id="editor" aria-labelledby="dialog-title"></dialog>`;
  $('#hospital-status').addEventListener('change', async event => {
    const control = event.target; control.disabled = true;
    try { const result = await api('/hospital/status', { method: 'PATCH', body: { status: control.value } }); state.hospital.status = result.status; $('#current-status').textContent = label(result.status); notice('Hospital status updated.'); }
    catch (error) { control.value = state.hospital.status; notice(error.message, true); }
    finally { control.disabled = false; }
  });
}
function stat(title, value, note, symbol, color = '') { return `<article class="stat ${color}"><div class="stat-top"><span>${title}</span><span class="stat-icon">${icon(symbol)}</span></div><strong class="stat-value">${value}</strong><p>${note}</p></article>`; }
function progress(occupied, capacity) { return `<progress max="${capacity || 1}" value="${occupied}" aria-label="${occupied} of ${capacity} beds occupied"></progress>`; }
function wardRows(wards) {
  return wards.map(w => `<div class="capacity-row"><div class="capacity-info"><span class="ward-symbol">${icon('beds')}</span><div><strong>${escape(w.name)}</strong><small>${label(w.type)} ward</small></div><span>${w.occupied}<span class="muted"> / ${w.capacity} occupied</span></span></div>${progress(w.occupied,w.capacity)}</div>`).join('');
}
function activity(items) { return items.length ? `<div class="activity">${items.map(a => `<div class="activity-item"><span class="activity-dot"></span><div><strong>${escape(a.details)}</strong><small>${escape(a.actor)} <span>· ${date(a.created_at)}</span></small></div></div>`).join('')}</div>` : empty('No activity yet', 'Changes made in this workspace will appear here.'); }
function dashboard() {
  const { beds: b, doctors: d, queue: q, recent } = state.summary;
  return `<section class="welcome"><div><span class="eyebrow">YOUR DAILY PULSE</span><h2>Ready for the day ahead.</h2><p>${escape(state.hospital.name)} — keep every part of care connected.</p><a class="primary" href="/hospital-tokens.html">Open patient queue ${icon('arrow')}</a></div><div class="welcome-art" aria-hidden="true"><svg viewBox="0 0 300 160" fill="none"><circle cx="175" cy="80" r="68"/><circle cx="175" cy="80" r="46"/><path d="M10 85h90l16-25 21 56 26-83 22 52h100"/></svg><span>People. Capacity. Care.</span></div></section><section class="stats" aria-label="Hospital summary">${stat('Available beds', b.capacity - b.occupied, `${b.occupied} occupied of ${b.capacity} total`, 'beds', 'blue')}${stat('Doctors on duty', d.on_duty, `${d.total} doctors in your team`, 'doctors', 'teal')}${stat('Patients waiting', q.waiting, `${q.in_progress} consultations in progress`, 'queue', 'amber')}${stat('Average current wait', q.average_wait === null ? '—' : `${q.average_wait}<small> min</small>`, 'Elapsed wait for patients still in queue', 'clock', 'violet')}</section><div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h2>Bed capacity</h2><p>Current occupancy across your wards</p></div><a class="text-link" href="/hospital-beds.html">Manage ${icon('arrow')}</a></div>${state.wards.length ? wardRows(state.wards.slice(0,5)) : empty('Your wards will appear here', 'Add a ward and its capacity to get started.', '<a class="secondary" href="/hospital-beds.html">Set up wards</a>')}</section><section class="panel"><div class="panel-heading"><div><h2>At a glance</h2><p>What is happening right now</p></div>${icon('grid')}</div><div class="glance-row"><span>ICU occupancy</span><strong>${b.icu_occupied} / ${b.icu_capacity}</strong></div><div class="glance-row"><span>Active emergency tokens</span><strong>${q.emergencies}</strong></div><div class="glance-row"><span>Completed today</span><strong>${q.completed_today}</strong></div><div class="subtle-note">All figures come from your saved hospital records.</div></section><section class="panel full-span"><div class="panel-heading"><div><h2>Recent activity</h2><p>The latest updates from your workspace</p></div><a class="text-link" href="/hospital-audit.html">View audit log ${icon('arrow')}</a></div>${activity(recent)}</section></div>`;
}
function toolbar(kind, filters = '') { return `<div class="toolbar"><label class="search">${icon('search')}<input type="search" id="search" placeholder="Search ${kind}…" aria-label="Search ${kind}"/></label>${filters}<span class="result-count" id="result-count"></span></div><div id="records"></div>`; }
function doctorsPage() {
  const onDuty = state.doctors.filter(d => d.on_duty).length;
  return `<section class="stats three">${stat('Total doctors',state.doctors.length,'Registered care team','doctors','blue')}${stat('On duty',onDuty,'Available for consultations','doctors','teal')}${stat('Off duty',state.doctors.length-onDuty,'Not currently on duty','clock','amber')}</section><section class="panel">${toolbar('doctors', '<select id="filter" aria-label="Filter doctor duty status"><option value="all">All duty statuses</option><option value="on">On duty</option><option value="off">Off duty</option></select>')}</section>`;
}
function bedsPage() {
  const capacity = state.wards.reduce((s,w) => s+w.capacity,0), occupied = state.wards.reduce((s,w) => s+w.occupied,0);
  return `<section class="stats three">${stat('Total beds',capacity,`${state.wards.length} configured wards`,'beds','blue')}${stat('Available beds',capacity-occupied,'Ready for admission','beds','teal')}${stat('Occupancy',capacity ? `${Math.round(occupied/capacity*100)}<small>%</small>` : '—',`${occupied} beds currently occupied`,'chart','amber')}</section><section class="panel">${toolbar('wards', '<select id="filter" aria-label="Filter ward type"><option value="all">All ward types</option><option value="general">General</option><option value="emergency">Emergency</option><option value="icu">ICU</option></select>')}</section>`;
}
function tokensPage() {
  const count = status => state.tokens.filter(t => t.status === status).length;
  return `<section class="stats three">${stat('Waiting',count('waiting'),'Awaiting consultation','queue','amber')}${stat('In consultation',count('in_progress'),'Care in progress','doctors','blue')}${stat('Completed',count('completed'),'Across saved queue history','shield','teal')}</section><section class="panel"><div class="panel-heading"><div><h2>Patient queue</h2><p>Emergency and urgent arrivals appear first within each status.</p></div></div>${toolbar('patients or token numbers', '<select id="filter" aria-label="Filter token status"><option value="active">Active queue</option><option value="all">All records</option><option value="waiting">Waiting</option><option value="in_progress">In consultation</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>')}</section>`;
}
function renderRecords() {
  const search = ($('#search')?.value || '').toLowerCase(), filter = $('#filter')?.value || 'all';
  const records = page === 'doctors' ? state.doctors.filter(d => `${d.name} ${d.specialty} ${d.department} ${d.license}`.toLowerCase().includes(search) && (filter === 'all' || Boolean(d.on_duty) === (filter === 'on'))) : page === 'beds' ? state.wards.filter(w => w.name.toLowerCase().includes(search) && (filter === 'all' || w.type === filter)) : state.tokens.filter(t => `${t.patient} ${t.number} ${t.reason}`.toLowerCase().includes(search) && (filter === 'all' || filter === t.status || filter === 'active' && ['waiting','in_progress'].includes(t.status)));
  $('#result-count').textContent = `${records.length} ${records.length === 1 ? 'record' : 'records'}`;
  if (!records.length) {
    const any = (page === 'doctors' ? state.doctors : page === 'beds' ? state.wards : state.tokens).length;
    $('#records').innerHTML = empty(any ? 'No matching records' : { doctors: 'Build your care team', beds: 'Make room for better care', tokens: 'Your queue is clear' }[page], any ? 'Try another search or filter.' : { doctors: 'Add your first doctor to manage duty status and consultations.', beds: 'Add your first ward with its actual bed capacity.', tokens: 'New patient tokens will appear here when you create them.' }[page], any ? '' : button({ doctors: 'Add your first doctor', beds: 'Add your first ward', tokens: 'Create a patient token' }[page], `add-${page}`)); return;
  }
  if (page === 'doctors') $('#records').innerHTML = `<div class="record-grid">${records.map(d => `<article class="doctor-card"><div class="card-top"><span class="doctor-avatar">${escape(d.name.split(' ').map(w => w[0]).slice(0,2).join(''))}</span>${badge(d.on_duty ? 'on_duty' : 'off_duty')}</div><h3>${escape(d.name)}</h3><p class="specialty">${escape(d.specialty)}</p><dl><div><dt>Department</dt><dd>${escape(d.department || 'Not assigned')}</dd></div><div><dt>Room</dt><dd>${escape(d.room || 'Not assigned')}</dd></div><div><dt>Shift</dt><dd>${d.shift_start}–${d.shift_end}</dd></div><div><dt>License</dt><dd>${escape(d.license)}</dd></div></dl><div class="card-actions">${button('Edit doctor','edit-doctors','secondary',`data-id="${d.id}"`)}${button(d.on_duty ? 'Set off duty' : 'Set on duty','duty','text-button',`data-id="${d.id}"`)}</div></article>`).join('')}</div>`;
  else if (page === 'beds') $('#records').innerHTML = `<div class="record-grid">${records.map(w => `<article class="ward-card"><div class="card-top"><span class="ward-symbol">${icon('beds')}</span>${badge(w.occupied === w.capacity ? 'full' : w.occupied/w.capacity >= 0.8 ? 'limited' : 'available')}</div><h3>${escape(w.name)}</h3><p class="specialty">${label(w.type)} ward</p><div class="ward-number">${w.capacity-w.occupied}<span> beds available</span></div>${progress(w.occupied,w.capacity)}<div class="ward-totals"><span>${w.occupied} occupied</span><span>${w.capacity} total</span></div><div class="card-actions">${button('Update ward','edit-beds','secondary',`data-id="${w.id}"`)}<small>Updated ${date(w.updated_at)}</small></div></article>`).join('')}</div>`;
  else $('#records').innerHTML = `<div class="table-wrap"><table><caption class="sr-only">Patient queue records</caption><thead><tr><th>Token / arrival</th><th>Patient</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead><tbody>${records.map(t => `<tr><td><strong class="token-number">#${String(t.number).padStart(3,'0')}</strong><small>${date(t.created_at)}</small></td><td><strong>${escape(t.patient)}</strong><small>${escape(t.reason)}</small><small>${t.doctor_name ? `Dr: ${escape(t.doctor_name)}` : 'Unassigned doctor'}</small></td><td>${badge(t.priority)}</td><td>${badge(t.status)}</td><td><div class="row-actions">${t.status === 'waiting' ? button('Start consultation','token-start','secondary',`data-id="${t.id}"`) : t.status === 'in_progress' ? button('Complete','token-complete','primary',`data-id="${t.id}"`) : '<span class="muted">Closed</span>'}${['waiting','in_progress'].includes(t.status) ? button('Cancel','token-cancel','text-button danger-text',`data-id="${t.id}"`) : ''}</div></td></tr>`).join('')}</tbody></table></div>`;
}
function analyticsPage() {
  const { daily, beds } = state.analytics;
  const arrivals = daily.reduce((n,d) => n+d.arrivals,0), completed = daily.reduce((n,d) => n+Number(d.completed),0);
  const max = Math.max(1,...daily.map(d => d.arrivals));
  return `<section class="stats three">${stat('Arrivals',arrivals,'Last 30 days','queue','blue')}${stat('Completed visits',completed,'From arrivals in the last 30 days','shield','teal')}${stat('Emergency arrivals',daily.reduce((n,d) => n+Number(d.emergencies),0),'Last 30 days','chart','amber')}</section><section class="panel"><div class="panel-heading"><div><h2>Daily patient activity</h2><p>Last 30 days · Hospital time (Asia/Kolkata)</p></div>${button('Export CSV','export','secondary')}</div>${daily.length ? `<div class="bar-chart" role="img" aria-label="Arrivals by day. Exact values are in the table below.">${daily.map(d => `<div class="bar-column"><span>${d.arrivals}</span><svg viewBox="0 0 30 120" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="${120-d.arrivals/max*110}" width="26" height="${d.arrivals/max*110}" rx="4"/></svg><small>${d.visit_date.slice(8)}</small></div>`).join('')}</div><div class="table-wrap"><table><caption class="sr-only">Daily patient activity and actual wait times</caption><thead><tr><th>Date</th><th>Arrivals</th><th>Completed</th><th>Cancelled</th><th>Avg. wait to consultation</th></tr></thead><tbody>${daily.map(d => `<tr><td>${escape(d.visit_date)}</td><td>${d.arrivals}</td><td>${d.completed}</td><td>${d.cancelled}</td><td>${d.average_wait === null ? '—' : `${d.average_wait} min`}</td></tr>`).join('')}</tbody></table></div>` : empty('Insights start with real activity','Create patient tokens to build your hospital’s activity history.')}</section><section class="panel section-gap"><div class="panel-heading"><div><h2>Capacity history</h2><p>Latest 60 saved changes within the last 30 days</p></div></div>${beds.length ? `<div class="table-wrap"><table><thead><tr><th>Recorded at</th><th>Total beds</th><th>Occupied</th><th>Utilization</th></tr></thead><tbody>${beds.slice().reverse().map(b => `<tr><td>${date(b.created_at)}</td><td>${b.capacity}</td><td>${b.occupied}</td><td>${b.capacity ? Math.round(b.occupied/b.capacity*100)+'%' : '—'}</td></tr>`).join('')}</tbody></table></div>` : empty('No capacity history yet','Adding or updating a ward records a capacity snapshot.')}</section>`;
}
function auditPage() {
  const { items,total,page: current,pageSize } = state.audit;
  return `<section class="panel"><div class="panel-heading"><div><h2>Workspace history</h2><p>Server-recorded changes · ${total} matching entries</p></div>${icon('shield')}</div><form id="audit-search" class="toolbar"><label class="search">${icon('search')}<input name="q" type="search" maxlength="120" value="${escape(state.auditQuery)}" aria-label="Search audit history" placeholder="Search activity or administrator…"/></label><button class="secondary" type="submit">Search</button></form>${items.length ? `<div class="table-wrap"><table><caption class="sr-only">Audit history</caption><thead><tr><th>Time</th><th>Action</th><th>Details</th><th>Administrator</th></tr></thead><tbody>${items.map(a => `<tr><td class="nowrap">${date(a.created_at)}</td><td><span class="audit-action">${escape(a.action)}</span></td><td>${escape(a.details)}</td><td>${escape(a.actor)}</td></tr>`).join('')}</tbody></table></div>` : empty('No matching activity','Try a different search. Saved changes will appear here.')}<div class="pagination"><span>Page ${current} of ${Math.max(1,Math.ceil(total/pageSize))}</span><div>${button('Previous','audit-prev','secondary',current === 1 ? 'disabled' : '')}${button('Next','audit-next','secondary',current*pageSize >= total ? 'disabled' : '')}</div></div></section>`;
}
let refreshBusy = false;
async function refresh() {
  if (refreshBusy) return; refreshBusy = true;
  const refreshButton = $('[data-action="refresh"]'); if (refreshButton) refreshButton.disabled = true;
  const oldSearch = $('#search')?.value, oldFilter = $('#filter')?.value;
  try {
    const { hospital } = await api('/me');
    state.hospital.status = hospital.status;
    $('#current-status').textContent = label(hospital.status);
    $('#hospital-status').value = hospital.status;
    if (page === 'dashboard') { const [summary,wards] = await Promise.all([api('/summary'),api('/wards')]); state.summary = summary; state.wards = wards.items; }
    if (page === 'doctors') state.doctors = (await api('/doctors')).items;
    if (page === 'beds') state.wards = (await api('/wards')).items;
    if (page === 'tokens') { const [tokens,doctors] = await Promise.all([api('/tokens'),api('/doctors')]); state.tokens = tokens.items; state.doctors = doctors.items; }
    if (page === 'analytics') state.analytics = await api('/analytics');
    if (page === 'audit') state.audit = await api(`/audit?page=${state.auditPage}&q=${encodeURIComponent(state.auditQuery)}`);
    $('#content').innerHTML = ({ dashboard, doctors: doctorsPage, beds: bedsPage, tokens: tokensPage, analytics: analyticsPage, audit: auditPage })[page]();
    if ($('#search')) { if (oldSearch !== undefined) $('#search').value = oldSearch; if (oldFilter !== undefined) $('#filter').value = oldFilter; $('#search').addEventListener('input',renderRecords); $('#filter').addEventListener('change',renderRecords); renderRecords(); }
    $('#audit-search')?.addEventListener('submit', event => { event.preventDefault(); state.auditQuery = new FormData(event.target).get('q'); state.auditPage = 1; refresh(); });
    $('#updated').textContent = `Updated ${new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(new Date())} IST`;
    $('#notice').hidden = true;
  } catch (error) {
    notice(error.message,true);
    if ($('#content .loading')) $('#content').innerHTML = empty('Your records could not be loaded','Use Refresh to try again.');
  } finally { refreshBusy = false; if (refreshButton) refreshButton.disabled = false; }
}

function editor(kind, id) {
  const collection = kind === 'doctors' ? state.doctors : kind === 'beds' ? state.wards : [];
  const item = collection.find(i => i.id === id); const v = item || {};
  let fields;
  if (kind === 'doctors') fields = field('name','Full name','text',v.name,'maxlength="120"') + field('specialty','Specialty','text',v.specialty,'maxlength="120"') + field('license','Medical license number','text',v.license,'maxlength="80"') + field('department','Department','text',v.department,'maxlength="120"',false) + field('phone','Phone','tel',v.phone,'maxlength="30"',false) + field('email','Email','email',v.email,'maxlength="254"',false) + field('room','Room / OPD','text',v.room,'maxlength="40"',false) + select('on_duty','Duty status',[['false','Off duty'],['true','On duty']], String(Boolean(v.on_duty))) + field('shift_start','Shift starts','time',v.shift_start || '09:00') + field('shift_end','Shift ends','time',v.shift_end || '17:00') + '<p class="helper full-span">Shift times are in Asia/Kolkata. Duty status is set manually; overnight shifts are supported.</p>';
  if (kind === 'beds') fields = field('name','Ward name','text',v.name,'maxlength="120"') + select('type','Ward type',[['general','General'],['emergency','Emergency'],['icu','ICU']], v.type || 'general') + field('capacity','Total bed capacity','number',v.capacity ?? '', 'min="1" max="100000" step="1"') + field('occupied','Occupied beds','number',v.occupied ?? 0, 'min="0" max="100000" step="1"') + '<p class="helper full-span">Enter actual counts. Availability is calculated from capacity and occupancy.</p>';
  if (kind === 'tokens') fields = field('patient','Patient name','text','','maxlength="120"') + field('reason','Reason for visit','text','','maxlength="500"') + select('priority','Priority',[['routine','Routine'],['urgent','Urgent'],['emergency','Emergency']],'routine') + select('doctor_id','Assigned doctor',[['','Unassigned'],...state.doctors.map(d => [d.id,`${d.name} · ${d.on_duty ? 'on duty' : 'off duty'}`])],'',false) + '<p class="helper full-span">The token number and arrival time are assigned when you save.</p>';
  const dialog = $('#editor');
  dialog.innerHTML = `<form id="record-form"><div class="dialog-header"><div><span class="eyebrow">${kind === 'tokens' ? 'PATIENT ARRIVAL' : 'WORKSPACE RECORD'}</span><h2 id="dialog-title">${item ? 'Edit' : 'Add'} ${kind === 'doctors' ? 'doctor' : kind === 'beds' ? 'ward' : 'patient token'}</h2></div><button type="button" class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><div class="form-error" role="alert" tabindex="-1" hidden></div><div class="form-grid">${fields}</div><div class="dialog-footer">${item ? button('Remove record',`remove-${kind}`,'text-button danger-text',`data-id="${id}"`) : '<span></span>'}<div><button class="secondary" type="button" data-action="close-dialog">Cancel</button><button class="primary" type="submit">${item ? 'Save changes' : 'Create record'}</button></div></div></form>`;
  dialog.showModal();
  $('#record-form').addEventListener('submit', event => { event.preventDefault(); submitForm(event.currentTarget, async data => {
    if (kind === 'doctors') data.on_duty = data.on_duty === 'true';
    if (kind === 'beds') { data.capacity = Number(data.capacity); data.occupied = Number(data.occupied); }
    if (kind === 'tokens') data.doctor_id = data.doctor_id || null;
    if (item) data.version = item.version;
    await api(`/${kind === 'beds' ? 'wards' : kind}${item ? '/'+id : ''}`, { method: item ? 'PUT' : 'POST', body: data });
    dialog.close(); await refresh(); notice('Record saved.');
  }); });
}
function confirmAction(title, description, callback) {
  const dialog = $('#editor'); if (dialog.open) dialog.close();
  dialog.innerHTML = `<form id="confirm-form"><div class="dialog-header"><h2 id="dialog-title">${title}</h2><button type="button" class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><p>${description}</p><div class="form-error" role="alert" tabindex="-1" hidden></div><div class="dialog-footer"><span></span><div><button type="button" class="secondary" data-action="close-dialog" autofocus>Keep record</button><button type="submit" class="danger">Confirm</button></div></div></form>`;
  dialog.showModal();
  $('#confirm-form').addEventListener('submit', event => { event.preventDefault(); submitForm(event.currentTarget, async () => { await callback(); dialog.close(); await refresh(); notice('Change saved.'); }); });
}
function exportCSV() {
  if (!state.analytics.daily.length) { notice('There is no activity to export yet.',true); return; }
  const rows = [['Date','Arrivals','Completed','Cancelled','Emergencies','Average wait (minutes)'],...state.analytics.daily.map(d => [d.visit_date,d.arrivals,d.completed,d.cancelled,d.emergencies,d.average_wait ?? ''])];
  const csv = rows.map(row => row.map(v => '"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'unihealth-activity.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
document.addEventListener('click', async event => {
  const auth = event.target.closest('[data-auth]'); if (auth) { history.replaceState(null,'','/index.html'); authView(auth.dataset.auth); return; }
  const target = event.target.closest('[data-action]'); if (!target || target.disabled) return;
  const { action,id } = target.dataset;
  try {
    if (action === 'theme') toggleTheme();
    else if (action === 'menu') { const open = $('#sidebar').classList.toggle('is-open'); target.setAttribute('aria-expanded',String(open)); }
    else if (action === 'refresh') await refresh();
    else if (action === 'logout') { target.disabled = true; await api('/auth/logout',{ method: 'POST', body: {} }); location.assign('/index.html'); }
    else if (action.startsWith('add-') || action.startsWith('edit-')) editor(action.split('-')[1],id);
    else if (action === 'close-dialog') $('#editor').close();
    else if (action.startsWith('remove-')) {
      const kind = action.split('-')[1], item = (kind === 'doctors' ? state.doctors : state.wards).find(v => v.id === id);
      confirmAction('Remove this record?',`Remove <strong>${escape(item.name)}</strong> from this workspace? The audit history will be retained.`,() => api(`/${kind === 'beds' ? 'wards' : 'doctors'}/${id}`,{ method: 'DELETE',body: { version: item.version } }));
    } else if (action === 'duty') {
      const d = state.doctors.find(d => d.id === id);
      const body = Object.fromEntries(['name','specialty','license','phone','email','department','room','shift_start','shift_end','version'].map(k => [k,d[k]])); body.on_duty = !d.on_duty;
      target.disabled = true; await api('/doctors/'+id,{ method: 'PUT',body }); await refresh(); notice('Duty status updated.');
    } else if (action.startsWith('token-')) {
      const t = state.tokens.find(t => t.id === id), status = { 'token-start': 'in_progress', 'token-complete': 'completed', 'token-cancel': 'cancelled' }[action];
      const change = () => api('/tokens/'+id,{ method: 'PATCH',body: { status,version: t.version } });
      if (status === 'cancelled') confirmAction('Cancel this token?',`Token #${t.number} for ${escape(t.patient)} will be closed. Its history will be retained.`,change);
      else { target.disabled = true; await change(); await refresh(); notice('Queue updated.'); }
    } else if (action === 'audit-prev' || action === 'audit-next') { state.auditPage += action === 'audit-prev' ? -1 : 1; await refresh(); }
    else if (action === 'export') exportCSV();
  } catch (error) { notice(error.message,true); target.disabled = false; }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('#sidebar')?.classList.remove('is-open'); $('[data-action="menu"]')?.setAttribute('aria-expanded','false'); } });
async function init() {
  if (page === 'auth') { authView(); return; }
  try { state.hospital = (await api('/me')).hospital; shell(); await refresh(); }
  catch (error) { $('#app').innerHTML = `<main class="connection-error"><h1>Unable to open your workspace</h1><p>${escape(error.message)}</p><a class="primary" href="/index.html">Go to sign in</a></main>`; }
}
init();
