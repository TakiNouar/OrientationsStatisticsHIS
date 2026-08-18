# 08 — Remaining work

**Updated:** 2026-08-18

## Done on `main`

- [x] Phase A wizard + engine + persist
- [x] Phase B0/B1 analytics + dashboard
- [x] Career paths
- [x] DELETE protected by `ADMIN_TOKEN`
- [x] Preference (0.05) + specialty-dependent slots (A/2)
- [x] Google Sheets full resync + idempotent styling
- [x] Persist/export `technical_option`
- [x] Engine audit safe fixes: codeMatch weight-order, remove dead streamModifiers, stream-fit UI labels

## Optional later

### Product / calibration (only with evidence)
- [ ] Academic affinity band if top ranks feel flattened
- [ ] Defense-in-depth missing-grade backfill on API path
- [ ] Counsellor feedback on seed weights

### Product
- [ ] Serve `client/dist` from Express (single-port)
- [ ] Debounce Sheets resync under bursts

### Phase B2
- [ ] Logins / roles; auth on analytics reads; retention; capacity

### Ops
- [ ] Backups of `server/data/his-sre.db`
- [ ] Strong `ADMIN_TOKEN` on shared LAN
