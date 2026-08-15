# Local stability checklist

## Correct folder

Always work in the Git repo root that contains both `server/` and `client/`:

```text
...\OrientationsStatisticsHIS\
  server\
  client\
```

Do not mix an old `Statistics\server` with a new `OrientationsStatisticsHIS\client`.

## Start order

**Terminal 1 — API**

```powershell
cd ...\OrientationsStatisticsHIS\server
npm install
npm install-scripts approve better-sqlite3   # once, if native build blocked
npm run dev
```

Expect a log line with `server_started` and health URL on port **3001**.

**Terminal 2 — UI**

```powershell
cd ...\OrientationsStatisticsHIS\client
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

## How the client talks to the API

By default the client calls **`/api/...`** (same origin). Vite proxies that to `http://127.0.0.1:3001`.

- No CORS issues in normal local use.
- Do **not** set `VITE_API_BASE` unless you intentionally call the API on another host.

## Quick checks

1. Browser: `http://127.0.0.1:3001/api/v1/health` → `status: ok`
2. Browser: Vite app loads FR wizard (not stuck on config error)
3. Fill form → calculate → ranked results

## If config fails

1. Confirm server terminal is still running.
2. Confirm proxy: Vite must be started from this repo’s `client/` (proxy in `vite.config.ts`).
3. Hard refresh (Ctrl+F5).
4. Click **Réessayer**.

## better-sqlite3 (Windows)

```powershell
cd server
npm install-scripts approve better-sqlite3
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

Needs Visual Studio C++ build tools.
