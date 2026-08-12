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

export const RIASEC_LETTERS = ["R", "I", "A", "S", "E", "C"] as const;

export type BacStream = (typeof BAC_STREAMS)[number];
export type SubjectCode = (typeof SUBJECT_CODES)[number];
export type RiasecLetter = (typeof RIASEC_LETTERS)[number];

export const TECHNICAL_BAC_STREAMS: readonly BacStream[] = [
  "MATHEMATICS",
  "EXPERIMENTAL_SCIENCES",
  "TECHNICAL_MATHEMATICS",
] as const;

export type MatchLabel =
  | "STRONG_MATCH"
  | "STRONG_MATCH_CONVERSATION"
  | "POSSIBLE_FIT"
  | "PROFILE_DEVELOPING"
  | "WEAK_MATCH";

export const MATCH_LABEL_TEXT: Record<MatchLabel, string> = {
  STRONG_MATCH: "Strong match",
  STRONG_MATCH_CONVERSATION: "Strong match — worth a conversation",
  POSSIBLE_FIT: "Possible fit / ambiguous",
  PROFILE_DEVELOPING: "Interested, profile still developing",
  WEAK_MATCH: "Weak match — explore other options",
};

export interface BacGrades {
  grades: Partial<Record<SubjectCode, number>>;
  overallBacMark: number;
}

/** Full 6D vector used for specialty benchmarks and internal math. */
export interface RiasecVector {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

/** Student input: exactly three distinct RIASEC letters with weights (1–100). */
export interface TopRiasecEntry {
  letter: RiasecLetter;
  weight: number;
}

export type TopRiasecProfile = [TopRiasecEntry, TopRiasecEntry, TopRiasecEntry];

export interface StudentProfile {
  studentId?: string;
  fullName: string;
  bacStream: BacStream;
  academicPerformance: BacGrades;
  topRiasec: TopRiasecProfile;
  evaluatedAt?: Date;
}

export interface SubjectWeightMap {
  weights: Partial<Record<SubjectCode, number>>;
}

export interface RiasecBenchmark {
  vector: RiasecVector;
}

export type HollandCode = [RiasecLetter, RiasecLetter, RiasecLetter];

export interface HisSpecialtyConfig {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  isTechnical: boolean;
  hollandCode: HollandCode;
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
  isTechnical: boolean;
  hollandCode: HollandCode;
  academicScore: number;
  psychometricScore: number;
  technicalScore: number;
  finalScore: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  rank: number;
  details: {
    streamModifierApplied: number;
    rawAcademicPercentage: number;
    vectorCosineSimilarity: number;
    codeMatchScore: number;
    cosineComponent: number;
    codeMatchComponent: number;
  };
}

export interface CalculationResult {
  evaluationId: string;
  timestamp: string;
  studentName: string;
  bacStream: BacStream;
  isTechnicalStream: boolean;
  weights: {
    academic: number;
    riasec: number;
    technical: number;
  };
  matches: SpecialtyMatchBreakdown[];
}

export type SeedSpecialty = {
  code: string;
  title: string;
  department: string;
  description: string;
  isTechnical: boolean;
  hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter];
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

export const RIASEC_LETTER_TO_KEY: Record<RiasecLetter, keyof RiasecVector> = {
  R: "realistic",
  I: "investigative",
  A: "artistic",
  S: "social",
  E: "enterprising",
  C: "conventional",
};

export const RIASEC_LABELS: Record<RiasecLetter, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

/** Expand top-3 profile into a sparse 6D vector (unselected dimensions = 0). */
export const topRiasecToVector = (top: TopRiasecProfile): RiasecVector => {
  const vector: RiasecVector = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  for (const entry of top) {
    const key = RIASEC_LETTER_TO_KEY[entry.letter];
    vector[key] = entry.weight;
  }

  return vector;
};

export const isTechnicalBacStream = (stream: BacStream): boolean =>
  (TECHNICAL_BAC_STREAMS as readonly string[]).includes(stream);

export const labelFromFinalScore = (finalScore: number): MatchLabel => {
  if (finalScore >= 80) return "STRONG_MATCH";
  if (finalScore >= 65) return "STRONG_MATCH_CONVERSATION";
  if (finalScore >= 50) return "POSSIBLE_FIT";
  if (finalScore >= 35) return "PROFILE_DEVELOPING";
  return "WEAK_MATCH";
};
