# 08 — Remaining work

**Updated:** 2026-08-18

## Done on `main`

- [x] Phase A wizard + engine + persist
- [x] Phase B0/B1 analytics + dashboard
- [x] Career paths
- [x] DELETE protected by `ADMIN_TOKEN`
- [x] Preference parameter (0.05) + required step-1 dropdown
- [x] Specialty-dependent academic slots (A/2)
- [x] Google Sheets full resync (A–P), 5 min timer, delete → resync
- [x] Idempotent sheet styling (format reset + band delete every resync)
- [x] Persist + export `technical_option`
- [x] Brass/ink restyle of Step 1 & 2 forms

## Optional later

### Product
- [ ] Counsellor feedback loop for seed weights / affinity calibration
- [ ] Serve `client/dist` from Express (single-port LAN)
- [ ] Debounce Sheets resync under rapid burst submissions

### Phase B2
- [ ] Logins / roles
- [ ] Auth on analytics **read** routes
- [ ] Retention auto-purge
- [ ] Capacity planning
- [ ] Multi-user hardening

### Ops
- [ ] Regular backups of `server/data/his-sre.db`
- [ ] Strong `ADMIN_TOKEN` on shared LAN
- [ ] Watch Sheets quota logs after full style-every-resync
