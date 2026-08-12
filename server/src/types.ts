export const BAC_STREAMS = [
  "MATHEMATICS",
  "EXPERIMENTAL_SCIENCES",
  "TECHNICAL_MATHEMATICS",
  "MANAGEMENT_ECONOMY",
  "FOREIGN_LANGUAGES",
  "LITERATURE_PHILOSOPHY",
] as const;

export const SUBJECT_CODES = [
  "MATH",
  "PHYSICS",
  "NATURAL_SCIENCES",
  "PHILOSOPHY",
  "ARABIC",
  "FRENCH",
  "ENGLISH",
  "ACCOUNTING_FINANCE",
  "ECONOMICS",
  "HISTORY_GEOGRAPHY",
] as const;

export type BacStream = (typeof BAC_STREAMS)[number];
export type SubjectCode = (typeof SUBJECT_CODES)[number];

export interface BacGrades {
  grades: Partial<Record<SubjectCode, number>>;
  overallBacMark: number;
}

export interface RiasecVector {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface StudentProfile {
  studentId?: string;
  fullName: string;
  bacStream: BacStream;
  academicPerformance: BacGrades;
  psychometricProfile: RiasecVector;
  evaluatedAt?: Date;
}

export interface SubjectWeightMap {
  weights: Partial<Record<SubjectCode, number>>;
}

export interface RiasecBenchmark {
  vector: RiasecVector;
}

export interface HisSpecialtyConfig {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  subjectWeights: SubjectWeightMap;
  streamModifiers: Record<BacStream, number>;
  riasecBenchmark: RiasecBenchmark;
  isActive: boolean;
}

export interface SpecialtyMatchBreakdown {
  specialtyId: string;
  specialtyCode: string;
  specialtyTitle: string;
  department: string;
  description: string;
  academicScore: number;
  psychometricScore: number;
  finalScore: number;
  rank: number;
  details: {
    streamModifierApplied: number;
    rawAcademicPercentage: number;
    vectorCosineSimilarity: number;
  };
}

export interface CalculationResult {
  evaluationId: string;
  timestamp: string;
  studentName: string;
  bacStream: BacStream;
  matches: SpecialtyMatchBreakdown[];
}

export type SeedSpecialty = {
  code: string;
  title: string;
  department: string;
  description: string;
  weights: Partial<Record<SubjectCode, number>>;
  streamModifiers: Record<BacStream, number>;
  riasecBenchmark: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
};

export const STREAM_SUBJECT_MAP: Record<BacStream, SubjectCode[]> = {
  MATHEMATICS: ["MATH", "PHYSICS", "ENGLISH", "FRENCH"],
  EXPERIMENTAL_SCIENCES: ["NATURAL_SCIENCES", "PHYSICS", "MATH", "ENGLISH"],
  TECHNICAL_MATHEMATICS: ["MATH", "PHYSICS", "ACCOUNTING_FINANCE", "ENGLISH"],
  MANAGEMENT_ECONOMY: ["ACCOUNTING_FINANCE", "ECONOMICS", "MATH", "ENGLISH"],
  FOREIGN_LANGUAGES: ["ENGLISH", "FRENCH", "ARABIC", "HISTORY_GEOGRAPHY"],
  LITERATURE_PHILOSOPHY: ["ARABIC", "PHILOSOPHY", "HISTORY_GEOGRAPHY", "ENGLISH"],
};
