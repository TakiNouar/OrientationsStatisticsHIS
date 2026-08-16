# 06 — API layer

Base: `http://localhost:3001`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/config` | Streams, subjects, specialties, career paths |
| POST | `/api/v1/recommendations/calculate` | Score + persist evaluation |
| GET | `/api/v1/export/evaluations?format=csv` | CSV export (`anonymized=0` default, `1` optional) |
| GET | `/api/v1/analytics/summary` | Session counts + breakdowns |
| GET | `/api/v1/analytics/recent` | Named recent sessions |
| GET | `/api/v1/analytics/dashboard` | Charts / matrix / data quality |
| GET | `/api/v1/analytics/students/:studentId` | Full student profile |
| DELETE | `/api/v1/analytics/students/:studentId` | Delete student + cascade |

Analytics query params (where applicable): `from`, `to`, `bacStream`, `specialtyCode`, `limit`.

Phase B details: [10](./10-phase-b0-analytics.md), [11](./11-phase-b1-dashboard.md), [12](./12-phase-b-branch-summary-merge-ready.md).
