import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { randomBytes, randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'node:url';
import { pool, transaction } from './db.js';
import { digest, hashPassword, verifyPassword } from './security.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { 'script-src': ["'self'"], 'style-src': ["'self'"], 'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null } } }));
app.use(express.json({ limit: '24kb' }));
const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    if (req.get('origin') && req.get('origin') !== origin) return res.status(403).json({ error: 'Request origin is not allowed.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'JSON requests are required.' });
  }
  next();
});
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many attempts. Please try again in 15 minutes.' } });
const text = max => z.string().trim().min(1).max(max);
const password = z.string().min(12, 'Use at least 12 characters.').max(128);
const email = z.email().max(254).transform(s => s.toLowerCase());
const optionalText = max => z.string().trim().max(max).default('');
const uuid = z.uuid();
const version = z.number().int().positive();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const doctorSchema = z.object({ name: text(120), specialty: text(120), license: text(80), phone: optionalText(30), email: z.union([email, z.literal('')]).default(''), department: optionalText(120), room: optionalText(40), shift_start: time, shift_end: time, on_duty: z.boolean() }).strict();
const wardSchema = z.object({ name: text(120), type: z.enum(['general','emergency','icu']), capacity: z.number().int().min(1).max(100000), occupied: z.number().int().min(0).max(100000) }).strict().refine(v => v.occupied <= v.capacity, { path: ['occupied'], message: 'Occupied beds cannot exceed capacity.' });
const tokenSchema = z.object({ patient: text(120), reason: text(500), priority: z.enum(['routine','urgent','emergency']), doctor_id: uuid.nullable().default(null) }).strict();
const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
const hospitalView = h => ({ id: h.id, name: h.name, email: h.email, phone: h.phone, address: h.address, status: h.status });
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' };
function sessionToken(req) { return (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('uh_session='))?.slice(11) || ''; }
async function audit(db, hospital, action, details) {
  await db.execute('INSERT INTO audit_logs (hospital_id,actor,action,details) VALUES (?,?,?,?)', [hospital.id, hospital.email, action, details]);
}
async function createSession(db, hospitalId) {
  const token = randomBytes(32).toString('hex');
  await db.execute('INSERT INTO sessions (token_hash,hospital_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 12 HOUR))', [digest(token), hospitalId]);
  return token;
}
function sendSession(res, token) { res.cookie('uh_session', token, { ...cookieOptions, maxAge: 12 * 60 * 60 * 1000 }); }

