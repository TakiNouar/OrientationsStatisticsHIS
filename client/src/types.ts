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
  preferredSpecialtyCode: string;
  overallBacMark: number;
  grades: Partial<Record<SubjectCode, number>>;
  topRiasec: TopRiasecProfile;
}

export interface CareerPath {
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
}

export interface MatchDetails {
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
  preferenceScore: number;
  finalScore: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  rank: number;
  careerPaths?: CareerPath[];
  details: MatchDetails;
}

export interface CalculationResult {
  evaluationId: string;
  timestamp: string;
  studentName: string;
  bacStream: BacStream;
  technicalOption?: TechnicalMathOption;
  isTechnicalStream: boolean;
  weights: { academic: number; riasec: number; technical: number; preference: number };
  matches: SpecialtyMatchBreakdown[];
  persisted?: boolean;
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
  affinityRange: { min: number; max: number };
  technicalMathOptions: TechnicalMathOption[];
  technicalMathOptionLabels: Record<TechnicalMathOption, string>;
  riasecLetters: RiasecLetter[];
  riasecLabels: Record<RiasecLetter, string>;
  formulaWeights: { academic: number; riasec: number; technical: number; preference: number };
  careerPathsBySpecialty: Record<string, CareerPath[]>;
  adminAuthRequired: boolean;
  specialties: Array<{
    id: string;
    code: string;
    title: string;
    department: string;
    description: string;
    isTechnical: boolean;
    hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter];
    streamModifiers: Record<BacStream, number>;
    subjectWeights: Partial<Record<SubjectCode, number>>;
    riasecBenchmark: Record<string, number>;
  }>;
}

export interface AnalyticsCountRow {
  key: string;
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  byStream: AnalyticsCountRow[];
  byTopSpecialty: AnalyticsCountRow[];
  byMatchLabel: AnalyticsCountRow[];
  filters: {
    from?: string;
    to?: string;
    bacStream?: string;
    specialtyCode?: string;
  };
}

export interface SessionListRow {
  studentId: string;
  fullName: string;
  evaluatedAt: string;
  bacStream: string;
  overallBacMark: number;
  topSpecialtyCode: string;
  topSpecialtyTitle: string;
  department: string;
  finalScore: number;
  matchLabel: MatchLabel;
  academicScore: number;
  riasecScore: number;
}

export interface AnalyticsRecentResponse {
  rows: SessionListRow[];
  filters: AnalyticsSummary["filters"];
  limit: number;
}

export interface StudentMatchRow {
  specialtyId: string;
  specialtyCode: string;
  specialtyTitle: string;
  department: string;
  description: string;
  isTechnical: boolean;
  hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter];
  academicScore: number;
  psychometricScore: number;
  finalScore: number;
  rank: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  evaluatedAt: string;
}

export interface StudentProfileDetail {
  studentId: string;
  fullName: string;
  bacStream: string;
  overallBacMark: number;
  preferredSpecialtyCode?: string | null;
  preferredSpecialtyTitle?: string | null;
  createdAt: string;
  grades: Record<string, number>;
  topRiasec: Array<{ letter: RiasecLetter; weight: number }> | null;
  riasecVector: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  } | null;
  matches: StudentMatchRow[];
}

export interface AnalyticsDashboard {
  volumeByDay: Array<{ date: string; count: number }>;
  streamSpecialtyMatrix: Array<{
    bacStream: string;
    specialtyCode: string;
    specialtyTitle: string;
    count: number;
  }>;
  scoreBuckets: Array<{
    key: string;
    label: string;
    min: number;
    max: number;
    count: number;
  }>;
  byMatchLabel: AnalyticsCountRow[];
  dataQuality: {
    neverRankedSpecialtyCodes: Array<{ code: string; title: string }>;
    highScoreSessions: number;
    lowScoreSessions: number;
    averageFinalScore: number | null;
    averageOverallBac: number | null;
    sessionsMissingRiasec: number;
  };
  filters: AnalyticsSummary["filters"];
}

export const LABEL_STYLES: Record<MatchLabel, string> = {
  STRONG_MATCH: "bg-brass text-parchment",
  STRONG_MATCH_CONVERSATION: "bg-brass/15 text-brass border border-brass/40",
  POSSIBLE_FIT: "bg-brass-dim/30 text-ink",
  PROFILE_DEVELOPING: "bg-brass-dim/20 text-ink-muted",
  WEAK_MATCH: "border border-burgundy/40 text-burgundy",
};
