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

export const TECHNICAL_MATH_OPTIONS = [
  "GENIE_ELECTRIQUE",
  "GENIE_MECANIQUE",
  "GENIE_CIVIL",
  "GENIE_PROCEDES",
] as const;

export const RIASEC_LETTERS = ["R", "I", "A", "S", "E", "C"] as const;

export type BacStream = (typeof BAC_STREAMS)[number];
export type SubjectCode = (typeof SUBJECT_CODES)[number];
export type TechnicalMathOption = (typeof TECHNICAL_MATH_OPTIONS)[number];
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

export const TECHNICAL_MATH_OPTION_LABELS: Record<TechnicalMathOption, string> = {
  GENIE_ELECTRIQUE: "Génie électrique",
  GENIE_MECANIQUE: "Génie mécanique",
  GENIE_CIVIL: "Génie civil",
  GENIE_PROCEDES: "Génie des procédés",
};

export type StreamGradeSlots = {
  main1: SubjectCode;
  main2: SubjectCode;
  opposite: SubjectCode;
  english: SubjectCode;
};

export const STREAM_GRADE_SLOTS: Record<BacStream, StreamGradeSlots> = {
  MATHEMATICS: {
    main1: "MATH",
    main2: "PHYSICS",
    opposite: "ARABIC",
    english: "ENGLISH",
  },
  EXPERIMENTAL_SCIENCES: {
    main1: "MATH",
    main2: "PHYSICS",
    opposite: "ARABIC",
    english: "ENGLISH",
  },
  TECHNICAL_MATHEMATICS: {
    main1: "MATH",
    main2: "PHYSICS",
    opposite: "ARABIC",
    english: "ENGLISH",
  },
  MANAGEMENT_ECONOMY: {
    main1: "ACCOUNTING_FINANCE",
    main2: "ECONOMICS",
    opposite: "MATH",
    english: "ENGLISH",
  },
  FOREIGN_LANGUAGES: {
    main1: "ARABIC",
    main2: "FRENCH",
    opposite: "MATH",
    english: "ENGLISH",
  },
  LITERATURE_PHILOSOPHY: {
    main1: "ARABIC",
    main2: "PHILOSOPHY",
    opposite: "MATH",
    english: "ENGLISH",
  },
};

export const ACADEMIC_SLOT_WEIGHTS = {
  main1: 0.4,
  main2: 0.3,
  opposite: 0.2,
  english: 0.1,
} as const;

export const AFFINITY_MIN = 0.6;
export const AFFINITY_MAX = 1.8;

export const STREAM_SUBJECT_MAP: Record<BacStream, SubjectCode[]> = {
  MATHEMATICS: ["MATH", "PHYSICS", "ARABIC", "ENGLISH"],
  EXPERIMENTAL_SCIENCES: ["MATH", "PHYSICS", "ARABIC", "ENGLISH"],
  TECHNICAL_MATHEMATICS: ["MATH", "PHYSICS", "ARABIC", "ENGLISH"],
  MANAGEMENT_ECONOMY: ["ACCOUNTING_FINANCE", "ECONOMICS", "MATH", "ENGLISH"],
  FOREIGN_LANGUAGES: ["ARABIC", "FRENCH", "MATH", "ENGLISH"],
  LITERATURE_PHILOSOPHY: ["ARABIC", "PHILOSOPHY", "MATH", "ENGLISH"],
};

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

export interface TopRiasecEntry {
  letter: RiasecLetter;
  weight: number;
}

export type TopRiasecProfile = [TopRiasecEntry, TopRiasecEntry, TopRiasecEntry];

export interface StudentProfile {
  studentId?: string;
  fullName: string;
  bacStream: BacStream;
  technicalOption?: TechnicalMathOption;
  preferredSpecialtyCode: string;
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
  preferenceScore: number;
  finalScore: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  rank: number;
  details: {
    rawAcademicPercentage: number;
    vectorCosineSimilarity: number;
    codeMatchScore: number;
    cosineComponent: number;
    codeMatchComponent: number;
    genieBiasPoints: number;
    slotBreakdown: {
      main1: number;
      main2: number;
      opposite: number;
      english: number;
    };
    affinityBreakdown: {
      main1: number;
      main2: number;
      opposite: number;
      english: number;
    };
    technicalStreamBase: number;
    technicalMarksComponent: number;
  };
}

export interface CalculationResult {
  evaluationId: string;
  timestamp: string;
  studentName: string;
  bacStream: BacStream;
  technicalOption?: TechnicalMathOption;
  isTechnicalStream: boolean;
  weights: {
    academic: number;
    riasec: number;
    technical: number;
    preference: number;
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

/**
 * Specialty-dependent academic slots (model A, choice 2).
 * Aligned stream↔specialty polarity keeps STREAM_GRADE_SLOTS.
 * Mismatch flips identity subjects into main weights and core subjects into opposite.
 */
export const resolveAcademicSlots = (
  bacStream: BacStream,
  specialtyIsTechnical: boolean,
): StreamGradeSlots => {
  const base = STREAM_GRADE_SLOTS[bacStream];
  const studentTechnical = isTechnicalBacStream(bacStream);
  if (specialtyIsTechnical === studentTechnical) {
    return base;
  }
  return {
    main1: base.opposite,
    main2: base.english,
    opposite: base.main1,
    english: base.english,
  };
};

export const labelFromFinalScore = (finalScore: number): MatchLabel => {
  if (finalScore >= 80) return "STRONG_MATCH";
  if (finalScore >= 65) return "STRONG_MATCH_CONVERSATION";
  if (finalScore >= 50) return "POSSIBLE_FIT";
  if (finalScore >= 35) return "PROFILE_DEVELOPING";
  return "WEAK_MATCH";
};
