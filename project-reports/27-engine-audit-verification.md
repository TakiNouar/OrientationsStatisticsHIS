# 27 — Engine audit verification

**Date:** 2026-08-18  
**Source audited:** external full audit of `server/src/engine.ts` (+ types/constants)  
**Method:** Static review of current `main` HEAD against the audit claims and against recorded product decisions (`05-math-engine.md`, `09-design-decisions.md`, wizard validation).  
**Purpose:** Separate **confirmed code facts** from **design choices**, and rank what is worth changing.

---

## Executive take

The audit is **technically careful** and useful. The blend formula is arithmetically consistent with the locked weights. Several findings are real calibration or hygiene issues; a few are framed as defects when they match **intentional** product decisions. Operational severity is overstated where the wizard already constrains inputs.

| # | Audit claim | Code-true? | Aligns with project intent? | Severity for *this* product |
|---|-------------|------------|------------------------------|-----------------------------|
| 1 | Academic skips missing grades; marksFit backfills overall | **Yes** | Partially mitigated by UI | Medium (API edge); low for normal wizard path |
| 2 | Affinity 0.6–1.8 + clamp saturates academic at 100 | **Yes** | Intentional aggressive multipliers | Medium (ranking resolution among strong students) |
| 3 | Technical score only depends on `isTechnical` | **Yes** | Coarse category gate by design | Medium presentation; low as “bug” |
| 4 | codeMatch high floor + array-order bonus | **Yes** | Roughly intentional | Medium (order footgun; floor soft) |
| 5 | `streamModifiers` never read in engine | **Yes** | Stream μ on academic removed | Medium hygiene (dead config) |
| 6 | Génie bias post-blend additive | **Yes** | Explicit design | Low (document, don’t panic) |
| 7 | Docs still say 0.30 RIASEC / no preference | **Stale** | Reports already updated 2026-08-18 | Resolved in docs |

---

## Confirmed formula (code)

```
S = 0.50·A + 0.25·R + 0.20·T + 0.05·P + B
```

- **P** = soft preference (100 if preferred specialty matches, else 50)
- **B** = génie option bias (Technical Mathematics only), **additive** after the weighted blend, then clamp to [0, 100]

Docs in `05-math-engine.md` / `09-design-decisions.md` already match this (audit Issue 7 is outdated relative to repo).

---

## Issue-by-issue

### 1 — Missing-grade handling diverges (academic vs marksFit)

**Confirmed**

- `calculateAcademicScore`: non-numeric grade → `continue` (slot weight not redistributed).
- `marksFit`: missing subjects → fall back to `overallBacMark` percentage.

**Measured-style impact in audit:** up to ~25 final-score points if the 40% academic slot is empty — plausible for the engine path.

**Project mitigation**

- Wizard Step 1 validates **all required stream subjects** before submit. Incomplete transcripts should not reach the engine through the normal UI.

**Verdict**

- Real inconsistency for API / future bulk import.
- Not a “scores lie 25 pts in production UI” issue under current wizard rules.
- Reasonable fix: backfill overall in academic (same as marksFit) + surface `incompleteGradeData` / badge if any slot was filled from overall.

---

### 2 — Academic saturation from affinity multipliers

**Confirmed**

- `AFFINITY_MIN = 0.6`, `AFFINITY_MAX = 1.8`.
- Weighted sum can exceed 100 before final clamp → many strong-but-not-perfect profiles share academic = 100.

**Project intent**

- Aggressive multipliers were an explicit product choice so marks pull specialties hard.

**Verdict**

- Ranking-resolution tradeoff, not a coding error.
- Option B (narrow band, e.g. 0.85–1.25) is the smaller blast radius if counselors report top ranks looking identical.
- Option A (rescale by theoretical max) changes the feel of multipliers more globally.
- Change only with deliberate recalibration, not as a silent “bugfix.”

---

### 3 — Technical score identical across specialties in the same category

**Confirmed**

- `technicalAlignmentScore(studentProfile, specialty.isTechnical)` — only boolean polarity.
- For one student, all technical specialties share one T; all non-technical share another.

**Project intent**

- Technical fit was designed as **stream ↔ category** alignment + marks polarity, not a third copy of academic affinity.
- Differentiation among e.g. HIS-INFO vs HIS-ELEC was meant to come from academic multipliers, RIASEC, preference, and génie bias.

