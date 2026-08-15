# HIS-SRE server

Express + TypeScript + Zod + better-sqlite3.

## Verified runtime

- **Node.js:** v22 LTS or v24 (tested with Node 24.x on Windows)
- Packages in `package.json` resolve on the npm registry as of 2026-08-15 (including TypeScript 7, Express 5, Zod 4, React-era peer tooling on the client).

## Scripts

```bash
npm install
npm run dev      # http://localhost:3001
npm run build
npm start
```

Copy `.env.example` to `.env` for local overrides.
