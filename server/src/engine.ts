import type {
  CalculationResult,
  HisSpecialtyConfig,
  RiasecVector,
  SpecialtyMatchBreakdown,
  StudentProfile,
  SubjectCode,
} from "./types.js";

const ACADEMIC_WEIGHT = 0.7;
const PSYCHOMETRIC_WEIGHT = 0.3;

const toFixedNumber = (value: number, digits = 2): number =>
  Number.parseFloat(value.toFixed(digits));

const getVectorValues = (vector: RiasecVector): number[] => [
  vector.realistic,
  vector.investigative,
  vector.artistic,
  vector.social,
  vector.enterprising,
  vector.conventional,
];

const dotProduct = (left: number[], right: number[]): number =>
  left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);

const magnitude = (vector: number[]): number =>
  Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

const calculateAcademicBase = (
  grades: Partial<Record<SubjectCode, number>>,
  weights: Partial<Record<SubjectCode, number>>,
): number => {
  const weightedEntries = Object.entries(weights).filter(
    ([subject, weight]) => typeof grades[subject as SubjectCode] === "number" && typeof weight === "number",
  );

  if (weightedEntries.length === 0) {
    return 0;
  }

  const numerator = weightedEntries.reduce((sum, [subject, weight]) => {
    const grade = grades[subject as SubjectCode] ?? 0;
    return sum + grade * weight;
  }, 0);

  const denominator = weightedEntries.reduce((sum, [, weight]) => sum + 20 * weight, 0);

  if (denominator === 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
};

const calculatePsychometricScore = (
  studentVector: RiasecVector,
  benchmarkVector: RiasecVector,
): { cosineSimilarity: number; percentage: number } => {
  const studentValues = getVectorValues(studentVector);
  const benchmarkValues = getVectorValues(benchmarkVector);
  const studentMagnitude = magnitude(studentValues);
  const benchmarkMagnitude = magnitude(benchmarkValues);

  // Neutral fallback aligned with the specification's zero-vector handling.
  if (studentMagnitude === 0 || benchmarkMagnitude === 0) {
    return {
      cosineSimilarity: 0.5,
      percentage: 50,
    };
  }

  const cosineSimilarity = dotProduct(studentValues, benchmarkValues) / (studentMagnitude * benchmarkMagnitude);

  return {
    cosineSimilarity,
    percentage: cosineSimilarity * 100,
  };
};

export const calculateRecommendations = (
  studentProfile: StudentProfile,
  specialties: HisSpecialtyConfig[],
): CalculationResult => {
  const rankedMatches: SpecialtyMatchBreakdown[] = specialties
    .filter((specialty) => specialty.isActive)
    .map((specialty) => {
      const rawAcademicPercentage = calculateAcademicBase(
        studentProfile.academicPerformance.grades,
        specialty.subjectWeights.weights,
      );
      const streamModifierApplied = specialty.streamModifiers[studentProfile.bacStream];
      const academicScore = rawAcademicPercentage * streamModifierApplied;
      const psychometric = calculatePsychometricScore(
        studentProfile.psychometricProfile,
        specialty.riasecBenchmark.vector,
      );
      const finalScore = academicScore * ACADEMIC_WEIGHT + psychometric.percentage * PSYCHOMETRIC_WEIGHT;

      return {
        specialtyId: specialty.id,
        specialtyCode: specialty.code,
        specialtyTitle: specialty.title,
        department: specialty.department,
        description: specialty.description,
        academicScore: toFixedNumber(academicScore),
        psychometricScore: toFixedNumber(psychometric.percentage),
        finalScore: toFixedNumber(finalScore),
        rank: 0,
        details: {
          streamModifierApplied: toFixedNumber(streamModifierApplied),
          rawAcademicPercentage: toFixedNumber(rawAcademicPercentage),
          vectorCosineSimilarity: toFixedNumber(psychometric.cosineSimilarity, 3),
        },
      };
    })
    .sort((left, right) => right.finalScore - left.finalScore)
    .map((match, index) => ({
      ...match,
      rank: index + 1,
    }));

  return {
    evaluationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    studentName: studentProfile.fullName,
    bacStream: studentProfile.bacStream,
    matches: rankedMatches,
  };
};
