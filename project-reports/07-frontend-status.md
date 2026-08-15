# 07 — Frontend status

## Wizard

1. **Academic** — name, stream, optional génie, overall mark, 4 fixed grade slots
2. **RIASEC** — top-3 distinct letters + weights
3. **Results** — ranked cards, score bars (A / R / T), labels, detail chips

## Tech

- React + Vite + Tailwind
- `useRecommendationWizard` owns form state, validation, submit
- Config loaded from `/api/v1/config` on mount

## Cleanup (2026-08-15)

Removed unused Vite boilerplate: `App.css`, `assets/hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`.
