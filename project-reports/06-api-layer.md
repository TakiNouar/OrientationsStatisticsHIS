# 06 — API layer

Base: `http://localhost:3001`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/config` | Streams, slots, génie options, formula weights, specialties summary |
| POST | `/api/v1/recommendations/calculate` | Validate body → score → JSON result; persist async |
| GET | `/api/v1/export/evaluations?format=csv` | Download evaluation history |
| GET | `/api/v1/analytics/summary` | B0: anonymized aggregate counts |
| GET | `/api/v1/analytics/recent` | B0: anonymized rank-1 session rows |

## Calculate body (summary)

- `fullName`, `bacStream`, optional `technicalOption`
- `overallBacMark`, `grades` map (required subjects for stream)
- `topRiasec`: 3 `{ letter, weight }`

Validation failures → **400** with Zod `issues`.

## Export / analytics query params

- `from`, `to` — ISO date/time strings
- `bacStream` — national stream code
- `specialtyCode` — HIS licence code (export + analytics)
- Export only: `anonymized=1` (default) omits names; `anonymized=0` includes `student_name`
