# 08 — Remaining Work (Prioritized)

## P0 — Must do next

### 1. Redefine RIASEC as top-3 + weights
- Update TypeScript types (`server` + `client`)
- Update Zod schema
- Update scoring function in `engine.ts`
- Adjust DB column / JSON shape for RIASEC profiles if needed
- Adjust seed benchmarks usage for the new similarity rule

### 2. Build the React multi-step wizard
- Step 1: Academic form (stream-driven subject grid)
- Step 2: Top-3 RIASEC letter picker + weight inputs
- Step 3: Results dashboard

### 3. Connect frontend to existing API
- Fetch `/api/v1/config` for streams / subjects / specialties
- POST to `/api/v1/recommendations/calculate`
- Display ranked matches and breakdowns

## P1 — Important polish

- Clear empty root `README.md` with run instructions (client + server)
- Confirm RIASEC weight scale (e.g. 1–5, 0–100, or percentages that sum to 100)
- Decide exact top-3 vs specialty scoring formula and document it
- Basic error / loading states in the UI
- Make sure the flow works fully offline on localhost and LAN IP

## P2 — Optional / later

- Docker or single-executable packaging (not required)
- Hourly SQLite backup script
- More specialties in the seed file
- Visual radar chart (nice-to-have, not blocking)
- Latency notes under concurrent LAN use

## Explicitly out of scope (by decision)

- Formal unit / integration test suite (vitest/jest, synthetic 100-profile benchmarks, etc.)
- Mandatory Docker usage for the database
- Cloud deployment or internet dependency
