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
  STRONG_MATCH_CONVERSATION: "Strong match — conversation recommended",
  POSSIBLE_FIT: "Possible fit",
  PROFILE_DEVELOPING: "Profile developing",
  WEAK_MATCH: "Weak match",
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
  MATHEMATICS: { main1: "MATH", main2: "PHYSICS", opposite: "ARABIC", english: "ENGLISH" },
  EXPERIMENTAL_SCIENCES: {
    main1: "NATURAL_SCIENCES",
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
    main1: "FRENCH",
    main2: "ENGLISH",
    opposite: "MATH",
    english: "ARABIC",
  },
  LITERATURE_PHILOSOPHY: {
    main1: "PHILOSOPHY",
    main2: "ARABIC",
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

/** Final score blend (must match engine.ts). */
export const FORMULA_WEIGHTS = {
  academic: 0.5,
  riasec: 0.25,
  technical: 0.2,
  preference: 0.05,
} as const;

export const STREAM_LABELS: Record<BacStream, string> = {
  MATHEMATICS: "Mathematics",
  EXPERIMENTAL_SCIENCES: "Experimental sciences",
  TECHNICAL_MATHEMATICS: "Technical mathematics",
  MANAGEMENT_ECONOMY: "Management & economy",
  FOREIGN_LANGUAGES: "Foreign languages",
  LITERATURE_PHILOSOPHY: "Literature & philosophy",
};

export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  MATH: "Mathematics",
  PHYSICS: "Physics",
  NATURAL_SCIENCES: "Natural sciences",
  PHILOSOPHY: "Philosophy",
  ARABIC: "Arabic",
  FRENCH: "French",
  ENGLISH: "English",
  ACCOUNTING_FINANCE: "Accounting & finance",
  ECONOMICS: "Economics",
  HISTORY_GEOGRAPHY: "History & geography",
};

export const AFFINITY_MIN = 0.6;
export const AFFINITY_MAX = 1.8;

/** RIASEC: cosine vs Holland code-match blend */
export const COSINE_BLEND = 0.3;
export const CODE_MATCH_BLEND = 0.7;

/** Technical fit: stream base vs marks component */
export const STREAM_BLEND = 0.45;
export const MARKS_BLEND = 0.55;

export const STREAM_SUBJECT_MAP: Record<BacStream, SubjectCode[]> = {
  MATHEMATICS: ["MATH", "PHYSICS", "ARABIC", "ENGLISH"],
  EXPERIMENTAL_SCIENCES: ["NATURAL_SCIENCES", "PHYSICS", "MATH", "ARABIC", "ENGLISH"],
  TECHNICAL_MATHEMATICS: ["MATH", "PHYSICS", "ARABIC", "ENGLISH"],
  MANAGEMENT_ECONOMY: ["ACCOUNTING_FINANCE", "ECONOMICS", "MATH", "ARABIC", "ENGLISH"],
  FOREIGN_LANGUAGES: ["FRENCH", "ENGLISH", "ARABIC", "PHILOSOPHY"],
  LITERATURE_PHILOSOPHY: ["PHILOSOPHY", "ARABIC", "FRENCH", "HISTORY_GEOGRAPHY", "ENGLISH"],
};

export type RiasecVector = {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
};

export type TopRiasecEntry = { letter: RiasecLetter; weight: number };
export type TopRiasecProfile = [TopRiasecEntry, TopRiasecEntry, TopRiasecEntry];

export type HollandCode = [RiasecLetter, RiasecLetter, RiasecLetter];

export type SubjectWeightMap = {
  [K in SubjectCode]?: number;
};

export type RiasecBenchmark = {
  vector: RiasecVector;
  hollandCode: HollandCode;
};

export interface StudentProfile {
  fullName: string;
  bacStream: BacStream;
  technicalOption?: TechnicalMathOption;
  preferredSpecialtyCode?: string;
  academicPerformance: {
    overallBacMark: number;
    grades: Partial<Record<SubjectCode, number>>;
  };
  topRiasec: TopRiasecProfile;
}

export interface HisSpecialtyConfig {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  isTechnical: boolean;
  hollandCode: HollandCode;
  riasecBenchmark: RiasecBenchmark;
  subjectWeights: SubjectWeightMap;
  active: boolean;
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
  riasecScore: number;
  psychometricScore: number;
  technicalScore: number;
  preferenceScore: number;
  finalScore: number;
  rank: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  details: {
    rawAcademicPercentage: number;
    vectorCosineSimilarity: number;
    codeMatchScore: number;
    preferenceScore: number;
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
  careerPaths?: CareerPath[];
}

export interface CalculationResult {
  evaluationId?: string;
  timestamp: string;
  fullName: string;
  bacStream: BacStream;
  technicalStream: boolean;
  preferredSpecialtyCode?: string;
  technicalOption?: TechnicalMathOption;
  hollandCode: string;
  weights: {
    academic: number;
    riasec: number;
    technical: number;
    preference: number;
  };
  weightsWithoutRiasec?: {
    academic: number;
    riasec: number;
    technical: number;
    preference: number;
  };
  matches: SpecialtyMatchBreakdown[];
  matchesWithoutRiasec?: SpecialtyMatchBreakdown[];
}

export type CareerPath = {
  id: string;
  specialtyCode: string;
  titleFr: string;
  titleEn: string;
  sectorFr: string;
  sectorEn: string;
  level: string;
  descriptionFr: string;
  descriptionEn: string;
  examplesFr: string[];
  examplesEn: string[];
};

export type SeedSpecialty = {
  code: string;
  title: string;
  department: string;
  description: string;
  isTechnical: boolean;
  hollandCode: HollandCode;
  subjectWeights: SubjectWeightMap;
  active?: boolean;
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

export const LABEL_STYLES: Record<MatchLabel, string> = {
  STRONG_MATCH: "bg-brass/20 text-ink",
  STRONG_MATCH_CONVERSATION: "bg-brass/15 text-ink",
  POSSIBLE_FIT: "bg-brass-dim/30 text-ink-muted",
  PROFILE_DEVELOPING: "bg-surface text-ink-muted",
  WEAK_MATCH: "bg-burgundy/10 text-burgundy",
};
