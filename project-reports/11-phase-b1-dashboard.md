# 11 — Phase B1 staff dashboard

**Status:** Implemented on `feature/b0-analytics` (2026-08-15).

## Scope delivered

| Feature | Done |
|---------|------|
| Volume by day (bar strip) | Yes |
| Score bucket distribution | Yes |
| Match-label bars | Yes |
| Stream × specialty heatmap matrix | Yes |
| Data quality (avg scores, high/low, never-ranked specialties, missing RIASEC) | Yes |
| Same filters as B0 | Yes |
| Charts library dependency | **No** (CSS only) |
| Auth | No (B2) |

## API

`GET /api/v1/analytics/dashboard?from&to&bacStream&specialtyCode`

Returns: `volumeByDay`, `streamSpecialtyMatrix`, `scoreBuckets`, `byMatchLabel`, `dataQuality`.

## UI

Rendered on the Statistiques page under the summary counts (before the student list).

## Rollback

Dashboard module: `server/src/analytics-dashboard.ts`  
Parent before B1 server work: `e5aa662a547ebf20c05ddd297cadfd02eb2b5868`
