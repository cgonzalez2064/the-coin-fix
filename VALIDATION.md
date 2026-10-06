# Sanitized repository validation

2026-10-06: two successful rounds of lint, TypeScript, 50 frontend/data tests and 21 backend tests (71 per round), production build and public build. The second round used a clean npm ci installation rather than packages reused from another folder. npm ci reported zero audit vulnerabilities at that time. SQLite readiness check passed without touching existing identity databases.

Application defaults are neutral. Test fixtures use synthetic employers, loans and amounts and are not imported into the runtime bundle. Tests for owner/guest isolation, backups, calculations, permissions, authentication and MFA use temporary data. Personal source seeds, financial reports, screenshots, identity databases and environment secrets were excluded before the initial Git commit. The 94 staged source/documentation files were scanned for known private markers and common credential patterns; no matches were found. Commit identity uses a noreply email. This review is not an external security audit.

The original local project and private browser data remain intact. Follow MAC_LOCAL_SETUP.md before switching runtimes or accounts. GitHub publication does not deploy to Namecheap or upload financial runtime data.