app.get('/api/health', async (_req, res) => { await pool.query('SELECT 1 FROM hospitals LIMIT 1'); res.json({ status: 'ok', database: 'mysql' }); });
app.get('/api/auth/config', (_req, res) => res.json({ recoveryEnabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM) }));
app.post('/api/auth/register', authLimit, async (req, res) => {
  const data = z.object({ name: text(120), email, phone: text(30), address: text(500), password }).strict().parse(req.body);
  const hospital = { ...data, id: `UH-HOS-${randomBytes(6).toString('hex').toUpperCase()}`, status: 'normal' };
  const hash = await hashPassword(data.password);
  const token = await transaction(async db => {
    await db.execute('INSERT INTO hospitals (id,name,email,phone,address,password_hash) VALUES (?,?,?,?,?,?)', [hospital.id, data.name, data.email, data.phone, data.address, hash]);
    await audit(db, hospital, 'account.created', 'Hospital account created');
    return createSession(db, hospital.id);
  });
  sendSession(res, token);
  res.status(201).json({ hospital: hospitalView(hospital) });
});
app.post('/api/auth/login', authLimit, async (req, res) => {
  const data = z.object({ identifier: text(254), password: z.string().min(1).max(128) }).strict().parse(req.body);
  const [rows] = await pool.execute('SELECT * FROM hospitals WHERE id=? OR email=?', [data.identifier.toUpperCase(), data.identifier.toLowerCase()]);
  // A dummy hash makes nonexistent accounts perform the same password work.
  const hash = rows[0]?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64);
  const valid = await verifyPassword(data.password, hash);
  if (!rows[0] || !valid) fail(401, 'Hospital ID, email, or password is incorrect.');
  const hospital = rows[0];
  const token = await transaction(async db => {
    await audit(db, hospital, 'account.login', 'Administrator signed in');
    return createSession(db, hospital.id);
  });
  sendSession(res, token);
  res.json({ hospital: hospitalView(hospital) });
});
app.post('/api/auth/recover', authLimit, async (req, res) => {
  const data = z.object({ email }).strict().parse(req.body);
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) fail(503, 'Email recovery is not configured. Contact your system administrator.');
  const [rows] = await pool.execute('SELECT * FROM hospitals WHERE email=?', [data.email]);
  if (rows[0]) {
    const token = randomBytes(32).toString('hex');
    await transaction(async db => {
      await db.execute('DELETE FROM recovery_tokens WHERE hospital_id=?', [rows[0].id]);
      await db.execute('INSERT INTO recovery_tokens VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 30 MINUTE))', [digest(token), rows[0].id]);
    });
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {}) });
    try {
      await transport.sendMail({ from: process.env.SMTP_FROM, to: rows[0].email, subject: 'Your UniHealth account recovery', text: `Your hospital ID is ${rows[0].id}.\nReset your password within 30 minutes: ${origin}/index.html#reset=${token}\nIf you did not request this, ignore this email.` });
    } catch (error) {
      await pool.execute('DELETE FROM recovery_tokens WHERE token_hash=?', [digest(token)]);
      console.error('Account recovery email delivery failed:', error.code || 'SMTP_ERROR');
      // Do not reveal which email addresses have an account.
    }
  }
  res.json({ message: 'If that email is registered, recovery instructions will be sent.' });
});
app.post('/api/auth/reset', authLimit, async (req, res) => {
  const data = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password }).strict().parse(req.body);
  const hash = await hashPassword(data.password);
  await transaction(async db => {
    const [rows] = await db.execute('SELECT h.* FROM recovery_tokens r JOIN hospitals h ON h.id=r.hospital_id WHERE r.token_hash=? AND r.expires_at>UTC_TIMESTAMP(3) FOR UPDATE', [digest(data.token)]);
    if (!rows[0]) fail(400, 'This recovery link has expired or has already been used.');
    await db.execute('UPDATE hospitals SET password_hash=? WHERE id=?', [hash, rows[0].id]);
    await db.execute('DELETE FROM recovery_tokens WHERE hospital_id=?', [rows[0].id]);
    await db.execute('DELETE FROM sessions WHERE hospital_id=?', [rows[0].id]);
    await audit(db, rows[0], 'account.password_reset', 'Password reset; existing sessions revoked');
  });
  res.json({ message: 'Password updated. Sign in with your new password.' });
});
app.use('/api', async (req, _res, next) => {
  const token = sessionToken(req);
  if (!/^[a-f0-9]{64}$/.test(token)) fail(401, 'Please sign in to continue.');
  const [rows] = await pool.execute('SELECT h.* FROM sessions s JOIN hospitals h ON h.id=s.hospital_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3)', [digest(token)]);
  if (!rows[0]) fail(401, 'Your session has expired. Please sign in again.');
  req.hospital = rows[0]; next();
});
app.get('/api/me', (req, res) => res.json({ hospital: hospitalView(req.hospital) }));
app.post('/api/auth/logout', async (req, res) => {
  await transaction(async db => {
    await db.execute('DELETE FROM sessions WHERE token_hash=?', [digest(sessionToken(req))]);
    await audit(db, req.hospital, 'account.logout', 'Administrator signed out');
  });
  res.clearCookie('uh_session', cookieOptions).json({ ok: true });
});
app.patch('/api/hospital/status', async (req, res) => {
  const { status } = z.object({ status: z.enum(['normal','busy','overloaded','emergency']) }).strict().parse(req.body);
  await transaction(async db => {
    await db.execute('UPDATE hospitals SET status=? WHERE id=?', [status, req.hospital.id]);
    await audit(db, req.hospital, 'hospital.status_changed', `Operational status set to ${status}`);
  });
  res.json({ status });
});

