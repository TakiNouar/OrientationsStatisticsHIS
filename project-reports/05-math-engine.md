# 05 — Math Engine (Current Implementation)

**File:** `server/src/engine.ts`

## Weights

- Academic contribution: **70%**
- Psychometric contribution: **30%**

## Academic score (implemented)

1. Take only subjects that appear in both the specialty weights and the student’s grades.
2. Compute:

\[
S_{\text{base}} = \frac{\sum (w_k \cdot g_k)}{20 \cdot \sum w_k} \times 100
\]

3. Multiply by the stream modifier for the student’s BAC stream:

\[
S_{\text{academic}} = S_{\text{base}} \times \mu_{s,i}
\]

Missing grades are simply omitted from the sums (dynamic subset).

## Psychometric score (current — full 6D)

Student and specialty are both 6D vectors:  
`[R, I, A, S, E, C]`

Cosine similarity:

\[
\text{CosSim} = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \cdot \|\vec{v}\|}
\]

\[
S_{\text{riasec}} = \text{CosSim} \times 100
\]

**Zero-vector handling:** if either magnitude is 0, the engine returns a neutral **50%** (hard-coded).  
This differs slightly from the PDF’s claim that substituting `[1,1,1,1,1,1]` always yields 0.50 (that claim is only true for uniform benchmarks).

## Final score

\[
S_{\text{final}} = 0.70 \cdot S_{\text{academic}} + 0.30 \cdot S_{\text{riasec}}
\]

Matches are sorted descending by final score and given rank 1…N.

## Pending change

The product owner has decided the **student input** will be the **top 3 RIASEC letters**, each with a weight/strength, instead of a full 6D vector.

The engine will need to be updated so the psychometric part scores “top-3 profile vs specialty benchmark” instead of pure 6D cosine.  
Exact formula for that comparison is still to be finalized.
