# Project Reports — HIS-SRE (OrientationsStatisticsHIS)

**Last updated:** 2026-08-12  
**Repository:** [TakiNouar/OrientationsStatisticsHIS](https://github.com/TakiNouar/OrientationsStatisticsHIS)

This folder contains a modular status snapshot of the project.  
Each file focuses on one area so progress and remaining work stay easy to scan.

---

## Index

| File | Content |
|------|---------|
| [01-executive-status.md](./01-executive-status.md) | High-level progress, % complete, current verdict |
| [02-requirements-overview.md](./02-requirements-overview.md) | What the original PDF specification asks for |
| [03-backend-completed.md](./03-backend-completed.md) | Server, engine, API — what is already done |
| [04-database-and-seed.md](./04-database-and-seed.md) | SQLite schema, persistence, seed specialties |
| [05-math-engine.md](./05-math-engine.md) | Academic + RIASEC scoring logic currently implemented |
| [06-api-layer.md](./06-api-layer.md) | Endpoints, validation, response contracts |
| [07-frontend-status.md](./07-frontend-status.md) | Client state (still near zero) |
| [08-remaining-work.md](./08-remaining-work.md) | Prioritized backlog of what is left |
| [09-design-decisions.md](./09-design-decisions.md) | Confirmed decisions (no Docker required, no formal tests, top-3 RIASEC) |

---

## Quick status

- **Backend core:** mostly complete
- **Database:** complete (SQLite, no Docker needed)
- **Math engine:** working for full 6D RIASEC (pending change to top-3)
- **API:** usable
- **Frontend / dashboard UI:** not started (Vite starter only)
- **Formal tests:** deliberately skipped
- **Packaging / LAN deployment polish:** not started