async function lockHospital(db, id) { await db.execute('SELECT id FROM hospitals WHERE id=? FOR UPDATE', [id]); }
async function bedSnapshot(db, hospitalId) {
  await db.execute('INSERT INTO bed_history (hospital_id,capacity,occupied) SELECT ?,COALESCE(SUM(capacity),0),COALESCE(SUM(occupied),0) FROM wards WHERE hospital_id=?', [hospitalId, hospitalId]);
}
for (const [resource, schema] of [['doctors', doctorSchema], ['wards', wardSchema]]) {
  app.get(`/api/${resource}`, async (req, res) => {
    const [items] = await pool.execute(`SELECT * FROM ${resource} WHERE hospital_id=? ORDER BY name`, [req.hospital.id]);
    res.json({ items });
  });
  app.post(`/api/${resource}`, async (req, res) => {
    const data = schema.parse(req.body); const id = randomUUID();
    await transaction(async db => {
      await lockHospital(db, req.hospital.id);
      const columns = Object.keys(data);
      await db.execute(`INSERT INTO ${resource} (id,hospital_id,${columns.join(',')}) VALUES (${Array(columns.length + 2).fill('?').join(',')})`, [id, req.hospital.id, ...Object.values(data)]);
      await audit(db, req.hospital, `${resource}.created`, `Created ${data.name}`);
      if (resource === 'wards') await bedSnapshot(db, req.hospital.id);
    });
    res.status(201).json({ id });
  });
  app.put(`/api/${resource}/:id`, async (req, res) => {
    const id = uuid.parse(req.params.id);
    const { version: expected, ...fields } = req.body;
    version.parse(expected); const data = schema.parse(fields);
    await transaction(async db => {
      await lockHospital(db, req.hospital.id);
      if (resource === 'doctors' && !data.on_duty) {
        const [active] = await db.execute("SELECT id FROM tokens WHERE doctor_id=? AND hospital_id=? AND status='in_progress'", [id, req.hospital.id]);
        if (active.length) fail(409, 'Complete the active consultation before taking this doctor off duty.');
      }
      const [result] = await db.execute(`UPDATE ${resource} SET ${Object.keys(data).map(k => `${k}=?`).join(',')},version=version+1 WHERE id=? AND hospital_id=? AND version=?`, [...Object.values(data), id, req.hospital.id, expected]);
      if (!result.affectedRows) fail(409, 'This record changed or was removed. Refresh and try again.');
      await audit(db, req.hospital, `${resource}.updated`, `Updated ${data.name}`);
      if (resource === 'wards') await bedSnapshot(db, req.hospital.id);
    });
    res.json({ ok: true });
  });
  app.delete(`/api/${resource}/:id`, async (req, res) => {
    const id = uuid.parse(req.params.id); const { version: expected } = z.object({ version }).strict().parse(req.body);
    await transaction(async db => {
      await lockHospital(db, req.hospital.id);
      const [rows] = await db.execute(`SELECT * FROM ${resource} WHERE id=? AND hospital_id=? FOR UPDATE`, [id, req.hospital.id]);
      if (!rows[0]) fail(404, 'Record not found.');
      if (rows[0].version !== expected) fail(409, 'This record changed. Refresh before removing it.');
      if (resource === 'wards' && rows[0].occupied > 0) fail(409, 'Empty the ward before removing it.');
      if (resource === 'doctors') {
        const [active] = await db.execute("SELECT id FROM tokens WHERE doctor_id=? AND hospital_id=? AND status IN ('waiting','in_progress')", [id, req.hospital.id]);
        if (active.length) fail(409, 'This doctor has active queue entries. Complete or cancel them first.');
      }
      await db.execute(`DELETE FROM ${resource} WHERE id=? AND hospital_id=?`, [id, req.hospital.id]);
      await audit(db, req.hospital, `${resource}.deleted`, `Removed ${rows[0].name}`);
      if (resource === 'wards') await bedSnapshot(db, req.hospital.id);
    });
    res.json({ ok: true });
  });
}

