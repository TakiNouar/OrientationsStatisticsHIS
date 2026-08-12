# 04 — Database & Seed Data

## Technology choice

**SQLite** via `better-sqlite3` (embedded, single file).

- No separate database server
- No Docker required for the database
- File path: `server/data/his-sre.db`
- WAL mode + foreign keys enabled

## Tables implemented

| Table | Purpose |
|-------|---------|
| `students` | Candidate identity + BAC stream + overall mark |
| `bac_grades` | Per-subject grades (0–20) |
| `riasec_profiles` | 6 RIASEC dimension scores |
| `his_specialties` | Specialty config (weights, modifiers, benchmark as JSON) |
| `match_evaluations` | Computed scores + rank per specialty |

Indexes exist on `match_evaluations` for student, specialty, and final score.

## Seed data

File: `server/data/specialties.seed.json`

Currently **6 specialties**:

1. HIS-CS-AI — Artificial Intelligence & Software Engineering
2. HIS-DS-STAT — Data Science & Applied Statistics
3. HIS-BUS-FIN — Financial Technology & Analytics
4. HIS-BIO-HEALTH — Biotechnology & Health Sciences
5. HIS-IR-COMM — International Relations & Communication
6. HIS-DESIGN-MEDIA — Digital Media Design

Each seed entry contains:

- Subject weight map
- Stream modifiers for all 6 BAC streams (\(\mu \in [0.70, 1.00]\))
- RIASEC benchmark (R, I, A, S, E, C on ~0–100 scale)

Seed is upserted on every server start (`ON CONFLICT(code) DO UPDATE`).

## Export

`GET /api/v1/export/evaluations?format=csv` produces a flat CSV suitable for Excel / institutional reporting.

## Note on future RIASEC change

When the model moves to **top 3 letters + weights**, the `riasec_profiles` table and seed benchmarks will need a small adaptation (or a new representation). The rest of the schema can stay.
