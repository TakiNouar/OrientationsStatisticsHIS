# 10 — Phase B0 analytics (+ named student profiles)

**Status:** On branch `feature/b0-analytics` (2026-08-15).

## Privacy policy (updated)

**Named by default** for counsellor LAN use:

- Session list shows **full student name**
- Click a row → **student profile** with grades, RIASEC, full ranked matches
- CSV export includes names by default (`anonymized=1` still available if needed)

This is intentional for offline orientation staff PCs. Do not expose the API on the public internet without auth (B2).

## Scope

| Feature | Status |
|---------|--------|
| Total sessions + counts by stream / top specialty / match label | Yes |
| Filters: from, to, bacStream, specialtyCode | Yes |
| Named session table | Yes |
| Clickable student profile (results) | Yes |
| Named CSV export (default) | Yes |
| Charts / heatmap | Not yet (B1) |
| Auth | Not yet (B2) |

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/analytics/summary` | Aggregates |
| GET | `/api/v1/analytics/recent` | Named rank-1 sessions |
| GET | `/api/v1/analytics/students/:studentId` | Full profile + matches |
| GET | `/api/v1/export/evaluations?format=csv` | Named default; `anonymized=1` optional |

## Rollback commits (selected)

| SHA | Note |
|-----|------|
| `5a339213e9ecdf71befabdeadda2dd7466f99b39` | main baseline (pre-B0) |
| `3950166e202c41d9421d320ea0637695eaf41954` | B0 anonymized docs tip |
| `9a29d994626cbebbe13de4b53a13df4485080721` | named sessions + profile in db |
| `f8d4a88a7f593e2329fa5420c9d7ee07da10c83f` | profile API route |
| `ad1527a2cf46631ba25adb62df65ca45da8d30fc` | client types/api |
| `b1868526351e5aaebe0c2c76a554cff238684a9d` | profile UI |

```bash
git checkout main
# discard all analytics:
git checkout feature/b0-analytics && git reset --hard 5a339213e9ecdf71befabdeadda2dd7466f99b39
```
