# 01 — Executive status

**Status:** Phase A operational (end-to-end wizard + engine + persistence).

## Done

- Offline Express API + SQLite (no Docker)
- 8 verified HIS licence seeds with Holland codes + subject weights
- Fixed BAC grade slots (2 mains + opposite + English) per stream
- Technical Mathematics génie sub-option with bias points
- Engine: 50% academic / 30% RIASEC / 20% technical fit
- Academic: slot mix × aggressive specialty subject multipliers (×0.6–×1.8 from seed weights); **no stream μ**
- RIASEC: hybrid 0.3 cosine + 0.7 Holland code match on top-3 weighted letters
- Technical fit: 0.45 stream base + 0.55 marks-driven fit
- React multi-step wizard (Academic → RIASEC → Results with bars + labels)
- CSV export of evaluations

## Not in scope (locked)

- Phase B (extended analytics / ML)
- Formal automated test suite
- Docker / remote DB
- Arts BAC stream

## Health

App runs locally: server `:3001`, client via Vite. Results render after latest UI fix for removed detail fields.
