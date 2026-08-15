# 03 — Backend completed

## Modules (`server/src/`)

| File | Role |
|------|------|
| `index.ts` | Express app, CORS, routes, startup |
| `schema.ts` | Zod validation (grades, topRiasec, technicalOption) |
| `types.ts` | Streams, slots, labels, profile types |
| `engine.ts` | Scoring pipeline |
| `db.ts` | SQLite schema, seed load, persist, CSV export |

## Behaviours

- `initDatabase()` on boot; tables created if missing
- Seed specialties from `data/specialties.seed.json`
- Async persist of each evaluation after calculate
- Strict TypeScript + ESM

## Runtime notes

- `better-sqlite3` needs native build tools on Windows (VS C++ / approved install scripts)
- Delete `data/his-sre.db*` to force re-seed after schema/seed changes
