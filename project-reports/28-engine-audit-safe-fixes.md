# 28 — Engine audit: verification + safe fixes shipped

**Date:** 2026-08-18  
**Scope:** External engine audit → internal verification (`27`) → reconciliation → **safe-only** code changes (no override of locked product decisions).

## Product locks (not changed)

| Decision | Status |
|----------|--------|
| Formula `0.50A + 0.25R + 0.20T + 0.05P + B` | Unchanged |
| Aggressive affinity ×0.6–×1.8 | Unchanged |
| Specialty-dependent slots **A/2** | Unchanged |
| Soft preference 100/50 | Unchanged |
| Génie bias additive | Unchanged |
| Academic stream μ removed | Unchanged |

## Audit issues — final disposition

| # | Topic | Verdict | Action taken |
|---|--------|---------|--------------|
| 1 | Missing-grade academic vs marksFit | Real in code; wizard requires all grades | **Not changed** (optional later) |
| 2 | Academic saturation | Calibration tradeoff | **Hold** |
| 3 | Technical score category-only | By design | **UI honesty only** |
| 4 | codeMatch array order | User-reachable distortion | **Fixed: rank by weight** |
| 5 | Dead `streamModifiers` | Hygiene trap | **Deleted from seed/API/types** |
| 6 | Génie additive | Intentional | No code change |
| 7 | Docs weights | Stale in original audit | Already fixed in `05` / `09` |
| slots | `resolveAcademicSlots` double English on mismatch | **Intentional A/2** | **Do not patch** |

## Safe fixes shipped

### 4a — `codeMatchScore` weight order
Sort top-3 by weight (then letter) before position bonus. Client array order no longer changes the code-match component.

### 5 — Remove dead `streamModifiers`
Removed from `specialties.seed.json`, server/client types, config API. Seed writes `stream_modifiers_json = {}`. Scoring still uses coarse `streamBaseFit`.

### 3-UI — Stream / category fit presentation
Labels updated; results note that fit is the same within technical vs non-technical groups. Scoring values unchanged.

## Explicitly not shipped
Narrowing affinity; specialty-aware technical model; changing A/2 slots; folding génie into weights; re-wiring streamModifiers into scoring.

## Related
- [27-engine-audit-verification.md](./27-engine-audit-verification.md)
- [05-math-engine.md](./05-math-engine.md)
- [09-design-decisions.md](./09-design-decisions.md)
