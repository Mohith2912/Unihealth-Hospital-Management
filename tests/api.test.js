import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomBytes } from 'node:crypto';

// Never write test fixtures into the application's real database.
process.env.DB_NAME = 'unihealth_test';
const { app } = await import('../server/app.js');
const { pool } = await import('../server/db.js');
const { migrate } = await import('../server/migrate.js');
const { digest } = await import('../server/security.js');
const admin = request.agent(app), outsider = request.agent(app);
const run = randomBytes(6).toString('hex');
const account = { name: 'Integration Test Hospital', email: `test-${run}@example.test`, phone: '1234567890', address: 'Test address', password: 'A-long-test-password-2026' };
const createdHospitals = [];
let hospital, doctor, ward, token;
const doctorData = { name: 'Test Doctor', specialty: 'General medicine', license: 'TEST-'+run, phone: '', email: '', department: 'OPD', room: '1', shift_start: '22:00', shift_end: '06:00', on_duty: true };
const wardData = { name: 'Test ICU', type: 'icu', capacity: 10, occupied: 2 };
before(async () => { await migrate(); });
after(async () => {
  for (const id of createdHospitals) await pool.execute('DELETE FROM hospitals WHERE id=?', [id]);
  await pool.end();
});

test('health reports actual MySQL connectivity; private files are not exposed', async () => {
  assert.equal((await request(app).get('/api/health').expect(200)).body.database,'mysql');
  for (const path of ['/.env','/server/schema.sql','/package.json','/firebase.js']) await request(app).get(path).expect(404);
});
test('unauthenticated access, non-JSON mutations, and cross-origin writes are rejected', async () => {
  await request(app).get('/api/doctors').expect(401);
  await request(app).post('/api/auth/login').set('Content-Type','text/plain').send('anything').expect(415);
  await request(app).post('/api/auth/register').set('Origin','https://untrusted.example').send(account).expect(403);
});
test('registration validates input and stores a salted password, with secure cookie attributes', async () => {
  await request(app).post('/api/auth/register').send({ ...account,password:'short' }).expect(400);
  const result = await admin.post('/api/auth/register').send(account).expect(201);
  hospital = result.body.hospital; createdHospitals.push(hospital.id);
  assert.match(result.headers['set-cookie'][0],/HttpOnly/);
  assert.match(result.headers['set-cookie'][0],/SameSite=Strict/);
  assert.equal(hospital.password_hash,undefined);
  const [[row]] = await pool.execute('SELECT password_hash FROM hospitals WHERE id=?',[hospital.id]);
  assert.notEqual(row.password_hash,account.password);
  assert.match(row.password_hash,/^[a-f0-9]{32}:[a-f0-9]{128}$/);
  await request(app).post('/api/auth/register').send(account).expect(409);
});
test('wrong credentials fail and both email and hospital ID authenticate', async () => {
  await request(app).post('/api/auth/login').send({ identifier: account.email,password:'wrong' }).expect(401);
  for (const identifier of [account.email,hospital.id]) await request(app).post('/api/auth/login').send({ identifier,password:account.password }).expect(200);
  assert.equal((await admin.get('/api/me').expect(200)).body.hospital.id,hospital.id);
});
test('new hospital has no sample doctors, wards, patients, or fabricated metrics', async () => {
  for (const resource of ['doctors','wards','tokens']) assert.deepEqual((await admin.get('/api/'+resource).expect(200)).body.items,[]);
  const { body } = await admin.get('/api/summary').expect(200);
  assert.equal(Number(body.beds.capacity),0); assert.equal(Number(body.doctors.total),0);
  assert.equal(body.queue.average_wait,null);
  assert.deepEqual((await admin.get('/api/analytics').expect(200)).body.daily,[]);
});
test('doctor create/update validates fields, licenses and stale versions', async () => {
  await admin.post('/api/doctors').send({ ...doctorData,shift_start:'25:00' }).expect(400);
  await admin.post('/api/doctors').send(doctorData).expect(201);
  await admin.post('/api/doctors').send(doctorData).expect(409);
  doctor = (await admin.get('/api/doctors')).body.items[0];
  await admin.put('/api/doctors/'+doctor.id).send({ ...doctorData,version:1 }).expect(200);
  await admin.put('/api/doctors/'+doctor.id).send({ ...doctorData,version:1 }).expect(409);
  doctor = (await admin.get('/api/doctors')).body.items[0];
});
test('ward constraints, occupied deletion protection and snapshots work', async () => {
  await admin.post('/api/wards').send({ ...wardData,occupied:11 }).expect(400);
  await admin.post('/api/wards').send({ ...wardData,capacity:0 }).expect(400);
  await admin.post('/api/wards').send(wardData).expect(201);
  ward = (await admin.get('/api/wards')).body.items[0];
  await admin.delete('/api/wards/'+ward.id).send({ version:ward.version }).expect(409);
  await admin.put('/api/wards/'+ward.id).send({ ...wardData,occupied:3,version:ward.version }).expect(200);
  await admin.put('/api/wards/'+ward.id).send({ ...wardData,version:ward.version }).expect(409);
  const { body } = await admin.get('/api/summary');
  assert.equal(Number(body.beds.occupied),3); assert.equal(Number(body.beds.icu_capacity),10);
  assert.equal((await admin.get('/api/analytics')).body.beds.length,2);
});
test('hospital isolation prevents reading, changing or assigning foreign records', async () => {
  const result = await outsider.post('/api/auth/register').send({ ...account,email:`outside-${run}@example.test` }).expect(201);
  createdHospitals.push(result.body.hospital.id);
  assert.deepEqual((await outsider.get('/api/doctors')).body.items,[]);
  await outsider.put('/api/doctors/'+doctor.id).send({ ...doctorData,version:doctor.version }).expect(409);
  await outsider.delete('/api/wards/'+ward.id).send({ version:2 }).expect(404);
  await outsider.post('/api/tokens').send({ patient:'Test',reason:'Test',priority:'routine',doctor_id:doctor.id }).expect(400);
});
test('concurrent token creation allocates unique sequential numbers', async () => {
  const results = await Promise.all(Array.from({length:8},(_,i) => admin.post('/api/tokens').send({ patient:`Test patient ${i}`,reason:'Testing',priority:i===0 ? 'emergency':'routine',doctor_id:doctor.id }).expect(201)));
  const numbers = results.map(r=>r.body.number).sort((a,b)=>a-b);
  assert.deepEqual(numbers,[1,2,3,4,5,6,7,8]);
  token = (await admin.get('/api/tokens')).body.items.find(t=>t.priority==='emergency');
});
test('queue enforces transitions and only one active consultation per doctor', async () => {
  await admin.patch('/api/tokens/'+token.id).send({ status:'completed',version:1 }).expect(409);
  await outsider.patch('/api/tokens/'+token.id).send({ status:'in_progress',version:1 }).expect(404);
  await admin.patch('/api/tokens/'+token.id).send({ status:'in_progress',version:1 }).expect(200);
  await admin.patch('/api/tokens/'+token.id).send({ status:'completed',version:1 }).expect(409);
  await admin.put('/api/doctors/'+doctor.id).send({ ...doctorData,on_duty:false,version:doctor.version }).expect(409);
  const next = (await admin.get('/api/tokens')).body.items.find(t=>t.status==='waiting');
  await admin.patch('/api/tokens/'+next.id).send({ status:'in_progress',version:1 }).expect(409);
  await admin.patch('/api/tokens/'+token.id).send({ status:'completed',version:2 }).expect(200);
  await admin.patch('/api/tokens/'+token.id).send({ status:'in_progress',version:3 }).expect(409);
  await admin.delete('/api/doctors/'+doctor.id).send({ version:doctor.version }).expect(409);
  const summary = (await admin.get('/api/summary')).body;
  assert.equal(Number(summary.queue.waiting),7); assert.equal(Number(summary.queue.completed_today),1);
});
test('off-duty doctors cannot start a consultation', async () => {
  await admin.put('/api/doctors/'+doctor.id).send({ ...doctorData,on_duty:false,version:doctor.version }).expect(200);
  const next = (await admin.get('/api/tokens')).body.items.find(t=>t.status==='waiting');
  await admin.patch('/api/tokens/'+next.id).send({ status:'in_progress',version:1 }).expect(409);
});
test('status changes persist and audit entries describe server-side mutations', async () => {
  await admin.patch('/api/hospital/status').send({status:'busy'}).expect(200);
  assert.equal((await admin.get('/api/me')).body.hospital.status,'busy');
  const {body} = await admin.get('/api/audit?q=hospital.status_changed');
  assert.equal(body.total,1); assert.equal(body.items[0].actor,account.email);
  await admin.post('/api/audit').send({ action:'forged' }).expect(404);
  assert.equal((await admin.get('/api/analytics')).body.daily[0].arrivals,8);
});
test('removing an emptied ward records history and requires the current version', async () => {
  await admin.put('/api/wards/'+ward.id).send({...wardData,occupied:0,version:2}).expect(200);
  await admin.delete('/api/wards/'+ward.id).send({version:2}).expect(409);
  await admin.delete('/api/wards/'+ward.id).send({version:3}).expect(200);
  assert.deepEqual((await admin.get('/api/wards')).body.items,[]);
});
test('recovery has no demo bypass; reset tokens expire and can only be used once', async () => {
  if (!process.env.SMTP_HOST) await admin.post('/api/auth/recover').send({email:account.email}).expect(503);
  await request(app).post('/api/auth/reset').send({token:'1234',password:account.password}).expect(400);
  const secret = randomBytes(32).toString('hex');
  await pool.execute('INSERT INTO recovery_tokens VALUES (?,?,DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 MINUTE))',[digest(secret),hospital.id]);
  await request(app).post('/api/auth/reset').send({token:secret,password:account.password}).expect(400);
  await pool.execute('UPDATE recovery_tokens SET expires_at=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 10 MINUTE) WHERE token_hash=?',[digest(secret)]);
  await request(app).post('/api/auth/reset').send({token:secret,password:account.password+'new'}).expect(200);
  await admin.get('/api/me').expect(401);
  await request(app).post('/api/auth/reset').send({token:secret,password:account.password}).expect(400);
  await admin.post('/api/auth/login').send({identifier:account.email,password:account.password+'new'}).expect(200);
});
test('logout invalidates the session in MySQL', async () => {
  await admin.post('/api/auth/logout').send({}).expect(200);
  await admin.get('/api/me').expect(401);
});
