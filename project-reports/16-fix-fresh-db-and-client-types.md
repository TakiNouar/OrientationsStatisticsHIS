# 16 — Fix fresh DB boot + client MatchDetails (2026-08-16)

Addresses stress-scan P0 items 1–2.

## Changes

- **persist.ts:** no module-scope `db.prepare`; lazy init inside `persistEvaluation`
- **client types:** `MatchDetails` + typed `details` on specialty matches

## Verify

```bash
# Server (fresh DB)
cd server
rm -f data/his-sre.db data/his-sre.db-wal data/his-sre.db-shm
npm run dev   # should start without "no such table"

# Client build
cd client
npm run build   # should produce dist/
```
