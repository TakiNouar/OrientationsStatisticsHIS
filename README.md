# OrientationsStatisticsHIS

**HIS Statistical Recommendation Engine (HIS-SRE)** — offline LAN decision-support matching BAC + RIASEC profiles to HIS licences (Phase A).

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

See [DEPLOYMENT.md](./DEPLOYMENT.md) for LAN hosting. See `project-reports/` for status.

## Formula (locked)

```
S = 0.50 * Academic + 0.30 * RIASEC + 0.20 * TechnicalFit + génieBias
```
