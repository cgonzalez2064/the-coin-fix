# Data model

The runtime schema lives in src/model.ts and is validated with Zod. Entities include accounts, categories, recurring sources, debts and goals. Transactions have UUIDs, date, type, amount, currency and a historical FX rate. Events are scheduled forecasts, not bank receipts.

IndexedDB stores each local budget separately. SQLite stores identities, encrypted MFA secrets, hashed sessions and optional shared-budget snapshots. Financial data remains local unless shared mode is explicitly enabled. Roles are checked by the server.

Category.active controls future selection and planned limits; history remains counted. Amounts are converted using the transaction FX for historical spending and current FX for projections. Transfers conserve total cash; targeted payments reduce debt; contributions are distinct from spending. Unknown APRs prevent a fabricated payoff forecast.

Default app data is neutral. src/test-fixtures.ts contains synthetic test records only. No personal seed or user database is distributed in this repository.
