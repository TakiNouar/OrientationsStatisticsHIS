# 07 — Frontend Status

**Location:** `client/`

## Current state

The client is still the **default Vite + React + TypeScript starter**.

- `App.tsx` shows the Vite/React logo counter page
- No wizard, no forms, no API calls, no results view
- Tailwind CSS is listed in `package.json` but not used for product UI
- Shared-looking types exist in `client/src/types.ts` but are unused

## Scaffold present

| Item | Status |
|------|--------|
| Vite + React 19 + TypeScript | Yes |
| Tailwind 4 (`@tailwindcss/vite`) | Installed |
| Basic `types.ts` mirroring domain concepts | Present, unused |
| Multi-step wizard | Missing |
| Academic form (stream + dynamic subject grid) | Missing |
| RIASEC / top-3 input UI | Missing |
| Results dashboard (ranking cards, radar, bars) | Missing |
| API client / fetch layer | Missing |
| Proxy or base-URL config for local backend | Missing |

## Target UI (from original PDF + current product goal)

1. **Step 1 — Academic**  
   Choose BAC stream → dynamic subject grade inputs → overall BAC mark + name

2. **Step 2 — Psychometric**  
   Select **top 3 RIASEC letters** and assign a weight/strength to each

3. **Step 3 — Analytics dashboard**  
   Ranked specialty cards, score breakdown (70% academic / 30% psychometric), optional radar or visual comparison

## Conclusion

Frontend is the largest remaining piece of visible product work.  
It should be built **after** the top-3 RIASEC model is finalized on the backend so types and forms do not need a rewrite.
