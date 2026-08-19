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

export type StreamGradeSlots = {
  main1: SubjectCode;
  main2: SubjectCode;
  opposite: SubjectCode;
  english: SubjectCode;
};

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

export type TopRiasecEntry = { letter: RiasecLetter; weight: number };
export type TopRiasecProfile = [TopRiasecEntry, TopRiasecEntry, TopRiasecEntry];

export interface MatchDetails {
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
  riasecScore: number;
  psychometricScore: number;
  technicalScore: number;
  preferenceScore: number;
  finalScore: number;
  rank: number;
  matchLabel: MatchLabel;
  matchLabelText: string;
  details: MatchDetails;
  careerPaths?: CareerPath[];
}

export interface CalculationResult {
  evaluationId: string;
  timestamp: string;
  fullName?: string;
  studentName?: string;
  bacStream: BacStream;
  technicalStream?: boolean;
  isTechnicalStream?: boolean;
  preferredSpecialtyCode?: string;
  technicalOption?: TechnicalMathOption;
  hollandCode?: string;
  weights: { academic: number; riasec: number; technical: number; preference: number };
  weightsWithoutRiasec?: {
    academic: number;
    riasec: number;
    technical: number;
    preference: number;
  };
  matches: SpecialtyMatchBreakdown[];
  matchesWithoutRiasec?: SpecialtyMatchBreakdown[];
}

export interface ConfigResponse {
  bacStreams: BacStream[];
  streamLabels: Record<BacStream, string>;
  subjectCodes: SubjectCode[];
  subjectLabels: Record<SubjectCode, string>;
  streamSubjectMap: Record<BacStream, SubjectCode[]>;
  streamGradeSlots: Record<BacStream, StreamGradeSlots>;
  technicalMathOptions: TechnicalMathOption[];
  technicalMathOptionLabels: Record<TechnicalMathOption, string>;
  riasecLetters: RiasecLetter[];
  riasecLabels: Record<RiasecLetter, string>;
  formulaWeights: { academic: number; riasec: number; technical: number; preference: number };
  specialties: Array<{
    id: string;
    code: string;
    title: string;
    department: string;
    isTechnical: boolean;
    hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter];
  }>;
  careerPathsBySpecialty: Record<string, CareerPath[]>;
}

export interface AnalyticsSummary {
  totalEvaluations: number;
  uniqueStudents: number;
  byBacStream: Array<{ key: string; label: string; count: number }>;
  byTopSpecialty: Array<{ key: string; label: string; count: number }>;
  byMatchLabel: Array<{ key: string; label: string; count: number }>;
  averageFinalScore: number | null;
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
  sessions: SessionListRow[];
}

export interface StudentMatchRow {
  specialtyId: string;
  specialtyCode: string;
  specialtyTitle: string;
  department: string;
  description?: string;
  isTechnical?: boolean;
  hollandCode?: [RiasecLetter, RiasecLetter, RiasecLetter];
  academicScore: number;
  psychometricScore?: number;
  riasecScore?: number;
  finalScore: number;
  rank: number;
  finalScoreNoRiasec?: number | null;
  rankNoRiasec?: number | null;
  matchLabel: MatchLabel;
  matchLabelText?: string;
  evaluatedAt?: string;
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
  topRiasec?: Array<{ letter: RiasecLetter; weight: number }> | null;
  riasec?: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
    topRiasec: Array<{ letter: RiasecLetter; weight: number }> | null;
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
  scoreBuckets: Array<{ key: string; label: string; count: number }>;
  byMatchLabel?: Array<{ key: string; label: string; count: number }>;
  dataQuality?: {
    neverRankedSpecialtyCodes?: string[];
    highScoreSessions?: number;
    lowScoreSessions?: number;
    averageFinalScore?: number | null;
    averageOverallBac?: number | null;
    sessionsMissingRiasec?: number;
  };
  filters?: Record<string, unknown>;
}

export const LABEL_STYLES: Record<MatchLabel, string> = {
  STRONG_MATCH: "bg-brass/20 text-brass",
  STRONG_MATCH_CONVERSATION: "bg-brass/15 text-ink",
  POSSIBLE_FIT: "bg-brass-dim/40 text-ink-muted",
  PROFILE_DEVELOPING: "bg-ink-muted/10 text-ink-muted",
  WEAK_MATCH: "bg-burgundy/10 text-burgundy",
};
