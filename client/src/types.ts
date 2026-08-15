export type BacStream =
  | "MATHEMATICS"
  | "EXPERIMENTAL_SCIENCES"
  | "TECHNICAL_MATHEMATICS"
  | "MANAGEMENT_ECONOMY"
  | "FOREIGN_LANGUAGES"
  | "LITERATURE_PHILOSOPHY";

export type SubjectCode =
  | "MATH"
  | "PHYSICS"
  | "NATURAL_SCIENCES"
  | "PHILOSOPHY"
  | "ARABIC"
  | "FRENCH"
  | "ENGLISH"
  | "ACCOUNTING_FINANCE"
  | "ECONOMICS"
  | "HISTORY_GEOGRAPHY";

export type TechnicalMathOption =
  | "GENIE_ELECTRIQUE"
  | "GENIE_MECANIQUE"
  | "GENIE_CIVIL"
  | "GENIE_PROCEDES";

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export type MatchLabel =
  | "STRONG_MATCH"
  | "STRONG_MATCH_CONVERSATION"
  | "POSSIBLE_FIT"
  | "PROFILE_DEVELOPING"
  | "WEAK_MATCH";

export interface TopRiasecEntry {
  letter: RiasecLetter;
  weight: number;
}

export type TopRiasecProfile = [TopRiasecEntry, TopRiasecEntry, TopRiasecEntry];

export interface StreamGradeSlots {
  main1: SubjectCode;
  main2: SubjectCode;
  opposite: SubjectCode;
  english: SubjectCode;
}

export interface RecommendationInput {
  fullName: string;
  bacStream: BacStream;
  technicalOption?: TechnicalMathOption;
  overallBacMark: number;
  grades: Partial<Record<SubjectCode, number>>;
  topRiasec: TopRiasecProfile;
}

export interface SpecialtyMatchBreakdown {
  specialtyId: string;
  specialtyCode: string;
  specialtyTitle: string;
  department: string;
  description: string;
  isTechnical: boolean;
  hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter];
  academicScore: number;
  psychometricScore: number;
  technicalScore: number;
  finalScore: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  rank: number;
  details: {
    rawAcademicPercentage?: number;
    vectorCosineSimilarity?: number;
    codeMatchScore?: number;
    cosineComponent?: number;
    codeMatchComponent?: number;
    genieBiasPoints?: number;
    slotBreakdown?: {
      main1: number;
      main2: number;
      opposite: number;
      english: number;
    };
    affinityBreakdown?: {
      main1: number;
      main2: number;
      opposite: number;
      english: number;
    };
    technicalStreamBase?: number;
    technicalMarksComponent?: number;
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
  };
  matches: SpecialtyMatchBreakdown[];
}

export interface ConfigResponse {
  bacStreams: BacStream[];
  subjectCodes: SubjectCode[];
  streamSubjects: Record<BacStream, SubjectCode[]>;
  streamGradeSlots: Record<BacStream, StreamGradeSlots>;
  academicSlotWeights: {
    main1: number;
    main2: number;
    opposite: number;
    english: number;
  };
  technicalMathOptions: TechnicalMathOption[];
  technicalMathOptionLabels: Record<TechnicalMathOption, string>;
  riasecLetters: RiasecLetter[];
  riasecLabels: Record<RiasecLetter, string>;
  formulaWeights: { academic: number; riasec: number; technical: number };
}

export const RIASEC_LABELS: Record<RiasecLetter, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export const STREAM_LABELS: Record<BacStream, string> = {
  MATHEMATICS: "Mathematics",
  EXPERIMENTAL_SCIENCES: "Experimental Sciences",
  TECHNICAL_MATHEMATICS: "Technical Mathematics",
  MANAGEMENT_ECONOMY: "Management & Economy",
  FOREIGN_LANGUAGES: "Foreign Languages",
  LITERATURE_PHILOSOPHY: "Literature & Philosophy",
};

export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  MATH: "Mathematics",
  PHYSICS: "Physics",
  NATURAL_SCIENCES: "Natural Sciences",
  PHILOSOPHY: "Philosophy",
  ARABIC: "Arabic",
  FRENCH: "French",
  ENGLISH: "English",
  ACCOUNTING_FINANCE: "Accounting & Finance",
  ECONOMICS: "Economics",
  HISTORY_GEOGRAPHY: "History & Geography",
};

export const SLOT_LABELS: Record<keyof StreamGradeSlots, string> = {
  main1: "Main subject 1",
  main2: "Main subject 2",
  opposite: "Opposite stream",
  english: "English",
};

export const LABEL_STYLES: Record<MatchLabel, string> = {
  STRONG_MATCH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  STRONG_MATCH_CONVERSATION: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  POSSIBLE_FIT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  PROFILE_DEVELOPING: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  WEAK_MATCH: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
