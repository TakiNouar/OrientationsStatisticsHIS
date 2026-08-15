# 05 — Math engine

## Final score

```
S = 0.50 * A + 0.30 * R + 0.20 * T + B
```

Clamped to [0, 100]. Sorted descending → rank + label.

| Label threshold | Text |
|-----------------|------|
| ≥ 80 | Strong match |
| ≥ 65 | Strong match — worth a conversation |
| ≥ 50 | Possible fit / ambiguous |
| ≥ 35 | Interested, profile still developing |
| &lt; 35 | Weak match |

## Academic A

Slot weights: **40% / 30% / 20% / 10%** (main1 / main2 / opposite / english).

Per subject: `contribution = w_slot * (grade/20)*100 * multiplier`.

Multiplier from specialty seed weights, mapped **×0.6 … ×1.8** (missing subject → ×0.75).

**Stream modifiers are not applied** to A.

## RIASEC R

Top-3 → sparse 6D vector.

```
R = 0.3 * cosineScore + 0.7 * codeMatch
```

Code match: Holland positions 50/35/15, weight strength, same-rank bonus.

## Technical fit T

```
T = 0.45 * streamBase + 0.55 * marksFit
```

- streamBase: soft matrix tech/non-tech stream vs specialty (100 / 35 / 85 / 40)
- marksFit: technical specialty leans on mains; non-tech on opposite

## Génie bias B

Technical Mathematics only: +2…+8 points on matching HIS codes (Élec / Info / Sécu).
