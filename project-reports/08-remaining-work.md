# 08 — Remaining work

## Still optional

- [ ] Counsellor feedback loop to tune seed subject weights / génie bias
- [ ] Full FR copy on Step1/Step2 field labels (header/results done)
- [ ] Serve `client/dist` from Express static for single-port deploy
- [ ] Merge `feature/b0-analytics` → `main` after pilot review

## Done this hardening pass

- [x] Debug scoring details on results
- [x] FR/EN language toggle (default FR)
- [x] DEPLOYMENT.md (Windows Task Scheduler)
- [x] API timeout + config retry
- [x] Export date/stream filters
- [x] Security headers, CORS, rate limit, logger, persist error logging
- [x] AFFINITY missing policy documented + fixed
- [x] `.gitignore` + remove prompt PDF

## Phase B progress

- [x] **B0** anonymized counts + filters + better export + simple table (branch `feature/b0-analytics`)
- [ ] **B1** charts / staff dashboard
- [ ] **B2** logins, roles, retention, multi-user hardening

## Out of scope

- **Unit/integration tests** (confirmed skip)
- Docker / Postgres (until B2 demand)
- Arts stream
- Re-introducing stream μ on academic
