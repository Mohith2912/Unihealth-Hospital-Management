import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
process.env.DB_NAME = 'unihealth_test';
process.env.APP_ORIGIN = 'http://localhost:3001';
const { app } = await import('../server/app.js');
const { pool } = await import('../server/db.js');
const { migrate } = await import('../server/migrate.js');
let server, browser, context, page, hospitalId;
const errors = [];
const run = randomBytes(6).toString('hex');
const base = 'http://localhost:3001';
const fill = async (name,value) => page.locator(`[name="${name}"]`).fill(value);
async function saved() { await page.waitForFunction(() => !document.querySelector('dialog').open); await page.locator('#notice').filter({hasText:'saved'}).waitFor(); }
before(async () => {
  await migrate(); await mkdir('.runtime/screenshots',{recursive:true});
  server = app.listen(3001,'127.0.0.1');
  browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHANNEL === 'chromium' ? {} : { channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' }), headless:true });
  context = await browser.newContext({ viewport:{width:1440,height:1050} });
  page = await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error' && !message.text().includes('status of 400') && !message.text().includes('status of 409')) errors.push(message.text());});
});
after(async () => {
  await browser?.close();
  if(hospitalId) await pool.execute('DELETE FROM hospitals WHERE id=?',[hospitalId]);
  // Recover fixture IDs if a browser assertion interrupted registration.
  await pool.execute('DELETE FROM hospitals WHERE email=?',[`ui-${run}@example.test`]);
  await pool.end(); if(server) await new Promise(resolve=>server.close(resolve));
});
test('sign-in and registration are usable and create a real empty hospital', async () => {
  await page.goto(base);
  await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
  await page.screenshot({path:'.runtime/screenshots/login-desktop.png',fullPage:true});
  assert.deepEqual((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations,[]);
  await page.getByRole('button',{name:'Create a workspace',exact:true}).click();
  await fill('name','Browser Test Hospital'); await fill('email',`ui-${run}@example.test`); await fill('phone','0123456789'); await fill('address','Browser test address'); await fill('password','Browser-test-password-2026');
  await page.getByRole('button',{name:'Create hospital account'}).click();
  await page.waitForURL('**/hospital-dashboard.html');
  await page.getByRole('heading',{name:'Ready for the day ahead.'}).waitFor();
  hospitalId = (await (await context.request.get(base+'/api/me')).json()).hospital.id;
  assert.equal(await page.getByText('Your wards will appear here').count(),1);
  await page.screenshot({path:'.runtime/screenshots/dashboard-desktop.png',fullPage:true});
  assert.deepEqual((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations,[]);
});
test('doctor creation, search, edit, duty toggle and reload persist', async () => {
  await page.getByRole('link',{name:'Doctors',exact:true}).click();
  await page.getByRole('button',{name:'Add doctor',exact:true}).click();
  await fill('name','UI Doctor'); await fill('specialty','General medicine'); await fill('license','UI-'+run); await fill('department','Outpatient'); await fill('room','OPD 1');
  await page.getByRole('button',{name:'Create record',exact:true}).click(); await saved();
  await page.getByRole('heading',{name:'UI Doctor',exact:true}).waitFor();
  await page.getByRole('button',{name:'Set on duty',exact:true}).click();
  await page.getByRole('button',{name:'Set off duty',exact:true}).waitFor();
  await page.reload(); await page.getByRole('button',{name:'Set off duty',exact:true}).waitFor();
  await page.getByRole('searchbox').fill('no-match'); await page.getByText('No matching records').waitFor();
  await page.getByRole('searchbox').fill('UI Doctor');
  await page.getByRole('button',{name:'Edit doctor',exact:true}).click(); await fill('room','OPD 2');
  await page.getByRole('button',{name:'Save changes',exact:true}).click(); await saved();
  await page.getByText('OPD 2',{exact:true}).waitFor();
  await page.screenshot({path:'.runtime/screenshots/doctors-desktop.png',fullPage:true});
});
test('ward validation keeps input and supports saving actual occupancy', async () => {
  await page.getByRole('link',{name:'Beds & wards',exact:true}).click();
  await page.getByRole('button',{name:'Add ward',exact:true}).click();
  await fill('name','UI Intensive Care'); await page.locator('[name="type"]').selectOption('icu'); await fill('capacity','10'); await fill('occupied','11');
  await page.getByRole('button',{name:'Create record',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Occupied beds cannot exceed capacity'}).waitFor();
  assert.equal(await page.locator('[name="name"]').inputValue(),'UI Intensive Care');
  await fill('occupied','3'); await page.getByRole('button',{name:'Create record',exact:true}).click(); await saved();
  await page.getByText('3 occupied',{exact:true}).waitFor();
  await page.screenshot({path:'.runtime/screenshots/beds-desktop.png',fullPage:true});
});
test('patient queue creates, starts, completes and cancels saved tokens', async () => {
  await page.getByRole('link',{name:'Patient queue',exact:true}).click();
  await page.getByRole('button',{name:'New patient token',exact:true}).click();
  await fill('patient','UI Patient'); await fill('reason','Routine visit');
  const doctors = (await (await context.request.get(base+'/api/doctors')).json()).items;
  await page.locator('[name="doctor_id"]').selectOption(doctors[0].id);
  await page.getByRole('button',{name:'Create record',exact:true}).click(); await saved();
  await page.getByRole('button',{name:'Start consultation',exact:true}).click();
  await page.getByRole('button',{name:'Complete',exact:true}).click();
  await page.getByText('No matching records').waitFor();
  await page.getByRole('combobox',{name:'Filter token status'}).selectOption('completed');
  await page.getByText('UI Patient',{exact:true}).waitFor();
  await page.getByRole('button',{name:'New patient token',exact:true}).click();
  await fill('patient','<img src=x onerror=alert(1)>'); await fill('reason','Escaped text check');
  await page.getByRole('button',{name:'Create record',exact:true}).click(); await saved();
  await page.getByRole('combobox',{name:'Filter token status'}).selectOption('active');
  await page.getByText('<img src=x onerror=alert(1)>',{exact:true}).waitFor();
  assert.equal(await page.locator('#records img').count(),0);
  await page.getByRole('button',{name:'Cancel',exact:true}).click(); await page.getByRole('button',{name:'Confirm',exact:true}).click(); await saved();
});
test('analytics exports real data and audit search works', async () => {
  await page.getByRole('link',{name:'Analytics',exact:true}).click();
  await page.getByRole('heading',{name:'Daily patient activity',exact:true}).waitFor();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button',{name:'Export CSV'}).click();
  assert.equal((await downloadPromise).suggestedFilename(),'unihealth-activity.csv');
  await page.getByRole('link',{name:'Audit log',exact:true}).click();
  await page.getByRole('searchbox').fill('tokens.created'); await page.getByRole('button',{name:'Search',exact:true}).click();
  await page.getByText('Server-recorded changes · 2 matching entries',{exact:true}).waitFor();
});
test('all pages fit desktop, tablet and mobile, including dark mode and reduced motion', async () => {
  for(const width of [1440,1024,768,375]) {
    await page.setViewportSize({width,height:900});
    for(const route of ['dashboard','doctors','beds','tokens','analytics','audit']) {
      await page.goto(`${base}/hospital-${route}.html`);
      await page.locator('#updated').filter({hasText:'Updated'}).waitFor();
      const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow,false,`${route} overflows at ${width}px`);
    }
  }
  await page.goto(`${base}/hospital-dashboard.html`); await page.getByText('Ready for the day ahead.').waitFor();
  await page.screenshot({path:'.runtime/screenshots/dashboard-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();
  await page.getByRole('link',{name:'Doctors',exact:true}).click();
  await page.getByRole('heading',{name:'UI Doctor',exact:true}).waitFor();
  await page.getByRole('button',{name:'Toggle light and dark theme',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.screenshot({path:'.runtime/screenshots/doctors-mobile-dark.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1050}); await page.goto(`${base}/hospital-dashboard.html`); await page.getByText('Ready for the day ahead.').waitFor();
  await page.screenshot({path:'.runtime/screenshots/dashboard-dark.png',fullPage:true});
  const accessibility = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
  assert.deepEqual(accessibility.violations,[]);
  assert.deepEqual(errors,[]);
});
test('keyboard modal escape restores focus and sign-out protects direct links', async () => {
  await page.getByRole('link',{name:'Doctors',exact:true}).click();
  const add = page.getByRole('button',{name:'Add doctor',exact:true});
  await add.focus(); await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'add-doctors');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.waitForURL('**/index.html');
  await page.goto(base+'/hospital-doctors.html');
  await page.waitForURL('**/index.html');
  await page.setViewportSize({width:375,height:812});
  await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'.runtime/screenshots/login-mobile.png',fullPage:true});
});
