# 29 — UI/UX Restoration Plan (Guide-Me / HIS-SRE)

**Role:** Senior Product Designer & UX Architect  
**Scope:** Restore a premium, curated interface after feature-creep (analytics, Sheets, Sans RIASEC, theme, preference).  
**Stack constraint:** React 19 · Vite · Tailwind 4 · existing brass / ink / parchment tokens.  
**Date:** 2026-08-18  

---

## 0. Diagnosis (current state)

### What still works
- Design system nucleus is sound: Fraunces (display) · Inter (body) · IBM Plex Mono (data).
- Token set (`ink`, `parchment`, `surface`, `brass`, `brass-dim`, `burgundy`, `ink-muted`) is luxury-capable.
- Wizard remains a clear 3-step arc; analytics is correctly route-separated (`#analytics`).

### What degraded
| Area | Failure mode |
|------|----------------|
| **Header** | Stacked title + second row of controls doubled chrome height, broke the thin editorial bar. |
| **Density** | Weight lines, tabs (Scores / Sans RIASEC / Careers), export links compete at the same visual weight. |
| **Hierarchy** | Brass used both for emphasis and decoration → nothing feels exclusive. |
| **Motion** | `analytics-rise` exists; many new surfaces appear without craft. |
| **Forms** | Restyled earlier, but long forms can still read as admin tool rather than invitation. |
| **Results** | Three tabs + legend + seal + details risk overload without stronger sectioning. |

### North star
A **quiet atelier**: one primary action per region, generous air, typographic authority, brass as *accent only*, data in mono.

---

## 1. Design tokens (strict)

Keep Tailwind `@theme` in `client/src/index.css`. Do **not** invent a second palette.

### 1.1 Color — usage rules

| Token | Role | Rule |
|-------|------|------|
| `parchment` | Page ground | No large pure-white slabs without a 1px brass-dim edge. |
| `surface` | Cards, header | Primary elevated plane. |
| `ink` | Primary text | Headings + body. |
| `ink-muted` | Secondary | Captions, weights, helpers. |
| `brass` | Accent | Active nav, seals, one primary CTA, thin rules. Max ~5% of pixels. |
| `brass-dim` | Structure | Borders, inactive chrome. |
| `burgundy` | Danger / error only | Never decorative. |

### 1.2 Spacing
Use **4 / 6 / 8 / 12 / 16 / 24** Tailwind steps. Ban dense `gap-1` clusters of more than three controls without a divider.

| Region | Guidance |
|--------|----------|
| Page horizontal | `px-4`; wizard `max-w-2xl`; analytics `max-w-4xl` |
| Card padding | `p-6 sm:p-8` |
| Section rhythm | `space-y-6` major; `space-y-3` inside |
| Header | Single row, `py-3.5`, `gap-6` between title and controls |

### 1.3 Typography

| Use | Classes |
|-----|---------|
| App title | `font-display text-xl sm:text-2xl font-semibold tracking-tight` |
| Section H2 | `font-display text-2xl font-semibold tracking-tight` |
| Card title | `font-display text-base sm:text-lg font-semibold` |
| Body | `text-sm leading-relaxed` |
| Caption / weights | `font-mono text-[11px] tracking-wide text-ink-muted` |
| Eyebrow | `text-[10px] font-semibold uppercase tracking-[0.16em] text-brass` |
| KPI | `font-mono text-2xl sm:text-4xl tabular-nums` |

### 1.4 Elevation
- Cards: 1px `border-brass-dim`, hairline shadow only — no heavy drops.
- Sticky header: `backdrop-filter: blur(12px)` on semi-opaque surface (`.intended-header`).

---

## 2. Immediate patch (header regression) — P0

**Problem:** Two-row header after “separate tabs” commit.

**Rule:** One horizontal band.

1. Title left: eyebrow + title only (subtitle out of header).
2. Controls right: nav group with `border-r`, then lang/theme utilities quieter.
3. Active nav: brass text only — no thick underline fighting the header border.
4. Apply `.intended-header` (frost + blur).

---

## 3. Feature-creep → seamless integration

| Feature | Friction | Rule |
|---------|----------|------|
| Preference | Longer Step 1 | After stream + overall mark, before grades; one helper line. |
| Sans RIASEC | Third tab | Default stays Scores; intro once; top-3; no seal. |
| Careers | Bolted on | Same card language; soft intro. |
| Analytics | Density | `max-w-4xl`; calm KPI grid; mono dates. |
| Theme | Header noise | Utility only, never brass-filled. |
| Export CSV | Competes with reset | Secondary text link under ghost button. |
| Weight legend | Always loud | One mono line under student meta only. |

---

## 4. Screen-by-screen

### 4.1 Shell
- Ground: `analytics-mesh`. Disclaimer centered, `text-[11px] text-ink-muted/80`.
- One primary CTA in footer action row (`.intended-btn-primary`).

### 4.2 Step indicator
- Active: brass border + semibold ink. Inactive: muted/dim.
- `stepOf` mono caption; then `intended-rule`.

### 4.3 Step 1 / 2 forms
- Only `.intended-field` / `.intended-label`.
- Grades 2×2 on `sm+`. RIASEC preview mono with brass eyebrow.

### 4.4 Results
- Tab order: Scores → Sans RIASEC → Careers.
- Seal on #1 Scores only. Details collapsed by default.
- Sans RIASEC: mono weight line + top-3 cards without bars.

### 4.5 Analytics
- Same header chrome. Filters in one card. Table hover `hover:bg-brass/5`.

---

## 5. Premium polish

- Motion: `analytics-rise` 0.45s; `transition-colors` 150–200ms; honor `prefers-reduced-motion`.
- Focus: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass` on buttons if missing.
- Whitespace: delete a divider before adding a box.

---

## 6. Execution order

1. **P0** Header restore + quiet disclaimer ← shipped with this report.
2. **P1** Results tab chrome consistency.
3. **P1** Button focus rings.
4. **P2** Analytics KPI rhythm.
5. **P2** Form section spacing.
6. **P3** Optional seal opacity entrance only.

---

## 7. Non-goals

- No engine/weight changes.
- No new color brands (no indigo/sky/slate kits).
- No new modal system for LAN admin token.

---

## 8. Acceptance (“godly” bar)

- [ ] Header is one sticky band.
- [ ] Brass is accent, not wallpaper.
- [ ] One primary CTA in wizard footer.
- [ ] Scores is default results tab.
- [ ] Analytics shares header chrome.
- [ ] Light/dark keep contrast without neon.
- [ ] No missing-i18n console errors on first paint.

*Implement P0 immediately after any header regression; P1–P3 are sequential polish without expanding product scope.*
