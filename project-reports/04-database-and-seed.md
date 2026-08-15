# 04 — Database and seed

## Storage

- File: `server/data/his-sre.db` (SQLite, local only)
- No Docker, no remote DB

## Tables (summary)

- **specialties** — HIS programmes (JSON columns for weights, Holland code, RIASEC vector, streamModifiers retained in seed but unused by academic engine)
- **students / evaluations** — profiles + ranked result payload for history/CSV

## Seed: 8 HIS licences

| Code | Title | Technical |
|------|-------|-----------|
| HIS-INFO-SI | Informatique – Systèmes Informatiques | yes |
| HIS-SEC-SI | Sécurité des Systèmes Informatiques | yes |
| HIS-ELEC | Technologies et Systèmes Électroniques | yes |
| HIS-DROIT | Droit Public | no |
| HIS-ECOM | E-commerce | no |
| HIS-ECO-GEST | Économie et Gestion des Entreprises | no |
| HIS-PSY-CLIN | Psychologie Clinique | no |
| HIS-ORIENT | Sciences de l'éducation: Orientation et conseil | no |

Each has Holland code, RIASEC benchmark, subject weight map used for aggressive academic multipliers.
