# 08 — Remaining work

## Phase B0 / B1 — done on `feature/b0-analytics`

See [12-phase-b-branch-summary-merge-ready.md](./12-phase-b-branch-summary-merge-ready.md).

## Still optional / later

### Product

- [ ] Counsellor feedback loop to tune seed subject weights / génie bias
- [ ] Full FR copy on every Step1/Step2 micro-label (header/results/analytics done)
- [ ] Serve `client/dist` from Express static for single-port deploy

### Phase B2 (institutional)

- [ ] Logins and roles (counsellor vs admin)
- [ ] Auth on destructive routes (DELETE)
- [ ] Retention policy (auto-purge old sessions)
- [ ] Capacity / cohort planning views
- [ ] Multi-user concurrent hardening

### Ops

- [ ] Merge branch to `main` after smoke test
- [ ] Backup guidance for `server/data/his-sre.db`
