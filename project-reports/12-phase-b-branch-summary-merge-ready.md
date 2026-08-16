# 12 — Phase B branch summary (merge-ready)

**Branch:** `feature/b0-analytics`  
**Parent (main tip before branch):** `5a339213e9ecdf71befabdeadda2dd7466f99b39`  
**Status:** Phase **B0 + B1 complete** + UX polish (theme, delete, simplified list). Ready to merge to `main` after local smoke test.

**Tip of branch (at doc write):** see latest commit on `feature/b0-analytics`.

---

## Product outcome

| Layer | What shipped |
|-------|----------------|
| **B0** | Analytics nav, filters (date / stream / specialty), summary counts, named recent sessions, CSV export, student **profile** page |
| **B1** | Dashboard charts (volume, score buckets, match-label donut, stream×specialty matrix), data-quality signals |
| **Ops UX** | Light / dark / system theme; **delete** student (cascade); blue adaptive UI; list = name + date + top specialty |

**Privacy note:** Sessions are **named** by design (counsellor LAN). Anonymized CSV still available via `anonymized=1`.

---

## API (new / changed)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/analytics/summary` | Totals + breakdowns (rank-1 sessions) |
| GET | `/api/v1/analytics/recent` | Named session list |
| GET | `/api/v1/analytics/dashboard` | Volume by day, score buckets, matrix, data quality |
| GET | `/api/v1/analytics/students/:id` | Full profile (grades, RIASEC, ranked matches) |
| DELETE | `/api/v1/analytics/students/:id` | Delete student + cascade grades / RIASEC / evaluations |
| GET | `/api/v1/export/evaluations?format=csv` | CSV; default **named** (`anonymized=0`) |

Shared filters: `from`, `to`, `bacStream`, `specialtyCode`.

---

## Frontend

- Header: **Orientation** | **Analytics**, language, **theme** (☀ / ☾ / ◐)
- `AnalyticsPage`: filters, dashboard panel, simplified recent table, profile detail + delete
- `AnalyticsDashboard`: SVG charts (no extra chart npm deps)
- Theme: class `dark` on `<html>`, `localStorage` key `his-sre-theme`
- Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *));`

---

## Key files

| Path | Role |
|------|------|
| `server/src/db.ts` | Analytics queries, profile, export |
| `server/src/analytics-dashboard.ts` | B1 aggregates |
| `server/src/student-delete.ts` | DELETE student |
| `server/src/index.ts` | Routes |
| `client/src/components/AnalyticsPage.tsx` | Stats UI |
| `client/src/components/AnalyticsDashboard.tsx` | Charts |
| `client/src/lib/theme.ts` | Theme helpers |
| `client/src/lib/api.ts` | Client API including DELETE |
| `client/src/i18n/strings.ts` | FR/EN |

---

## Merge checklist (before `main`)

1. Pull `feature/b0-analytics`, restart **server** + **Vite**
2. Run one evaluation in wizard → appears in Analytics
3. Open profile, confirm scores / grades
4. Delete one test profile → disappears from list + dashboard counts update
5. Toggle theme light/dark/system
6. CSV download opens with names
7. Optional: `git log main..feature/b0-analytics --oneline`

Merge suggestion:

```bash
git checkout main
git pull
git merge feature/b0-analytics
# or: open a PR feature/b0-analytics → main
git push origin main
```

---

## Explicitly out of scope (Phase B2+)

- Logins / roles / multi-user hardening
- Retention policy automation
- Capacity planning
- Auth on DELETE (LAN trust model for now)

---

## Related docs

- [10-phase-b0-analytics.md](./10-phase-b0-analytics.md)
- [11-phase-b1-dashboard.md](./11-phase-b1-dashboard.md)
- [01-executive-status.md](./01-executive-status.md)
- [08-remaining-work.md](./08-remaining-work.md)
