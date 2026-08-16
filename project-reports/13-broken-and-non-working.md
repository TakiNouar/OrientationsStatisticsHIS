# 13 — Broken and non-working items

**Repo:** `TakiNouar/OrientationsStatisticsHIS`  
**Branch scanned:** `main`  
**Tip SHA:** `f37de89ef6ded0c6cfd50a1fa1703155a314d387`  
**Scan date:** 2026-08-16  
**Method:** Static code inspection (not a live runtime test suite).

Severity: **P0** = product feature dead · **P1** = will break when feature is used · **P2** = docs/ops drift · **P3** = minor / latent.

---

## P0 — Critical (user-visible dead features)

### 1. Analytics page renders nothing

| Field | Detail |
|-------|--------|
| **File** | `client/src/components/AnalyticsPage.tsx` |
| **Size** | ~1.2 KB (stub) |
| **Behaviour** | `export function AnalyticsPage(...) { return null; }` |
| **Impact** | Header **Statistiques / Analytics** opens an empty panel. No filters, charts, student list, profiles, or delete UI. |
| **Evidence** | File comment: *“This stub should not ship. Real file is 21k — push failed size limits mid-session.”* Suggests restore from history (e.g. around `421ac416` / last good full page). |
| **Also broken as a consequence** | Student profiles, recent sessions table, CSV button in UI, dashboard wiring, admin-token delete prompts — all live only in the missing UI. |

**Backend analytics routes still exist** (`/analytics/summary`, `/dashboard`, `/recent`, `/students/:id`, DELETE). The API layer is not the P0 failure; the **client shell is**.

---

## P1 — Will fail when Analytics UI is restored (contract / i18n mismatches)

### 2. `/analytics/recent` response shape ≠ client type

| Side | Shape |
|------|--------|
| **Server** (`server/src/index.ts`) | `{ sessions: SessionListRow[], filters }` |
| **Client type** (`AnalyticsRecentResponse`) | `{ rows: SessionListRow[], filters, limit }` |

Any restored UI that does `recent.rows.map(...)` will see **`undefined`** and crash or show an empty list even when the API returns data. Must align on one key (`rows` **or** `sessions`) and optionally restore `limit` in the JSON.

### 3. Missing i18n keys used by `AnalyticsDashboard.tsx`

`AnalyticsDashboardPanel` reads these from `strings[lang]`, but they are **absent** from current `client/src/i18n/strings.ts` (FR and EN):

- `totalSessions`
- `dashboardTitle`
- `volumeByDay`
- `scoreBuckets`
- `byMatchLabel`

**Impact once the page mounts the panel:** runtime access to missing properties → blank KPI titles / chart titles (or TypeScript errors if strict checking is enforced in CI). Keys that *do* exist and are used elsewhere on the dashboard (e.g. `avgFinalScore`, `dataQuality`) are fine.

### 4. Delete + admin token UI cannot run

| Layer | Status |
|-------|--------|
| Server `requireAdminToken` on DELETE | Implemented |
| Client `deleteStudentProfile` + `X-Admin-Token` | Implemented in `api.ts` |
| UI prompt for token / confirm delete | **Only existed in full AnalyticsPage** (now stubbed) |

So delete is **API-ready, UI-dead**. With `ADMIN_TOKEN` set, raw API delete without header → **401**. With token unset in production → **503**. Dev without token still allows DELETE (by design in `admin-auth.ts`).

### 5. `ConfigResponse` type incomplete vs server

Server `/config` includes `adminAuthRequired: boolean`. Client `ConfigResponse` in `types.ts` does **not** declare it. Not fatal for the wizard; any future UI that branches on `config.adminAuthRequired` will be poorly typed / ignored.

---

## P2 — Documentation and product messaging out of date

### 6. Root `README.md` describes obsolete B0 behaviour

Still says:

- Phase B0 **anonymized** analytics  
- Recent sessions **without student names**  
- CSV **anonymized by default**  
- Work lives on branch `feature/b0-analytics`

**Actual product (intended):** named sessions, named CSV by default, B1 dashboard, theme toggle, admin-protected delete, merged to `main`. Readers following the README will configure the wrong expectations.

### 7. Several `project-reports/*` lag current architecture

Examples:

- Modular `server/src/db/*` split not fully reflected in older backend/DB reports  
- Report **12** was shortened to a stub note  
- Executive / remaining-work docs may still assume pre-refactor monolithic `db.ts`

Not runtime-breaking; harms ops and handoff.

---

## P3 — Latent / environmental (not necessarily “broken code”)

### 8. `ADMIN_TOKEN` unset on shared LAN

If staff deploy without setting `ADMIN_TOKEN`:

- **Production:** DELETE disabled (503) — safe but feature unavailable  
- **Development:** DELETE open — unsafe if the same mode is used on a shared network  

Documented in `STABILITY.md` / `.env.example`; still an operational footgun.

### 9. Native module `better-sqlite3`

Windows installs can fail without VS C++ build tools / rebuild scripts (`STABILITY.md`). Symptom: server will not start. Environment-dependent, not a logic bug in app source.

### 10. Persist failures are silent to the user

`POST /recommendations/calculate` returns scores even if `persistEvaluation` fails in `queueMicrotask` (error only logged). User sees success; session never appears in analytics once analytics works again. Pre-existing design, still a reliability gap.

### 11. No automated tests

Explicit product decision historically. Regressions (like the AnalyticsPage stub) are not caught by CI.

### 12. Stale feature branch

`feature/b0-analytics` still points at pre-merge tip. Harmless if ignored; confusing if someone continues work there instead of `main`.

---

## What still appears intact (for contrast)

These were not found broken by static scan:

| Area | Notes |
|------|--------|
| Wizard flow (Step1–3) | Components present; App still wires them |
| Scoring engine | `engine.ts` present |
| DB modular layer | `server/src/db/*` + barrel `db.ts` |
| Analytics **API** routes | summary / dashboard / recent / profile / DELETE registered |
| Theme helpers | `client/src/lib/theme.ts` |
| Theme toggle in `App.tsx` | Present |
| Dashboard charts component | `AnalyticsDashboard.tsx` intact (orphan until page restored + i18n fixed) |

---

## Recommended fix order

1. **Restore** full `AnalyticsPage.tsx` from last known-good commit (not the stub).  
2. **Align** `/analytics/recent` JSON with client (`rows` vs `sessions`; include `limit` if typed).  
3. **Re-add** missing i18n keys used by the dashboard panel.  
4. **Re-verify** admin-token prompt path on delete.  
5. **Update** root `README.md` to match named B0/B1 + admin delete.  
6. Smoke-test: calculate → appears in list → open profile → delete with token → charts refresh.

---

## Summary table

| ID | Severity | Item | Status |
|----|----------|------|--------|
| 1 | P0 | AnalyticsPage stub (`return null`) | **Broken** |
| 2 | P1 | recent API `sessions` vs client `rows` | **Mismatch** |
| 3 | P1 | Missing dashboard i18n keys | **Broken when mounted** |
| 4 | P1 | Delete UI / token prompt | **Dead with stub** |
| 5 | P3 | `adminAuthRequired` typing | **Minor** |
| 6 | P2 | README obsolete | **Docs** |
| 7 | P2 | project-reports lag | **Docs** |
| 8–12 | P3 | Ops / env / no tests | **Latent** |

**Bottom line:** On current `main`, **orientation wizard is the only fully usable product surface**. **All analytics UI is non-functional** until `AnalyticsPage.tsx` is restored and the recent-payload + i18n mismatches are fixed.
