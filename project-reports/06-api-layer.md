# 06 — API Layer

**File:** `server/src/index.ts`  
**Base:** `http://localhost:3001` (default)

## Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/api/v1/health` | Done | Liveness / service info |
| GET | `/api/v1/config` | Done | Streams, subjects, stream→subjects map, active specialties |
| POST | `/api/v1/recommendations/calculate` | Done | Main calculation + async persistence |
| GET | `/api/v1/export/evaluations?format=csv` | Done | Institutional CSV dump |

## Main calculation contract (current)

**Request body (Zod validated):**

```ts
{
  fullName: string          // 2–250 chars
  bacStream: BacStream
  overallBacMark: number    // 0–20
  grades: Record<SubjectCode, number>   // required subjects for the stream must be present
  riasec: {
    realistic: number       // currently 0–100
    investigative: number
    artistic: number
    social: number
    enterprising: number
    conventional: number
  }
}
```

**Response:**

```ts
{
  evaluationId: string
  timestamp: string
  studentName: string
  bacStream: BacStream
  matches: SpecialtyMatchBreakdown[]   // ranked, with academic / psychometric / final scores + details
}
```

## Validation highlights

- Stream-specific required subjects are enforced in a Zod `superRefine`
- Grades must be in [0, 20]
- RIASEC values currently accepted in [0, 100]

## Notes for upcoming top-3 change

The `riasec` object in the request body will be replaced (or supplemented) by a top-3 structure, for example:

```ts
topRiasec: [
  { letter: 'R' | 'I' | 'A' | 'S' | 'E' | 'C', weight: number },
  // exactly 3 distinct letters
]
```

Zod schema, types, engine, and persistence will all need a coordinated update.
