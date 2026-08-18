# 05 — Math engine

**Updated:** 2026-08-18

## Final score

```
S = 0.50·A + 0.25·R + 0.20·T + 0.05·P + B
```

| Symbol | Meaning | Weight |
|--------|---------|--------|
| A | Academic | 0.50 |
| R | RIASEC (psychometric) | 0.25 |
| T | Technical fit | 0.20 |
| P | Preference | 0.05 |
| B | Génie bias (Tech Math only) | additive points |

## Preference P

- Required dropdown of 8 HIS specialties on step 1
- Soft scoring: **100** if specialty code matches preferred, else **50**
- Does not hard-gate ranking

## Academic A

### Slot weights (always)

`main1 0.40 · main2 0.30 · opposite 0.20 · english 0.10`

### Specialty-dependent subjects (model A / choice 2)

`resolveAcademicSlots(stream, specialty.isTechnical)`:

- **Aligned** (STEM stream + tech specialty, or soft stream + non-tech specialty): use `STREAM_GRADE_SLOTS[stream]`
- **Mismatch**: flip — stream opposite → main1, english → main2, stream main1 → opposite, english stays language slot

Example (Math stream student):

| Specialty polarity | main1 | main2 | opposite | english |
|--------------------|-------|-------|----------|---------|
| Technical | MATH | PHYSICS | ARABIC | ENGLISH |
| Non-technical | ARABIC | ENGLISH | MATH | ENGLISH |

### Multipliers

Seed subject weights mapped aggressively to **×0.6–×1.8**.  
Missing seed weight for a graded subject → specialty average mapped multiplier (not a fixed 0.75).

No stream μ on academic.

## RIASEC R

`0.3 · cosine + 0.7 · codeMatch` on top-3 letters with weights.

## Technical T

`0.45 · streamBase + 0.55 · marksFit`  
(marksFit still uses **stream-fixed** slots, not specialty-retargeted slots.)

## Génie B

Technical Mathematics only; small additive bias on matching specialty codes (+2…+8).
