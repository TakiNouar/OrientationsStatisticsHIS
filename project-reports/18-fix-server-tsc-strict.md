# 18 — Server strict `tsc` cleanup (2026-08-16)

Addresses stress-scan P1 (reports 15 / 17).

## Changes

| File | Fix |
|------|-----|
| `engine.ts` | Safe array access under `noUncheckedIndexedAccess`; set `technicalOption` only when defined |
| `careers.ts` | Safe list append for specialty map |
| `index.ts` | `routeParam()` for `string \| string[]`; build filters without explicit `undefined` keys; conditional `technicalOption` on student profile |

## Verify

```powershell
cd server
npm run build
# expect exit 0
```
