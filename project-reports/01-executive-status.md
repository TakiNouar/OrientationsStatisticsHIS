# 01 — Executive status

**Status:** Phase A operational + **Phase B0/B1 analytics complete** (branch `feature/b0-analytics`, 2026-08-16).

## Done

### Phase A (core)

- Offline Express API + SQLite (no Docker)
- Weighted scoring engine: academic + RIASEC + technical fit + génie bias
- 3-step React wizard (FR/EN)
- Persist evaluations to SQLite

### Phase B0 (minimal analytics)

- Header nav: Orientation ↔ Analytics
- Filters: date range, BAC stream, top specialty
- Summary aggregates (sessions, stream, specialty, match labels)
- **Named** recent students list (click → full profile)
- Profile: grades, RIASEC, ranked specialty results
- CSV export (named default; `anonymized=1` optional)

### Phase B1 (staff dashboard)

- KPI cards (sessions, avg score, avg BAC, high scores)
- Charts: volume by day, score histogram, match-label donut
- Stream × specialty heatmap (rank-1)
- Data-quality signals (low/high scores, never rank-1, missing RIASEC)

### UX / ops polish (same branch)

- Light / dark / system theme toggle
- Soft blue adaptive surfaces + readable contrast
- Delete student profile (list + detail) with confirm; CASCADE in DB
- Recent table simplified to **name · date · top specialty** (+ delete)

## Next (optional)

- Merge `feature/b0-analytics` → `main` (see [12-phase-b-branch-summary-merge-ready.md](./12-phase-b-branch-summary-merge-ready.md))
- Phase B2: auth, roles, retention, multi-user hardening
