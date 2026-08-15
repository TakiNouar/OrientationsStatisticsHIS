# HIS-SRE — LAN deployment notes

Target environment for this project has been **Windows** (staff PCs). Adjust if you later move to Linux.

## 1. Build the client (static files)

```powershell
cd client
npm install
npm run build
```

Output is in `client/dist/`. For production you can serve these files with any static server, or open them behind the same host that runs the API (optional: add Express static later).

## 2. Run the API on the LAN

```powershell
cd server
copy .env.example .env
# Edit .env:
#   HOST=0.0.0.0
#   PORT=3001
#   ALLOWED_ORIGINS=http://<staff-pc-ip>:5173,http://localhost:5173
npm install
npm run dev
# or: npm run build && npm start
```

`HOST=0.0.0.0` binds all interfaces so other machines on the LAN can reach the API.

## 3. Firewall

Open **inbound TCP 3001** (or your chosen `PORT`) for the local network profile only.

Windows example (admin PowerShell):

```powershell
New-NetFirewallRule -DisplayName "HIS-SRE API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Private
```

## 4. Client on other PCs

Either:

- Run `npm run dev` on each counsellor PC with `VITE_API_BASE=http://<server-ip>:3001`, or
- Host `client/dist` once and set the same API base at build time:

```powershell
$env:VITE_API_BASE="http://<server-ip>:3001"
npm run build
```

## 5. Restart after reboot (Windows Task Scheduler)

1. Create a task **At startup** (or at logon of the service account).
2. Action: start a program
   - Program: `powershell.exe`
   - Arguments: `-NoProfile -ExecutionPolicy Bypass -File C:\path\to\start-his-sre.ps1`

Example `start-his-sre.ps1`:

```powershell
Set-Location "C:\path\to\OrientationsStatisticsHIS\server"
npm run start
```

(Prefer `npm run build` once, then `npm start` for stability.)

## 6. Linux alternative (if the host is Linux)

Use a simple systemd unit pointing at `node dist/index.js` with `WorkingDirectory=/opt/his-sre/server` and `EnvironmentFile=/opt/his-sre/server/.env`.

## 7. Data

SQLite lives at `server/data/his-sre.db`. Back up that folder periodically. Delete `*.db*` only when you intentionally want a full re-seed.
