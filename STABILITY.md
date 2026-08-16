# Local stability checklist

## Admin token (shared LAN)

In `server/.env`:

```env
ADMIN_TOKEN=your-long-secret
```

Analytics → delete profile prompts for this token once per browser session.

## better-sqlite3 (Windows)

```powershell
cd server
npm install-scripts approve better-sqlite3
npm run rebuild:native
# or: Remove-Item -Recurse -Force node_modules; npm install; npm run rebuild:native
```

Needs VS C++ build tools.

## Start

```powershell
# server
cd server
copy .env.example .env   # set ADMIN_TOKEN
npm install
npm run dev

# client
cd client
npm install
npm run dev
```

Client uses Vite `/api` proxy → port 3001.

## Backup

Copy `server/data/his-sre.db` (+ `-wal`/`-shm` if present) while server is stopped.
