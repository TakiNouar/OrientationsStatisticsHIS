# 06 — API layer

Base: `http://localhost:3001`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/config` | Streams, slots, génie options, formula weights, specialties summary |
| POST | `/api/v1/recommendations/calculate` | Validate body → score → JSON result; persist async |
| GET | `/api/v1/export/evaluations?format=csv` | Download evaluation history |

## Calculate body (summary)

- `fullName`, `bacStream`, optional `technicalOption`
- `overallBacMark`, `grades` map (required subjects for stream)
- `topRiasec`: 3 `{ letter, weight }`

Validation failures → **400** with Zod `issues`.
