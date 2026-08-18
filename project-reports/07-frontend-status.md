# 07 — Frontend status

**Updated:** 2026-08-18

## Wizard

1. **Academic** — name, **preferred HIS specialty** (required), stream, optional génie, overall mark, 4 grade slots
2. **RIASEC** — top-3 distinct letters + weights
3. **Results** — ranked cards, score bars, labels, career paths tab, detail chips

## Visual system

- Theme tokens: ink / brass / parchment / burgundy (`index.css` `@theme`)
- Shell, step indicator, results: luxe brass/ink
- **Step 1 & Step 2 forms restyled** to the same system (no leftover slate/indigo)

## Tech

- React + Vite + Tailwind 4
- `useRecommendationWizard` — form state, validation, submit
- Config from `/api/v1/config` (includes `formulaWeights` with preference)
- Analytics route (`#analytics`) — Phase B dashboard
- Admin delete: token prompt when `adminAuthRequired`

## Known polish (non-blocking)

- Results preference bar may be minimal depending on Step3 version; scoring still applies P server-side
