# 01 — Executive status

**Status:** Phase A operational + Phase B0/B1 analytics **on `main`**. Hardening 2026-08-16: DELETE auth, DB init cleanup.

## Done

### Phase A
- Offline Express API + SQLite
- Scoring engine + wizard (FR/EN) + persist + career paths

### Phase B0/B1
- Analytics nav, filters, summary, recent students, profiles
- Dashboard charts / matrix / data-quality
- CSV export (named or anonymized)

### Security / ops
- DELETE requires `ADMIN_TOKEN` (`X-Admin-Token`); UI prompts once per session
- `createTables` only via `initDatabase`
- Windows: `npm run rebuild:native` + postinstall check

## Optional next (B2)
- Full logins/roles, retention, capacity planning, auth on read routes
