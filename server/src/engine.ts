import type {
  CalculationResult,
  HisSpecialtyConfig,
  HollandCode,
  RiasecLetter,
  RiasecVector,
  SpecialtyMatchBreakdown,
  StudentProfile,
  SubjectCode,
  TopRiasecProfile,
} from "./types.js";
import {
  isTechnicalBacStream,
  labelFromFinalScore,
  MATCH_LABEL_TEXT,
  topRiasecToVector,
} from "./types.js";

/** Phase A weights: academic / RIASEC / technical alignment */
const ACADEMIC_WEIGHT = 0.4;
const RIASEC_WEIGHT = 0.3;
const TECHNICAL_WEIGHT = 0.3;

/** Hybrid RIASEC: emphasize Holland code match over pure cosine */
const COSINE_BLEND = 0.3;
const CODE_MATCH_BLEND = 0.7;

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

const cosineSimilarity = (a: RiasecVector, b: RiasecVector): number => {
  const va = getVectorValues(a);
  const vb = getVectorValues(b);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < va.length; i += 1) {
    dot += va[i] * vb[i];
    normA += va[i] * va[i];
    normB += vb[i] * vb[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Holland-code match (0–100).
 * Specialty code positions weighted 50 / 35 / 15.
 * Presence of letter + student weight strength + same-rank bonus.
 */
export const codeMatchScore = (
  top: TopRiasecProfile,
  hollandCode: HollandCode,
): number => {
  const studentOrder = top.map((entry) => entry.letter) as RiasecLetter[];
  const weightByLetter: Partial<Record<RiasecLetter, number>> = {};
  for (const entry of top) {
    weightByLetter[entry.letter] = entry.weight;
  }

  const maxWeight = Math.max(...top.map((entry) => entry.weight), 1);
  const positionWeights = [50, 35, 15];
  const maxPossible = positionWeights.reduce((sum, value) => sum + value, 0);

  let score = 0;

  for (let i = 0; i < 3; i += 1) {
    const letter = hollandCode[i];
    const studentWeight = weightByLetter[letter];
    if (studentWeight === undefined) {
      continue;
    }

    const studentIdx = studentOrder.indexOf(letter);
    const strength = studentWeight / maxWeight;
    let credit = positionWeights[i] * (0.45 + 0.55 * strength);

    if (studentIdx === i) {
      credit *= 1.2;
    }

    score += credit;
  }

  return toFixedNumber(Math.min(100, (score / maxPossible) * 100));
};

export const technicalAlignmentScore = (
  bacStream: StudentProfile["bacStream"],
  specialtyIsTechnical: boolean,
): number => {
  const studentTechnical = isTechnicalBacStream(bacStream);

  if (studentTechnical && specialtyIsTechnical) return 100;
  if (studentTechnical && !specialtyIsTechnical) return 20;
  if (!studentTechnical && !specialtyIsTechnical) return 80;
  return 30;
};

const calculateAcademicScore = (
  studentProfile: StudentProfile,
  specialty: HisSpecialtyConfig,
): { academicScore: number; rawAcademicPercentage: number; streamModifier: number } => {
  const streamModifier = specialty.streamModifiers[studentProfile.bacStream] ?? 0.75;
  const weightEntries = Object.entries(specialty.subjectWeights.weights) as [
    SubjectCode,
    number,
  ][];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [subject, weight] of weightEntries) {
    const grade = studentProfile.academicPerformance.grades[subject];
    if (typeof grade !== "number") {
      continue;
    }

    weightedSum += grade * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return {
      academicScore: 0,
      rawAcademicPercentage: 0,
      streamModifier,
    };
  }

  const rawAcademicPercentage = (weightedSum / totalWeight / 20) * 100;
  const academicScore = rawAcademicPercentage * streamModifier;

  return {
    academicScore: toFixedNumber(Math.min(academicScore, 100)),
    rawAcademicPercentage: toFixedNumber(rawAcademicPercentage),
    streamModifier,
  };
};

export const calculateRecommendations = (
  studentProfile: StudentProfile,
  specialties: HisSpecialtyConfig[],
): CalculationResult => {
  const studentVector = topRiasecToVector(studentProfile.topRiasec);
  const technicalStream = isTechnicalBacStream(studentProfile.bacStream);

  const matches: SpecialtyMatchBreakdown[] = specialties
    .filter((specialty) => specialty.isActive)
    .map((specialty) => {
      const academic = calculateAcademicScore(studentProfile, specialty);

      const cosine = cosineSimilarity(studentVector, specialty.riasecBenchmark.vector);
      const cosineScore = cosine * 100;
      const codeScore = codeMatchScore(studentProfile.topRiasec, specialty.hollandCode);
      const psychometricScore = toFixedNumber(
        COSINE_BLEND * cosineScore + CODE_MATCH_BLEND * codeScore,
      );

      const technicalScore = technicalAlignmentScore(
        studentProfile.bacStream,
        specialty.isTechnical,
      );

      const finalScore = toFixedNumber(
        ACADEMIC_WEIGHT * academic.academicScore +
          RIASEC_WEIGHT * psychometricScore +
          TECHNICAL_WEIGHT * technicalScore,
      );

      const matchLabel = labelFromFinalScore(finalScore);

      return {
        specialtyId: specialty.id,
        specialtyCode: specialty.code,
        specialtyTitle: specialty.title,
        department: specialty.department,
        description: specialty.description,
        isTechnical: specialty.isTechnical,
        hollandCode: specialty.hollandCode,
        academicScore: academic.academicScore,
        psychometricScore,
        technicalScore,
        finalScore,
        matchLabel,
        matchLabelText: MATCH_LABEL_TEXT[matchLabel],
        rank: 0,
        details: {
          streamModifierApplied: academic.streamModifier,
          rawAcademicPercentage: academic.rawAcademicPercentage,
          vectorCosineSimilarity: toFixedNumber(cosine, 4),
          codeMatchScore: codeScore,
          cosineComponent: toFixedNumber(COSINE_BLEND * cosineScore),
          codeMatchComponent: toFixedNumber(CODE_MATCH_BLEND * codeScore),
        },
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((match, index) => ({
      ...match,
      rank: index + 1,
    }));

  return {
    evaluationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    studentName: studentProfile.fullName,
    bacStream: studentProfile.bacStream,
    isTechnicalStream: technicalStream,
    weights: {
      academic: ACADEMIC_WEIGHT,
      riasec: RIASEC_WEIGHT,
      technical: TECHNICAL_WEIGHT,
    },
    matches,
  };
};
