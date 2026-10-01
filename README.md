# UniHealth Hospital Management

A hospital operations workspace backed by Node.js and **MySQL 8.4**. The seven redesigned pages share one accessible interface and authenticated API. Firebase and browser-only demo records have been removed. There are no seeded accounts, doctors, wards, or patients.

## Open the website on this machine

The project has a dedicated local MySQL instance at `127.0.0.1:3307`. Its files are in ignored `.runtime/mysql-data`; random database credentials are saved in ignored `.env`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-mysql.ps1
npm run db:init
npm start
```

Open **http://localhost:3000** and choose **Create a workspace**. Registration creates a hospital administrator account and shows the assigned hospital ID in the workspace footer. You can sign in with either that ID or the administrator email. Passwords require at least 12 characters.

`npm run db:init` only creates missing tables. It does not erase records or insert sample data. Do not open the HTML files directly or with a static-only server: the application needs its Node.js API.

## Set up on another machine

Requirements: Node.js 22 or newer, npm, and either MySQL 8.4 or Docker with Compose.

1. Run `npm ci`.
2. Copy `.env.example` to `.env`. Replace both password placeholders with different, strong random passwords.
3. Start MySQL using `docker compose up -d`. Wait until `docker compose ps` reports healthy. Docker creates the empty database and its application user.
4. Run `npm run db:init`, then `npm start`.
5. Open http://localhost:3000 and register your hospital.

For an existing MySQL server, create an empty `unihealth` database and a dedicated user with permissions on that database; then set `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD`. The SQL schema is in `server/schema.sql`.

The native Windows setup script starts the installed MySQL Server 8.4 binary with a project-specific data directory. `scripts/bootstrap-local.js` was used once to create this machine's empty databases and secure its new root account. It refuses to overwrite an existing `.env`; it is not a migration or reset command.

## Working features

| Area | Behavior |
| --- | --- |
| Authentication | Salted scrypt password hashes, MySQL-backed sessions, HttpOnly/SameSite cookies, rate-limited account endpoints, server-side logout |
| Hospital status | Normal, busy, overloaded, or emergency; saved centrally and retrieved on refresh |
| Doctors | Create, edit, remove, search, set duty status, and store specialty, license, contact, department, room, and shift times |
| Beds and wards | General, emergency, and ICU wards with validated capacity/occupancy; derived availability; occupied wards cannot be deleted |
| Patient queue | Hospital-local daily token numbers, priority ordering, optional doctor assignment, waiting → in consultation → completed, and cancellation |
| Dashboard | Actual available beds, ICU capacity, on-duty doctors, waiting patients, elapsed wait, completions today, and recent activity |
| Analytics | Actual daily arrivals, completed/cancelled visits, wait to consultation, CSV export, and recorded bed capacity snapshots |
| Audit | Server-generated changes with administrator, timestamp, search, and pagination |

Every hospital query is scoped to the authenticated hospital. Concurrent changes use transactions and version checks. A doctor cannot start two consultations at once, go off duty during a consultation, or be deleted with active queue entries. Completed and cancelled tokens retain their history.

The hospital timezone is **Asia/Kolkata**. MySQL session timestamps are explicitly UTC. Shift times are descriptive; duty status is controlled manually, including overnight shifts. Queue priority is chosen by the administrator. No automatic clinical recommendations are generated.

Records refresh on page load, after a saved change, or when **Refresh** is selected. This is not a push notification or streaming system. Analytics show recorded activity; missing historical observations are not invented.

## Configure email recovery

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `.env`, then restart the application. Set `APP_ORIGIN` to the exact URL used to open the application.

The recovery email includes the hospital ID and a random, single-use password reset link valid for 30 minutes. Resetting the password revokes existing sessions. There are no fixed OTPs or demo recovery codes. Without an SMTP host and sender, the server reports that recovery is unavailable. External email delivery must be verified with your provider after configuration; it has not been configured on this machine.

## Verify changes

Tests use **unihealth_test**, never the live `unihealth` database. To create the test database on a fresh Docker or MySQL installation:

```powershell
node --env-file=.env scripts/setup-test-db.js
npm test
```

The browser suite uses Microsoft Edge by default. Install Edge, or install Playwright Chromium with `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium` for the test process. Port 3001 must be available. The regular website can continue running on port 3000.

- 15 API integration tests cover authentication, data isolation, concurrency, validation, queue transitions, timestamps, recovery tokens, and session revocation.
- Browser tests exercise registration, forms, searches, actual saved records, queue actions, export, responsive widths, light/dark themes, keyboard focus, and sign-out.
- Automated accessibility checks cover sign-in and light/dark dashboard views. These are focused checks, not a claim of full accessibility certification.
- Test fixtures are deleted after each suite. Screenshots are written only to ignored `.runtime/screenshots/`.
- `npm audit` checks dependency advisories.

## Deployment and data ownership

This configuration runs locally on loopback. It is not a public deployment. For a hosted environment, put an HTTPS reverse proxy in front of the app, set `NODE_ENV=production` for Secure cookies, set the exact `APP_ORIGIN`, provide SMTP, and arrange access controls and database backups appropriate to your hospital. The current model provides one administrator account per hospital; staff roles and patient self-service are outside this version.

Only allowlisted HTML, CSS, and browser JavaScript files are served. `.env`, database files, server source, and tests are not public. Credentials, runtime data, test screenshots, and editor files are excluded from Git.

The old remote Firebase database was **not changed or erased**. This application no longer accesses it. A backup of the pre-migration working files on this machine was saved under `C:/Users/jmohi/AppData/Local/UniHealthBackups/` before replacement. Git history retains the previous committed implementation.
