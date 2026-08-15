import type {
  BacStream,
  CalculationResult,
  HisSpecialtyConfig,
  HollandCode,
  RiasecLetter,
  RiasecVector,
  SpecialtyMatchBreakdown,
  StudentProfile,
  SubjectCode,
  TechnicalMathOption,
  TopRiasecProfile,
} from "./types.js";
import {
  ACADEMIC_SLOT_WEIGHTS,
  isTechnicalBacStream,
  labelFromFinalScore,
  MATCH_LABEL_TEXT,
  STREAM_GRADE_SLOTS,
  topRiasecToVector,
} from "./types.js";

/** Phase A weights: academic / RIASEC / technical alignment */
const ACADEMIC_WEIGHT = 0.4;
const RIASEC_WEIGHT = 0.4;
const TECHNICAL_WEIGHT = 0.2;

/** Hybrid RIASEC: emphasize Holland code match over pure cosine */
const COSINE_BLEND = 0.3;
const CODE_MATCH_BLEND = 0.7;

/** Affinity boost range for specialty-aligned subjects (never below 1 = no debuff). */
const AFFINITY_MIN = 1.0;
const AFFINITY_MAX = 1.35;

/**
 * Génie option → specialty code bias points (added to final score, clamped).
 * Strongest on matching technical HIS programmes.
 */
const GENIE_BIAS: Record<TechnicalMathOption, Partial<Record<string, number>>> = {
  GENIE_ELECTRIQUE: {
    "HIS-ELEC": 8,
    "HIS-INFO-SI": 5,
    "HIS-SEC-SI": 5,
  },
  GENIE_MECANIQUE: {
    "HIS-ELEC": 4,
    "HIS-INFO-SI": 3,
    "HIS-SEC-SI": 2,
  },
  GENIE_CIVIL: {
    "HIS-ELEC": 3,
    "HIS-INFO-SI": 2,
  },
  GENIE_PROCEDES: {
    "HIS-ELEC": 5,
    "HIS-SEC-SI": 3,
    "HIS-INFO-SI": 2,
  },
};

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
  bacStream: BacStream,
  specialtyIsTechnical: boolean,
): number => {
  const studentTechnical = isTechnicalBacStream(bacStream);

  // Softened cross-stream penalties so strong opposite grades can still flip ranks.
  if (studentTechnical && specialtyIsTechnical) return 100;
  if (studentTechnical && !specialtyIsTechnical) return 35;
  if (!studentTechnical && !specialtyIsTechnical) return 85;
  return 40;
};

/**
 * Specialty affinity for a subject: boost only (never < 1).
 * Uses the specialty's subjectWeights relative to its max weight.
 */
const subjectAffinity = (
  specialty: HisSpecialtyConfig,
  subject: SubjectCode,
): number => {
  const weights = specialty.subjectWeights.weights;
  const values = Object.values(weights).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return AFFINITY_MIN;

  const maxW = Math.max(...values);
  const subjectW = weights[subject];
  if (typeof subjectW !== "number" || maxW <= 0) {
    return AFFINITY_MIN;
  }

  const ratio = subjectW / maxW; // 0..1
  return AFFINITY_MIN + (AFFINITY_MAX - AFFINITY_MIN) * ratio;
};

const calculateAcademicScore = (
  studentProfile: StudentProfile,
  specialty: HisSpecialtyConfig,
): {
  academicScore: number;
  rawAcademicPercentage: number;
  streamModifier: number;
  slotBreakdown: { main1: number; main2: number; opposite: number; english: number };
} => {
  const streamModifier = specialty.streamModifiers[studentProfile.bacStream] ?? 0.75;
  const slots = STREAM_GRADE_SLOTS[studentProfile.bacStream];
  const grades = studentProfile.academicPerformance.grades;

  const slotDefs = [
    { key: "main1" as const, subject: slots.main1, weight: ACADEMIC_SLOT_WEIGHTS.main1 },
    { key: "main2" as const, subject: slots.main2, weight: ACADEMIC_SLOT_WEIGHTS.main2 },
    { key: "opposite" as const, subject: slots.opposite, weight: ACADEMIC_SLOT_WEIGHTS.opposite },
    { key: "english" as const, subject: slots.english, weight: ACADEMIC_SLOT_WEIGHTS.english },
  ];

  const slotBreakdown = { main1: 0, main2: 0, opposite: 0, english: 0 };
  let weighted = 0;

  for (const slot of slotDefs) {
    const grade = grades[slot.subject];
    if (typeof grade !== "number") {
      continue;
    }
    const pct = (grade / 20) * 100;
    const affinity = subjectAffinity(specialty, slot.subject);
    const contribution = slot.weight * pct * affinity;
    slotBreakdown[slot.key] = toFixedNumber(contribution);
    weighted += contribution;
  }

  // Affinity can push slightly above 100; clamp after stream modifier.
  const rawAcademicPercentage = toFixedNumber(Math.min(weighted, 140));
  const academicScore = toFixedNumber(Math.min(rawAcademicPercentage * streamModifier, 100));

  return {
    academicScore,
    rawAcademicPercentage,
    streamModifier,
    slotBreakdown,
  };
};

const genieBiasPoints = (
  studentProfile: StudentProfile,
  specialtyCode: string,
): number => {
  if (studentProfile.bacStream !== "TECHNICAL_MATHEMATICS" || !studentProfile.technicalOption) {
    return 0;
  }
  const table = GENIE_BIAS[studentProfile.technicalOption];
  return table[specialtyCode] ?? 0;
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

      const bias = genieBiasPoints(studentProfile, specialty.code);

      const blended = toFixedNumber(
        ACADEMIC_WEIGHT * academic.academicScore +
          RIASEC_WEIGHT * psychometricScore +
          TECHNICAL_WEIGHT * technicalScore,
      );

      const finalScore = toFixedNumber(Math.min(100, Math.max(0, blended + bias)));
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
          genieBiasPoints: bias,
          slotBreakdown: academic.slotBreakdown,
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
    technicalOption: studentProfile.technicalOption,
    isTechnicalStream: technicalStream,
    weights: {
      academic: ACADEMIC_WEIGHT,
      riasec: RIASEC_WEIGHT,
      technical: TECHNICAL_WEIGHT,
    },
    matches,
  };
};
