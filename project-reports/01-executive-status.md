# 01 — Executive status

**Updated:** 2026-08-18  
**Status:** Phase A + Phase B0/B1 **on `main`**, operational. Google Sheets live mirror shipped. Engine includes preference + specialty-dependent academic slots.

## Done

### Phase A — orientation wizard
- Offline Express API + SQLite (`better-sqlite3`)
- Scoring engine with locked formula (see `05-math-engine.md`)
- 3-step wizard (FR/EN), brass/ink UI, career paths on results
- Persist each analysis (student, grades, RIASEC, ranked matches)
- Required **preferred HIS specialty** (5% soft boost)
- Specialty-dependent academic slots (model **A/2**)

### Phase B0/B1 — analytics
- Analytics nav, filters, summary, recent sessions, student profiles
- Dashboard charts / matrix / data-quality
- CSV export (named or anonymized)
- DELETE requires `ADMIN_TOKEN` (`X-Admin-Token`)

### Google Sheets mirror (optional)
- Full-table resync from SQLite after persist / delete / every 5 min
- Columns **A–P** (preferred specialty + top-3 matches)
- Idempotent styling (reset formats + bands every resync)
- Brass highlight when preferred === Specialty #1
- `technical_option` persisted and exported
- DB is **never** wiped by sheet logic

### Security / ops
- Helmet, CORS allowlist, rate limit on calculate
- `createTables` only via `initDatabase`
- Windows: native rebuild for `better-sqlite3` when needed

## Explicitly out of scope (for now)
- Docker / Postgres
- Automated unit tests (product decision)
- Phase B2 full auth on read routes / multi-tenant roles

## Optional next
- Counsellor feedback loop for seed weights
- Single-port serve of `client/dist`
- Backups of `server/data/his-sre.db`
- Debounce Sheets resync under submission bursts
