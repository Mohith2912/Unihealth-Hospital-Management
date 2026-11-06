import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const basePath = 'e:/Uni-Health/UniHealth Hospital Management';

const routes = [
  'hospital-dashboard.html',
  'hospital-doctors.html',
  'hospital-beds.html',
  'hospital-tokens.html',
  'hospital-analytics.html',
  'hospital-audit.html',
  'hospital-emergency.html',
  'hospital-care-notes.html',
  'hospital-settings.html'
];

test('all hospital navigation route HTML templates exist and include core meta and styles', () => {
  for (const route of routes) {
    const fullPath = join(basePath, route);
    assert.ok(existsSync(fullPath), `Route template ${route} must exist on disk`);
    const content = readFileSync(fullPath, 'utf8');
    assert.match(content, /<!doctype html>/i, `${route} must include HTML5 doctype`);
    assert.match(content, /<meta name="viewport"/i, `${route} must include viewport meta tag`);
    assert.match(content, /hospital-style\.css/, `${route} must link hospital-style.css`);
  }
});

test('high-fidelity graphic assets exist and are referenced appropriately', () => {
  const assets = [
    'assets/hospital-sidebar-building.svg',
    'assets/hospital-welcome-facility.svg',
    'assets/icu-operating-theater.svg',
    'assets/admin-avatar.svg'
  ];

  for (const asset of assets) {
    const fullPath = join(basePath, asset);
    assert.ok(existsSync(fullPath), `Asset ${asset} must exist in assets folder`);
    const content = readFileSync(fullPath, 'utf8');
    assert.match(content, /<svg/i, `${asset} must be a valid SVG document`);
  }
});

test('operational mode switcher buttons provide proper state transitions and status synchronization', () => {
  const appJs = readFileSync(join(basePath, 'app.js'), 'utf8');
  assert.match(appJs, /async function setHospitalStatus\(status\)/, 'app.js must implement setHospitalStatus');
  assert.match(appJs, /applyHospitalStatusLocally\(status\)/, 'app.js must implement local mode transition');
  assert.match(appJs, /dataset\.hospitalStatus\s*=\s*status/, 'app.js must set dataset.hospitalStatus attribute');
  assert.match(appJs, /data-mode="normal"/, 'app.js must provide normal mode switch option');
  assert.match(appJs, /data-mode="busy"/, 'app.js must provide surge mode switch option');
  assert.match(appJs, /data-mode="emergency"/, 'app.js must provide emergency mode switch option');
  assert.match(appJs, /BroadcastChannel\('unihealth_status'\)/, 'app.js must synchronize status across portals via BroadcastChannel');
});
