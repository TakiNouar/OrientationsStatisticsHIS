# 10 — Phase B0 analytics

**Status:** Implemented on branch `feature/b0-analytics` (2026-08-15).

## Scope (B0 – Minimal)

| Feature | Included |
|---------|----------|
| Anonymized session table (no student names) | Yes |
| Total evaluation session counts | Yes |
| Counts by BAC stream | Yes |
| Counts by top specialty (rank = 1) | Yes |
| Counts by match label (derived from final_score) | Yes |
| Filters: `from`, `to`, `bacStream`, `specialtyCode` | Yes |
| Anonymized CSV export (default) | Yes |
| Charts | No (B1) |
| Auth / roles | No (B2) |

## Privacy policy (B0)

- Analytics UI and default CSV **never** return `full_name`.
- Session reference = first 8 characters of internal `students.id`.
- Named CSV still available with `anonymized=0` for local counsellor use only.

## Definitions

- **Session** = one persisted calculate call = one `students` row.
- **Top specialty** = `match_evaluations.rank_position = 1`.
- **Match label** = derived via `labelFromFinalScore(final_score)` (not stored in DB).

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/analytics/summary` | Aggregates + filters |
| GET | `/api/v1/analytics/recent` | Anonymized rank-1 rows (`limit` default 50) |
| GET | `/api/v1/export/evaluations?format=csv` | `anonymized=1` default; `anonymized=0` includes names; `specialtyCode` supported |

Query params shared: `from`, `to`, `bacStream`, `specialtyCode`.

## UI

Header toggle: **Orientation** ↔ **Statistiques / Analytics**. No extra router dependency.

## Rollback commits (feature/b0-analytics)

| SHA | Message |
|-----|---------|
| `5a339213e9ecdf71befabdeadda2dd7466f99b39` | **main baseline** (pre-B0) |
| `09b960242d985172293df0e6bbcc119785790fbc` | db analytics queries + anonymized CSV |
| `857cc1677fa90669431ac036634bb4238e3a88c7` | API endpoints |
| `ce6ceb9b6eb3192c965077718bd7b2296db4e6e0` | client api/types/AnalyticsPage |
| `e9e893995aa5cbfb5cb873109c644029b6a2f99f` | App nav + i18n |
| (this docs commit) | documentation |

To discard all B0 work and return to Phase A only:

```bash
git checkout main
# or reset the feature branch:
git checkout feature/b0-analytics
git reset --hard 5a339213e9ecdf71befabdeadda2dd7466f99b39
```

## Out of scope (still)

- B1 charts / heatmaps
- B2 logins, roles, retention jobs, Postgres
