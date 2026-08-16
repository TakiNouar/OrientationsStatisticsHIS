# 14 — Fix restore analytics (2026-08-16)

## Done on `main`

1. **Restored** full `client/src/components/AnalyticsPage.tsx` (was stub `return null`).
2. **Aligned** `GET /api/v1/analytics/recent` → `{ rows, filters, limit }` (was `sessions`).
3. **Added** missing i18n keys for dashboard: `totalSessions`, `dashboardTitle`, `volumeByDay`, `scoreBuckets`, `byMatchLabel`.
4. **Admin token** prompt on delete (sessionStorage via `api.ts`).
5. **README** updated for named B0/B1 + admin delete.
6. **Persist** runs before calculate response; body includes `persisted: boolean`.
7. **ConfigResponse** type includes `adminAuthRequired`.

## Smoke checklist (manual)

- [ ] `cd server && npm run dev` + `cd client && npm run dev`
- [ ] Complete one orientation evaluation
- [ ] Open **Statistiques** — charts + recent row with name
- [ ] Click row → profile
- [ ] Delete with `ADMIN_TOKEN` matching server `.env`
- [ ] Theme toggle light/dark/system

## Optional later

- Archive branch `feature/b0-analytics`
- B2 institutional (auth, retention, capacity)
