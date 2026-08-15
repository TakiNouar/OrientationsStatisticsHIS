# 01 — Executive status

**Status:** Phase A operational + **Phase B0 analytics** on branch `feature/b0-analytics` (2026-08-15).

## Done

- Offline Express API + SQLite (no Docker)
- 8 HIS licence seeds; fixed BAC grade slots; génie option + bias
- Engine locked: **50% academic / 30% RIASEC / 20% technical fit** (+ génie bias)
- Academic multipliers from seed weights (×0.6–×1.8); **no stream μ**
- Missing subject weight → **specialty average mapped multiplier** (not fixed 0.75)
- Wizard + FR default i18n toggle + scoring debug panel
- API: helmet, CORS allow-list, rate limit on calculate, dotenv, structured logger, safe persist
- CSV export filters: `from`, `to`, `bacStream` (+ `specialtyCode`, anonymized default)
- Client fetch timeout (10s) + config retry
- Repo hygiene: root `.gitignore`, removed prompt PDF & Vite dead assets
- `DEPLOYMENT.md` (Windows-first LAN)
- **B0 analytics:** anonymized summary counts, recent sessions table, filters, anonymized CSV; UI toggle Orientation ↔ Statistiques

## Explicitly skipped

- Automated test suite (product decision retained: **no tests**)
- Phase B1 charts, B2 auth/Postgres
- Formula / seed weight *values* unchanged except missing-affinity policy