app.get('/api/tokens', async (req, res) => {
  const [items] = await pool.execute("SELECT t.*,d.name AS doctor_name FROM tokens t LEFT JOIN doctors d ON d.id=t.doctor_id WHERE t.hospital_id=? ORDER BY FIELD(t.status,'in_progress','waiting','completed','cancelled'),FIELD(t.priority,'emergency','urgent','routine'),t.created_at,t.number", [req.hospital.id]);
  res.json({ items });
});
app.post('/api/tokens', async (req, res) => {
  const data = tokenSchema.parse(req.body); const id = randomUUID();
  const number = await transaction(async db => {
    await lockHospital(db, req.hospital.id);
    if (data.doctor_id) {
      const [doctors] = await db.execute('SELECT id FROM doctors WHERE id=? AND hospital_id=?', [data.doctor_id, req.hospital.id]);
      if (!doctors[0]) fail(400, 'Choose a doctor from this hospital.');
    }
    // Hospital-local date is explicitly Asia/Kolkata; MySQL timestamps remain UTC.
    const [rows] = await db.execute("SELECT COALESCE(MAX(number),0)+1 AS next FROM tokens WHERE hospital_id=? AND visit_date=DATE(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 330 MINUTE))", [req.hospital.id]);
    await db.execute('INSERT INTO tokens (id,hospital_id,number,visit_date,patient,reason,priority,doctor_id) VALUES (?,?,?,DATE(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 330 MINUTE)),?,?,?,?)', [id, req.hospital.id, rows[0].next, data.patient, data.reason, data.priority, data.doctor_id]);
    await audit(db, req.hospital, 'tokens.created', `Created queue token #${rows[0].next}`);
    return rows[0].next;
  });
  res.status(201).json({ id, number });
});
app.patch('/api/tokens/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const data = z.object({ status: z.enum(['in_progress','completed','cancelled']), version }).strict().parse(req.body);
  await transaction(async db => {
    await lockHospital(db, req.hospital.id);
    const [rows] = await db.execute('SELECT * FROM tokens WHERE id=? AND hospital_id=? FOR UPDATE', [id, req.hospital.id]);
    const token = rows[0]; if (!token) fail(404, 'Token not found.');
    if (token.version !== data.version) fail(409, 'This token has changed. Refresh and try again.');
    const transitions = { waiting: ['in_progress','cancelled'], in_progress: ['completed','cancelled'], completed: [], cancelled: [] };
    if (!transitions[token.status].includes(data.status)) fail(409, 'This queue status change is not allowed.');
    if (data.status === 'in_progress' && token.doctor_id) {
      const [doctors] = await db.execute('SELECT on_duty FROM doctors WHERE id=? AND hospital_id=?', [token.doctor_id, req.hospital.id]);
      if (!doctors[0]?.on_duty) fail(409, 'The assigned doctor must be on duty to begin a consultation.');
      const [active] = await db.execute("SELECT id FROM tokens WHERE doctor_id=? AND hospital_id=? AND status='in_progress'", [token.doctor_id, req.hospital.id]);
      if (active.length) fail(409, 'This doctor already has a consultation in progress.');
    }
    await db.execute("UPDATE tokens SET status=?,version=version+1,started_at=IF(?='in_progress',UTC_TIMESTAMP(3),started_at),completed_at=IF(? IN ('completed','cancelled'),UTC_TIMESTAMP(3),completed_at) WHERE id=? AND hospital_id=?", [data.status, data.status, data.status, id, req.hospital.id]);
    await audit(db, req.hospital, 'tokens.status_changed', `Token #${token.number}: ${token.status} → ${data.status}`);
  });
  res.json({ ok: true });
});
app.get('/api/summary', async (req, res) => {
  const id = req.hospital.id;
  const summary = await transaction(async db => {
    const [[beds]] = await db.execute("SELECT COALESCE(SUM(capacity),0) capacity,COALESCE(SUM(occupied),0) occupied,COALESCE(SUM(IF(type='icu',capacity,0)),0) icu_capacity,COALESCE(SUM(IF(type='icu',occupied,0)),0) icu_occupied FROM wards WHERE hospital_id=?", [id]);
    const [[doctors]] = await db.execute('SELECT COUNT(*) total,COALESCE(SUM(on_duty),0) on_duty FROM doctors WHERE hospital_id=?', [id]);
    const [[queue]] = await db.execute("SELECT COALESCE(SUM(status='waiting'),0) waiting,COALESCE(SUM(status='in_progress'),0) in_progress,COALESCE(SUM(status='completed' AND DATE(DATE_ADD(completed_at,INTERVAL 330 MINUTE))=DATE(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 330 MINUTE))),0) completed_today,COALESCE(SUM(priority='emergency' AND status IN ('waiting','in_progress')),0) emergencies,ROUND(AVG(IF(status='waiting',TIMESTAMPDIFF(SECOND,created_at,UTC_TIMESTAMP(3))/60,NULL)),1) average_wait FROM tokens WHERE hospital_id=?", [id]);
    const [recent] = await db.execute('SELECT * FROM audit_logs WHERE hospital_id=? ORDER BY id DESC LIMIT 5', [id]);
    return { beds, doctors, queue, recent, status: req.hospital.status };
  });
  res.json(summary);
});
app.get('/api/analytics', async (req, res) => {
  const id = req.hospital.id;
  const [daily] = await pool.execute("SELECT visit_date,COUNT(*) arrivals,SUM(status='completed') completed,SUM(status='cancelled') cancelled,SUM(priority='emergency') emergencies,ROUND(AVG(IF(started_at IS NOT NULL,TIMESTAMPDIFF(SECOND,created_at,started_at)/60,NULL)),1) average_wait FROM tokens WHERE hospital_id=? AND visit_date>=DATE_SUB(DATE(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 330 MINUTE)),INTERVAL 29 DAY) GROUP BY visit_date ORDER BY visit_date", [id]);
  const [beds] = await pool.execute('SELECT capacity,occupied,created_at FROM bed_history WHERE hospital_id=? AND created_at>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 30 DAY) ORDER BY id DESC LIMIT 60', [id]);
  res.json({ daily, beds: beds.reverse() });
});
app.get('/api/audit', async (req, res) => {
  const query = z.object({ q: z.string().max(120).default(''), page: z.coerce.number().int().min(1).max(100000).default(1) }).parse(req.query);
  const where = 'hospital_id=? AND (action LIKE ? OR details LIKE ? OR actor LIKE ?)';
  const search = `%${query.q}%`; const params = [req.hospital.id, search, search, search];
  const [items] = await pool.query(`SELECT * FROM audit_logs WHERE ${where} ORDER BY id DESC LIMIT 30 OFFSET ?`, [...params, (query.page - 1) * 30]);
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) total FROM audit_logs WHERE ${where}`, params);
  res.json({ items, total, page: query.page, pageSize: 30 });
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

const root = fileURLToPath(new URL('../', import.meta.url));
// Only explicit public files are served; credentials and backend sources are private.
for (const file of ['index.html','hospital-dashboard.html','hospital-doctors.html','hospital-beds.html','hospital-tokens.html','hospital-analytics.html','hospital-audit.html','hospital-style.css','app.js']) {
  app.get('/' + file, (_req, res) => res.sendFile(file, { root }));
}
app.get('/', (_req, res) => res.sendFile('index.html', { root }));
app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.') || 'Input'}: ${i.message}`).join(' '), fields: Object.fromEntries(error.issues.map(i => [i.path[0], i.message])) });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email, license, or ward name is already registered.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON request.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error('Request failed:', error.code || error.name);
  res.status(500).json({ error: 'The request could not be saved or loaded. Please try again.' });
});
