# 01 — Executive status

**Updated:** 2026-08-18  
**Status:** Phase A + B0/B1 operational on `main`. Sheets mirror live. Engine audit safe hygiene applied (no formula change).

## Done

### Phase A
- Wizard FR/EN, scoring, persist, career paths, preference, A/2 academic slots

### Phase B0/B1
- Analytics dashboard, profiles, CSV export, admin DELETE token

### Integrations
- Google Sheets full resync A–P, idempotent styling, 5 min timer

### Engine hygiene (2026-08-18)
- `codeMatchScore` ranks by weight order
- Dead `streamModifiers` removed from seed/API
- Results UI labels technical fit as stream/category (scoring unchanged)

## Out of scope
- Docker/Postgres, automated tests, Phase B2 full auth

## Optional next
See [08-remaining-work.md](./08-remaining-work.md).
