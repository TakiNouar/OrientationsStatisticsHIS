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

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export type RiasecVector = {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
};

export type TopRiasecEntry = {
  letter: RiasecLetter;
  weight: number;
};

export type TopRiasecProfile = [TopRiasecEntry, TopRiasecEntry, TopRiasecEntry];

export type RecommendationInput = {
  fullName: string;
  bacStream: BacStream;
  overallBacMark: number;
  grades: Partial<Record<SubjectCode, number>>;
  topRiasec: TopRiasecProfile;
};

export type SpecialtySummary = {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  streamModifiers: Record<BacStream, number>;
  subjectWeights: Partial<Record<SubjectCode, number>>;
  riasecBenchmark: RiasecVector;
};

export type ConfigResponse = {
  bacStreams: BacStream[];
  subjectCodes: SubjectCode[];
  streamSubjects: Record<BacStream, SubjectCode[]>;
  riasecLetters: RiasecLetter[];
  riasecLabels: Record<RiasecLetter, string>;
  specialties: SpecialtySummary[];
};

export type Match = {
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
};

export type CalculationResult = {
  evaluationId: string;
  timestamp: string;
  studentName: string;
  bacStream: BacStream;
  matches: Match[];
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

export const STREAM_LABELS: Record<BacStream, string> = {
  MATHEMATICS: "Mathematics",
  EXPERIMENTAL_SCIENCES: "Experimental Sciences",
  TECHNICAL_MATHEMATICS: "Technical Mathematics",
  MANAGEMENT_ECONOMY: "Management & Economy",
  FOREIGN_LANGUAGES: "Foreign Languages",
  LITERATURE_PHILOSOPHY: "Literature & Philosophy",
};
