# 02 — Requirements overview

## Product goal

LAN offline tool: counsellor/student enters BAC + RIASEC data → ranked fit scores for HIS University licences with research-style labels.

## Phase A only

Input → calculate → display (+ persist evaluation). No Phase B.

## Inputs

| Field | Rule |
|-------|------|
| Full name | Required |
| BAC stream | 6 national streams |
| Tech Math option | Required if Technical Mathematics |
| Overall BAC mark | 0–20 |
| Grades | Fixed 4 subjects per stream |
| Top-3 RIASEC | Distinct letters, weights 1–100 |

## Grade slots

| Stream | Main 1 | Main 2 | Opposite | English |
|--------|--------|--------|----------|---------|
| Math / Exp. Sci / Tech Math | Math | Physics | Arabic | English |
| Gestion | Accounting | Economics | Math | English |
| Langues | Arabic | French | Math | English |
| Lettres | Arabic | Philosophy | Math | English |

## Outputs

- Fair cross-stream comparison
- Strong opposite marks can lift opposite-type specialties
- Specialty-specific academic multipliers from seed data
