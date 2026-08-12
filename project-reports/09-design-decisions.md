# 09 — Design Decisions

Record of product decisions made during review (2026-08-12).

---

## 1. Database — Docker is NOT required

**Decision:** Keep using embedded SQLite.

**Reason:**  
The PDF allows SQLite / embedded PostgreSQL. The current implementation already uses `better-sqlite3` and a local file. Docker was only mentioned as one optional packaging approach in Phase 4, not as a requirement for the database itself.

**Implication:** Development and LAN deployment stay simple (start Node process → DB file appears).

---

## 2. Formal tests are skipped

**Decision:** Do not implement the Phase 1 unit-test suite (vitest/jest, edge-case suites, 100-profile benchmarks).

**Reason:**  
The product is a statistical dashboard: users enter data and receive computed specialty fit statistics. Formal automated tests are not required for the current scope.

**Implication:** Quality relies on manual verification of the calculation flow and UI.

---

## 3. RIASEC input = top 3 letters + weights

**Decision:** Student psychometric input is the **top 3 RIASEC letters** (Holland-style code), each with a weight/strength modifier — not a full 6-dimensional vector.

**Examples of shape (to be finalized):**
- Letters: R, I, A, S, E, C
- Exactly three distinct letters
- Each letter carries a numeric weight

**Implication:**  
- Backend types, Zod schema, engine, and persistence must change  
- Frontend Step 2 becomes a letter picker + weight controls  
- Specialty benchmarks can remain 6D; only the student side and the similarity rule change

**Status:** Decision taken — implementation not started yet.

---

## 4. Overall architecture remains

- React SPA (Vite + TypeScript + Tailwind)
- Node.js + Express host
- Local SQLite
- Offline / LAN only
- 70% academic + 30% psychometric final mix (unless later revised)

---

## Open points still to decide

| Topic | Status |
|-------|--------|
| Exact top-3 scoring formula vs specialty benchmark | Open |
| Weight scale for the three letters (1–5, 0–100, sum-to-100, …) | Open |
| Whether specialty RIASEC benchmarks stay full 6D or also simplify | Open |
| Whether `overallBacMark` influences score or is only stored | Currently stored only |
