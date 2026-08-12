# 03 — Backend Completed Work

**Location:** `server/`

## Stack

- Node.js + TypeScript (strict)
- Express 5
- better-sqlite3
- Zod validation
- tsx for development

## Files already implemented

| File | Role |
|------|------|
| `src/index.ts` | Express app, routes, error handling |
| `src/engine.ts` | Academic + RIASEC scoring + ranking |
| `src/db.ts` | SQLite init, seed upsert, persist, CSV export |
| `src/schema.ts` | Zod input validation + stream-required subjects |
| `src/types.ts` | Domain types, stream/subject maps |
| `data/specialties.seed.json` | 6 seed specialties |
| `package.json` / `tsconfig.json` | Project config |

## What is working

- Server boots and listens on port 3001 (or `PORT` env)
- Database file auto-created under `server/data/his-sre.db`
- Specialties seeded on startup (upsert by code)
- Recommendation calculation returns ranked matches
- Evaluations are persisted (student + grades + RIASEC + match rows)
- CSV export of evaluations is available
- Health and config endpoints expose runtime metadata

## Scripts available

```bash
npm run dev      # tsx watch
npm run build    # tsc
npm start        # node dist/index.js
```

## Not yet present on backend

- Top-3 RIASEC model (still full 6D)
- Formal test suite (deliberately skipped)
- Docker / single-executable packaging
- Auth / multi-user concerns (not required by current scope)
