# Run The Coin Fix on a Mac

## 1. Install requirements once

Install Node.js **24.x, at least 24.12** (Apple Silicon or Intel installer matching your Mac) from https://nodejs.org/en/download. This project has been tested with 24.12.0. Node 22/25 are outside this project's supported range. SQLite is included with Node; no MySQL, Docker or external database is needed locally.

Open Terminal and verify:

```sh
node --version
npm --version
git --version
```

If Git is missing, macOS may offer the Command Line Tools installer. A recent Chrome, Edge or Safari with IndexedDB and Web Crypto is required. Use a normal browser profile.

## 2. Get the project

```sh
cd ~/Documents/Codex
git clone https://github.com/cgonzalez2064/the-coin-fix.git
cd the-coin-fix
npm ci
cp .env.example .env
npm run db:check
```

Skip cloning when already working in the prepared local repository folder. Run subsequent commands from the directory containing package.json. `.env` is ignored by Git. The auth/seed/database commands load it automatically; VITE_ variables are always public and must never contain secrets.

## 3. Start the two services

Terminal A (leave open):

```sh
npm run auth
```

Terminal B, in the same project folder (leave open):

```sh
npm run dev
```

Open **http://127.0.0.1:5175/**. Auth listens on 127.0.0.1:3001; Vite forwards /api/auth requests. Keep APP_ORIGIN in .env as http://127.0.0.1:5175. Both servers listen only on your Mac.

If 5175 or 3001 is already occupied by the previous project, use those existing servers or stop them with Ctrl+C in their original terminals before starting the new copy. Vite deliberately refuses to change ports. Do not run duplicate copies on these ports.

## 4. Choose a local account

A fresh clone has no accounts, passwords or personal financial records. Use the local registration UI for an isolated account, or create an administrator using the server's bootstrap command. Do not publish that identity database.

To bootstrap an owner, enter credentials interactively in zsh; the password is not placed in the shell command history:

```sh
read 'DEMO_EMAIL?Local account email: '
read -s 'DEMO_PASSWORD?Local account password: '
printf '\n'
export DEMO_EMAIL DEMO_PASSWORD
npm run auth:seed
unset DEMO_EMAIL DEMO_PASSWORD
```

Use a unique password. This command creates an owner once and does not reset an existing password. Credentials are hashed by the service. For real-data testing prefer signing into your account rather than guest mode; guest is a separate budget. CAPTCHA and enabled MFA are additional steps after credentials. See AUTH_AND_SETUP.md for MFA and production limitations.

## 5. Preserve your existing real data

Before switching folders or runtimes, export a financial JSON backup from the current app's Settings. Store it **outside the repository**, in a protected folder. Backups contain readable financial information; checksum detects corruption but does not encrypt them.

Financial records live in browser IndexedDB, not Git. Keep the exact URL http://127.0.0.1:5175, browser profile and account identity to reuse them. localhost, preview port 4173, a different browser and a different user ID are separate stores. A newly registered account with the same email in a new SQLite file has a new ID; import your financial backup into that account explicitly.

To continue using the existing identity without copying credentials, point AUTH_DATA_DIR in your private .env to the existing server/data directory. Never run two identity servers against the same directory. This setting stays local. Alternatively, stop the old identity server and follow BACKUP_AND_RECOVERY.md to preserve both auth.sqlite and mfa.key together. Never copy live SQLite files without the WAL/backup procedure.

Do not clear site data or delete the old folder until a backup has been checked. The clean repository's neutral defaults do not replace an initialized budget. Optional shared mode uploads to your local identity service only when explicitly activated; do not activate it merely to test the UI.

## 6. Test with real data

Start with accounts and their manual opening balances, categories and monthly limits, income schedules, debts/APRs and goals. Record a real expense and income, check account balances and current-month graphs, edit a category, verify recurring forecasts, and export another backup. Scheduled receipts are not actual income until recorded. Check currency and historical FX on USD transactions.

Protect your Mac and browser profile. Login does not encrypt IndexedDB. No telemetry or AI keys are required; automatic FX is optional. You can use manual FX and the UI without cloud services.

## 7. Daily start, stop and edits

Start auth and dev as in step 3. Stop each with Ctrl+C. Financial records remain stored. Edit src/; Vite reloads the interface. Keep runtime data and private backups outside version control. Changes to the public seed do not reset existing records.

```sh
npm run check
npm run build:public
```

`check` runs lint, financial/storage tests, authentication/permissions tests, TypeScript and a production build. Tests use synthetic records and temporary SQLite. No real accounts or movements are used by tests.

For production/PWA preview, first build. Stop auth and restart it for the preview origin:

```sh
APP_ORIGIN=http://127.0.0.1:4173 npm run auth
```

In another terminal:

```sh
npm run preview -- --port 4173 --strictPort
```

Preview has a separate financial store. Development mode is best for continuing changes. Namecheap is not needed for any of these local steps; deploy only after local review using DEPLOY_NAMECHEAP.md and DATABASE_AND_STELLAR_PLUS.md.

## Troubleshooting

- Connection refused on login: auth must be running in Terminal A.
- Origin/CSRF error: confirm the exact APP_ORIGIN and restart auth; use 127.0.0.1 consistently.
- No debts after login: check account, private/shared/guest budget and origin before importing a backup. Do not clear data to solve this.
- Port occupied: stop the previous service; do not change ports while testing real data.
- MFA/key error: restore mfa.key with the corresponding identity database.
- SQLite experimental warning on Node 24.12: expected; it does not mean the database failed. db:check verifies local write/read capability.
- Dependency install problems: confirm Node version and use npm ci with the committed package lock.
