# OrientationsStatisticsHIS

**HIS Statistical Recommendation Engine (HIS-SRE)** — offline LAN decision-support matching BAC + RIASEC profiles to HIS licences (Phase A) + **Phase B0 anonymized analytics**.

## Stack

| Layer | Tech |
|-------|------|
| Server | Express 5 + TypeScript + Zod 4 + better-sqlite3 |
| Client | React 19 + Vite 8 + Tailwind 4 |
| Data | Local SQLite (no Docker) |

## Verified Node.js

Use **Node.js 22 LTS** or **24.x**. Dependency pins in both packages resolve against the public npm registry (TypeScript 7, Vite 8, React 19, etc. are real releases — not typos).

## Quick start

```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd client && npm install && npm run dev
```

Open the Vite URL → use header toggle **Orientation** / **Statistiques** for B0 analytics.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for LAN hosting. See `project-reports/` for status (including [B0 analytics](./project-reports/10-phase-b0-analytics.md)).

## Formula (locked)

```
S = 0.50 * Academic + 0.30 * RIASEC + 0.20 * TechnicalFit + génieBias
```

## B0 analytics (branch `feature/b0-analytics`)

- Anonymized counts by stream / top specialty / match label
- Period + stream + specialty filters
- Recent sessions table (no student names)
- CSV export anonymized by default (`anonymized=0` for named export)
