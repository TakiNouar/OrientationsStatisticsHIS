export type BacStream =
  | 'MATHEMATICS'
  | 'EXPERIMENTAL_SCIENCES'
  | 'TECHNICAL_MATHEMATICS'
  | 'MANAGEMENT_ECONOMY'
  | 'FOREIGN_LANGUAGES'
  | 'LITERATURE_PHILOSOPHY'

export type SubjectCode =
  | 'MATH'
  | 'PHYSICS'
  | 'NATURAL_SCIENCES'
  | 'PHILOSOPHY'
  | 'ARABIC'
  | 'FRENCH'
  | 'ENGLISH'
  | 'ACCOUNTING_FINANCE'
  | 'ECONOMICS'
  | 'HISTORY_GEOGRAPHY'

export type RiasecVector = {
  realistic: number
  investigative: number
  artistic: number
  social: number
  enterprising: number
  conventional: number
}

export type RecommendationInput = {
  fullName: string
  bacStream: BacStream
  overallBacMark: number
  grades: Partial<Record<SubjectCode, number>>
  riasec: RiasecVector
}

export type SpecialtySummary = {
  id: string
  code: string
  title: string
  department: string
  description: string
  streamModifiers: Record<BacStream, number>
  subjectWeights: Partial<Record<SubjectCode, number>>
  riasecBenchmark: RiasecVector
}

export type ConfigResponse = {
  bacStreams: BacStream[]
  subjectCodes: SubjectCode[]
  streamSubjects: Record<BacStream, SubjectCode[]>
  specialties: SpecialtySummary[]
}

export type Match = {
  specialtyId: string
  specialtyCode: string
  specialtyTitle: string
  department: string
  description: string
  academicScore: number
  psychometricScore: number
  finalScore: number
  rank: number
  details: {
    streamModifierApplied: number
    rawAcademicPercentage: number
    vectorCosineSimilarity: number
  }
}

export type CalculationResult = {
  evaluationId: string
  timestamp: string
  studentName: string
  bacStream: BacStream
  matches: Match[]
}
