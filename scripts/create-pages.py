from pathlib import Path
root = Path(__file__).resolve().parents[1]
pages = {'index.html': ('auth', 'Sign in'), 'hospital-dashboard.html': ('dashboard', 'Overview'), 'hospital-doctors.html': ('doctors', 'Doctors'), 'hospital-beds.html': ('beds', 'Beds &amp; wards'), 'hospital-tokens.html': ('tokens', 'Patient queue'), 'hospital-analytics.html': ('analytics', 'Analytics'), 'hospital-audit.html': ('audit', 'Audit log')}
for filename, (page, title) in pages.items():
    (root / filename).write_text(f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="description" content="UniHealth hospital workspace for care teams, bed capacity, and patient flow."/>
  <title>{title} · UniHealth</title>
  <link rel="icon" href="data:,"/>
  <link rel="stylesheet" href="/hospital-style.css"/>
  <script src="/app.js" defer></script>
</head>
<body data-page="{page}">
  <div id="app"><div class="loading" role="status">Opening UniHealth…</div></div>
  <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
  <noscript>Enable JavaScript to use your hospital workspace.</noscript>
</body>
</html>
''', encoding='utf-8')