**Verdict**

- Math matches design.
- UI oversells T as specialty-specific (percentage bar per licence).
- Honest paths:
  1. Keep the gate; label UI as stream / technical-category fit.
  2. Make T specialty-aware (audit proposal) — **model change**, requires product approval.

Do not silently reweight the 20% term without an explicit decision.

---

### 4 — RIASEC `codeMatchScore` floor and list order

**Confirmed**

- Credit uses `0.45 + 0.55 * strength` (high floor).
- Position bonus uses **array index** of `topRiasec`, not weight-sorted rank.

**Nuance on audit numbers**

- Flat weights (e.g. 1,1,1) still have relative strength 1 vs max → high scores are not only the floor.
- Strong claims that hold: order sensitivity; near-zero absolute weights can still score moderately via the floor.

**Project context**

- Client requires three distinct letters with positive weights for normal submit.

**Verdict**

- Ranking by **weight order** for the position bonus is a clear correctness improvement.
- Lowering the floor is optional calibration.
- Worth doing if we touch the engine again.

---

### 5 — `streamModifiers` dead configuration

**Confirmed**

- Present in seed, DB, API, client types.
- **Never read** in `engine.ts`.
- Technical component uses coarse `streamBaseFit` instead.

**Project intent**

- Stream modifiers on **academic** were explicitly removed.
- Seed still carries per-stream modifiers that look tunable but do nothing.

**Verdict**

- Real hygiene problem (trap for anyone editing seed).
- Prefer one of:
  - **Wire** into `streamBaseFit` (seed is more granular than the 100/85/35/40 grid), or
  - **Delete** from seed, schema, API, and client types.
- Leaving half-connected is the only wrong option.

---

### 6 — Génie bias outside the weighted blend

**Confirmed**

- `finalScore = clamp(blended + bias)` with bias typically +2…+8 for matching génie codes.

**Project intent**

- Explicit small bonus for Technical Mathematics + matching option.

**Verdict**

- Design, not a defect.
- Folding into a named weight is optional polish.
- Minimum: keep docs explicit that **B is additive** after the 100% weight sum.

---

### 7 — Documentation weights

**Status as of 2026-08-18**

- `project-reports/05-math-engine.md` and `09-design-decisions.md` document:
  - `0.50 A + 0.25 R + 0.20 T + 0.05 P + B`
  - Preference soft 100/50
  - Specialty-dependent academic slots (A/2)

The external audit’s “docs say 0.30 RIASEC” finding is **stale** relative to current reports.

---

## How the audit aligns with the project

| Audit framing | Reality for OrientationsStatisticsHIS |
|---------------|----------------------------------------|
| “Broken scoring” | Weights and preference match decided product formula |
| “20% of formula does nothing” | Does **category** work, not intra-category ranking — by design |
| “25-pt missing-grade disaster” | True in engine; **blocked by wizard validation** in normal use |
| Dead `streamModifiers` | Real cleanup item |
| Saturation / codeMatch floor | Calibration quality issues, not “wrong formula” |
| Additive génie bias | Intentional; document clearly |

---

## Recommended remediation order (if we change the engine)

Only implement after explicit product choice per item.

1. **Issue 5** — Wire `streamModifiers` into stream base **or** remove from seed/API (cheap, stops confusion).
2. **Issue 4** — Rank by weight for position bonus in `codeMatchScore` (small correctness fix).
3. **Issue 1** — Overall backfill in academic + completeness flag (API safety).
4. **Issue 2** — Only if field feedback says top ranks are flattened.
5. **Issue 3** — Product decision: UI honesty vs specialty-aware technical score.
6. **Issue 6** — Document as-is unless bias feels too strong in real sessions.
7. **Issue 7** — Already addressed in project reports.

**Do not** apply the full audit as a single silent “fix everything” pass. Prefer a subset with agreed design intent so ranking behavior stays predictable for counselors.

---

## Related docs

- [05-math-engine.md](./05-math-engine.md) — formula and slots
- [09-design-decisions.md](./09-design-decisions.md) — product choices
- [26-progress-2026-08-18.md](./26-progress-2026-08-18.md) — recent engine/Sheets work
