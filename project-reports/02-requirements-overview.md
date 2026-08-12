# 02 — Requirements Overview

Source: `Act as a Lead Systems Architect and Senior Full-S....pdf`  
(Technical Specification & Systems Architecture Blueprint: HIS-SRE)

## System purpose

HIS University Statistical Recommendation Engine (HIS-SRE) is an **offline LAN** decision-support tool.

It computes a continuous fit score (0–100%) for every academic specialty offered by HIS University, using:

1. High-school BAC academic performance (stream + subject grades 0–20)
2. RIASEC psychometric profile

## Deployment constraints (from PDF)

- Zero internet dependency
- Local Area Network / Intranet only
- Local database (SQLite or embedded PostgreSQL)
- React SPA clients talking to a Node.js + Express host

## Original calculation model (PDF)

### Academic score

\[
S_{\text{academic, base}, i} = \left( \frac{\sum w_{k,i} \cdot g_k}{20 \cdot \sum w_{k,i}} \right) \times 100
\]

Then apply stream modifier \(\mu_{s,i} \in [0.70, 1.00]\):

\[
S_{\text{academic}, i} = S_{\text{academic, base}, i} \cdot \mu_{s,i}
\]

### Psychometric score (original PDF)

Full 6D RIASEC vectors + cosine similarity:

\[
S_{\text{riasec}, i} = \text{CosSim}(\vec{u}, \vec{v}_i) \times 100
\]

### Final score

\[
S_{\text{final}, i} = 0.70 \cdot S_{\text{academic}, i} + 0.30 \cdot S_{\text{riasec}, i}
\]

## Planned phases (from PDF)

| Phase | Focus |
|-------|--------|
| 1 | Mathematical engine unit tests & edge cases |
| 2 | TypeScript engine, SQLite, seed, Express API |
| 3 | React multi-step wizard + analytics dashboard |
| 4 | Integration, offline verification, packaging |

## Important later decisions (see 09-design-decisions.md)

- Formal unit tests are **not** required for this project
- Docker is **not** required (SQLite is file-based)
- RIASEC input will be simplified to **top 3 letters + weights** (not full 6D vector)
