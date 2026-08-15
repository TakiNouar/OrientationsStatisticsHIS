# 09 — Design decisions

| Decision | Choice |
|----------|--------|
| Scope | Phase A only |
| DB | Local SQLite, no Docker |
| Tests | **None** (product decision) |
| Formula | 50% academic / 30% RIASEC / 20% technical |
| RIASEC | Top-3 + 0.3 cosine / 0.7 code match |
| Grade slots | Fixed per stream |
| Academic multipliers | Aggressive ×0.6–×1.8 from seed weights |
| Stream μ on academic | Removed |
| Missing subject weight | **Specialty average mapped multiplier** |
| Technical fit | 0.45 stream base + 0.55 marksFit |
| UI language | Default **French**, toggle EN |
| Deploy target docs | Windows-first |

## AFFINITY_MISSING analysis (pre-change)

Slot subjects used in engine: MATH, PHYSICS, ARABIC, ENGLISH, ACCOUNTING_FINANCE, ECONOMICS, FRENCH, PHILOSOPHY.

| Specialty | Seed weight keys | Typical missing vs slots |
|-----------|------------------|---------------------------|
| HIS-INFO-SI | MATH, PHYSICS, ENGLISH, FRENCH | ARABIC; Accounting/Economics/Philosophy when those streams |
| HIS-SEC-SI | MATH, PHYSICS, ENGLISH, FRENCH | same |
| HIS-ELEC | PHYSICS, MATH, ENGLISH, NATURAL_SCIENCES | ARABIC, FRENCH, … |
| HIS-DROIT | ARABIC, PHILOSOPHY, … | MATH/PHYSICS/ENGLISH often |
| HIS-ECOM | (commerce-oriented) | technical mains often |
| HIS-ECO-GEST | ECONOMICS, ACCOUNTING_FINANCE, MATH, ENGLISH, FRENCH | ARABIC, PHYSICS |
| HIS-PSY-CLIN | ARABIC, PHILOSOPHY, … | MATH/PHYSICS/ENGLISH often |
| HIS-ORIENT | ARABIC, PHILOSOPHY, HISTORY_GEOGRAPHY, FRENCH, ENGLISH | MATH/PHYSICS often |

**Policy:** fixed 0.75 was a silent below-midpoint penalty (midpoint of 0.6–1.8 is 1.2). Replaced with mean of that specialty’s mapped multipliers so incomplete seed rows do not systematically under-score.
