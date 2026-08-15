# 08 — Remaining work

## Optional polish

- [ ] Tune seed subject weights / génie bias after counsellor feedback
- [ ] Show affinity multipliers on results UI (debug mode)
- [ ] Persist `technicalOption` explicitly in DB columns if needed for reporting
- [ ] French UI copy for HIS staff
- [ ] LAN deploy notes (bind host, static client build)

## Explicitly out of scope

- Phase B analytics dashboard
- Unit/integration test suite (product decision)
- Docker / Postgres
- Arts stream
- Re-introducing stream μ on academic (removed by product choice)

## Known ops notes

- Windows: `better-sqlite3` may need C++ build tools + `npm install-scripts approve better-sqlite3`
- After seed/schema changes: delete `server/data/his-sre.db*` and restart server
