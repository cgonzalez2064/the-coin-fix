# The Coin Fix

A local-first personal finance PWA built with React, TypeScript, Vite, Tailwind CSS and Dexie/IndexedDB. Spanish/English, four themes, responsive budgeting, cash-flow planning, debts, savings and optional shared budgets.

**Start here:** [Mac setup, step by step](MAC_LOCAL_SETUP.md). This public repository has neutral app defaults and synthetic tests. It contains no personal financial seed, credentials or runtime database.

## Run locally

Requires Node 24.x, at least 24.12, and npm. SQLite is included with Node.

```sh
npm ci
cp .env.example .env
npm run db:check
```

In separate terminals, from this folder:

```sh
npm run auth
```

```sh
npm run dev
```

Open http://127.0.0.1:5175/. Servers bind only to loopback. A fresh clone contains no user accounts; see the Mac guide for registration or local owner bootstrap. Guest mode uses a separate budget.

## Features

- Dashboard with received income, actual spending, cash flow, allocations and savings.
- Transactions, manual accounts, GTQ/USD and historical transaction FX.
- Budget cards, saved drag/keyboard ordering, separate category/group editors.
- Income sources, scheduled receipts, recurring templates and cash-flow calendar.
- Debts, optional installments, targeted payments and payoff simulations.
- Savings, emergency and investment goals with contribution projections.
- Editable household members and shared-budget administrator/contributor/expense-entry roles.
- Validated JSON backup/import and CSV export.
- Login, CAPTCHA, optional MFA and server-enforced shared permissions.
- Offline PWA shell in production builds; manual FX works without external services.

## Commands

| Purpose | Command |
|---|---|
| Install locked dependencies | `npm ci` |
| Identity service | `npm run auth` |
| Development UI | `npm run dev` |
| SQLite readiness | `npm run db:check` |
| Frontend/data tests | `npm test` |
| Authentication/permissions tests | `npm run test:auth` |
| Lint | `npm run lint` |
| All checks and build | `npm run check` |
| Production build | `npm run build` |
| Public hosting build | `npm run build:public` |
| Build preview | `npm run preview -- --port 4173 --strictPort` |

Preview requires a build first and a separate auth origin configuration. Follow the Mac guide; 4173 has a different browser database from 5175.

## Data and security

Browser IndexedDB stores private budgets by identity and origin. Login does not encrypt it. SQLite stores identity and optional shared-budget data. Shared mode must be activated explicitly; local records are otherwise not sent to the server. No telemetry or AI credentials are required. Remote FX is optional and disabled by default.

Keep .env, databases, MFA keys, real financial exports and screenshots out of Git. [GITHUB_AND_PRIVACY.md](GITHUB_AND_PRIVACY.md) explains the review process. A public repository does not deploy your application or upload local runtime data.

Production registration remains blocked until verified email and recovery are implemented. This app does not connect to banks, execute real payments, import statement CSVs or implement an AI provider. JSON backups replace the destination budget. Unknown APRs cannot produce a reliable debt payoff forecast. Shared snapshots currently have size/concurrency limits documented in the architecture guide.

## Documentation

- [Mac installation and daily use](MAC_LOCAL_SETUP.md)
- [Tech stack and compatibility](TECH_STACK.md)
- [Architecture](ARCHITECTURE.md) and [data model](DATA_MODEL.md)
- [Security](SECURITY.md), [authentication/MFA](AUTH_AND_SETUP.md)
- [Backup and recovery](BACKUP_AND_RECOVERY.md)
- [Shared budgets and roles](SHARED_BUDGET.md)
- [Categories and groups](CATEGORY_MANAGEMENT.md)
- [Income and cash flow](INCOME_AND_CASHFLOW.md)
- [Budget and projections](BUDGET_AND_PROJECTIONS.md)
- [Themes and installments](CATEGORIES_THEMES_AND_INSTALLMENTS.md)
- [Namecheap deployment](DEPLOY_NAMECHEAP.md) and [Stellar Plus/database options](DATABASE_AND_STELLAR_PLUS.md)
- [Contributing](CONTRIBUTING.md), [validation](VALIDATION.md), [feature proposals](FINANCIAL_FEATURES.md)

Deploy to Namecheap only after local review. Upload the public build output, never the project root, identity database or environment files.
