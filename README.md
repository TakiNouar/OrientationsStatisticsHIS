# OrientationsStatisticsHIS

**HIS Statistical Recommendation Engine (HIS-SRE)** — offline LAN decision-support matching BAC + RIASEC profiles to HIS licences.

**Status:** Phase A (scoring) + **Phase B0/B1 analytics** on `main`.

## Stack

| Layer | Tech |
|-------|------|
| Server | Express 5 + TypeScript + Zod 4 + better-sqlite3 |
| Client | React 19 + Vite 8 + Tailwind 4 |
| Data | Local SQLite (no Docker) |

## Verified Node.js

Use **Node.js 22 LTS** or **24.x**.

## Quick start

```bash
# Terminal 1 — API
cd server
cp .env.example .env   # set ADMIN_TOKEN for delete on shared LAN
npm install && npm run dev

# Terminal 2 — UI
cd client
npm install && npm run dev
```

Open the Vite URL → header toggle **Orientation** / **Statistiques**.

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [STABILITY.md](./STABILITY.md). Project notes live in `project-reports/` (including [broken-items scan](./project-reports/13-broken-and-non-working.md)).

## Formula (locked)

```
S = 0.50 * Academic + 0.30 * RIASEC + 0.20 * TechnicalFit + génieBias
```

## Analytics (B0 + B1)

- **Named** student sessions (not anonymized by default)
- Filters: period, BAC stream, top specialty
- Charts: volume by day, score buckets, match labels, stream×specialty matrix, data quality
- Clickable student profiles with full ranking
- CSV export (optional `anonymized=1`)
- **Delete profile** requires `ADMIN_TOKEN` (header `X-Admin-Token`); client prompts once per browser session
- Light / dark / system theme

## Admin token

In `server/.env`:

```env
ADMIN_TOKEN=your-long-secret
```

Required for DELETE on shared LAN / production. See `.env.example`.
