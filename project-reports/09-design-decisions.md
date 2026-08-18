# 09 — Design decisions

**Updated:** 2026-08-18

| Decision | Choice |
|----------|--------|
| Scope | Phase A + optional B0/B1 analytics; no Docker/Postgres |
| DB | Local SQLite; additive migrations only; never wiped by Sheets |
| Tests | **None** (product decision) |
| Formula | 50% academic / 25% RIASEC / 20% technical / **5% preference** |
| Preference | Soft 100/50; required on step 1 |
| RIASEC | Top-3 + 0.3 cosine / 0.7 code match |
| Grade slots | **Specialty-dependent (A/2)** via `resolveAcademicSlots` |
| Academic multipliers | Aggressive ×0.6–×1.8 from seed weights |
| Stream μ on academic | Removed |
| Missing subject weight | Specialty average mapped multiplier |
| Technical fit | 0.45 stream base + 0.55 marksFit (stream-fixed slots) |
| Sheets | Full resync mirror; sheet resets, DB does not |
| Sheet deletes | Disappear on next resync (mirror DB) |
| Preference = #1 UI | Brass highlight on columns G–H |
| UI language | Default **French**, toggle EN |
| Visual | Ink / brass / parchment |
| Deploy docs | Windows-first |
