import type {
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
  BacStream,
} from "./types.js";
import {
  ACADEMIC_SLOT_WEIGHTS,
  AFFINITY_MAX,
  AFFINITY_MIN,
  isTechnicalBacStream,
  labelFromFinalScore,
  MATCH_LABEL_TEXT,
  STREAM_GRADE_SLOTS,
  topRiasecToVector,
} from "./types.js";

const ACADEMIC_WEIGHT = 0.5;
const RIASEC_WEIGHT = 0.25;
const TECHNICAL_WEIGHT = 0.2;
const PREFERENCE_WEIGHT = 0.05;
const PREFERENCE_MATCH = 100;
const PREFERENCE_OTHER = 50;
const COSINE_BLEND = 0.3;
const CODE_MATCH_BLEND = 0.7;
const STREAM_BLEND = 0.45;
const MARKS_BLEND = 0.55;

const GENIE_BIAS: Record<TechnicalMathOption, Partial<Record<string, number>>> = {
  GENIE_ELECTRIQUE: { "HIS-ELEC": 8, "HIS-INFO-SI": 5, "HIS-SEC-SI": 5 },
  GENIE_MECANIQUE: { "HIS-ELEC": 4, "HIS-INFO-SI": 3, "HIS-SEC-SI": 2 },
  GENIE_CIVIL: { "HIS-ELEC": 3, "HIS-INFO-SI": 2 },
  GENIE_PROCEDES: { "HIS-ELEC": 5, "HIS-SEC-SI": 3, "HIS-INFO-SI": 2 },
};

const toFixedNumber = (value: number, digits = 2): number =>
  Number.parseFloat(value.toFixed(digits));

const getVectorValues = (vector: RiasecVector): number[] => [
  vector.realistic, vector.investigative, vector.artistic,
  vector.social, vector.enterprising, vector.conventional,
];

const cosineSimilarity = (a: RiasecVector, b: RiasecVector): number => {
  const va = getVectorValues(a);
  const vb = getVectorValues(b);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < va.length; i += 1) {
    const aVal = va[i] ?? 0, bVal = vb[i] ?? 0;
    dot += aVal * bVal; normA += aVal * aVal; normB += bVal * bVal;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const codeMatchScore = (top: TopRiasecProfile, hollandCode: HollandCode): number => {
  const studentOrder = top.map((e) => e.letter) as RiasecLetter[];
  const weightByLetter: Partial<Record<RiasecLetter, number>> = {};
  for (const entry of top) weightByLetter[entry.letter] = entry.weight;
  const maxWeight = Math.max(...top.map((e) => e.weight), 1);
  const positionWeights = [50, 35, 15] as const;
  const maxPossible = positionWeights.reduce((s, v) => s + v, 0);
  let score = 0;
  for (let i = 0; i < 3; i += 1) {
    const letter = hollandCode[i as 0 | 1 | 2];
    const studentWeight = weightByLetter[letter];
    if (studentWeight === undefined) continue;
    const studentIdx = studentOrder.indexOf(letter);
    const strength = studentWeight / maxWeight;
    const posWeight = positionWeights[i as 0 | 1 | 2] ?? 0;
    let credit = posWeight * (0.45 + 0.55 * strength);
    if (studentIdx === i) credit *= 1.2;
    score += credit;
  }
  return toFixedNumber(Math.min(100, (score / maxPossible) * 100));
};

const averageGradePct = (
  grades: Partial<Record<SubjectCode, number>>,
  subjects: SubjectCode[],
): number | null => {
  const values: number[] = [];
  for (const subject of subjects) {
    const g = grades[subject];
    if (typeof g === "number") values.push((g / 20) * 100);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const streamBaseFit = (bacStream: BacStream, specialtyIsTechnical: boolean): number => {
  const studentTechnical = isTechnicalBacStream(bacStream);
  if (studentTechnical && specialtyIsTechnical) return 100;
  if (studentTechnical && !specialtyIsTechnical) return 35;
  if (!studentTechnical && !specialtyIsTechnical) return 85;
  return 40;
};

const marksFit = (studentProfile: StudentProfile, specialtyIsTechnical: boolean): number => {
  const slots = STREAM_GRADE_SLOTS[studentProfile.bacStream];
  const grades = studentProfile.academicPerformance.grades;
  const mainsPct = averageGradePct(grades, [slots.main1, slots.main2]);
  const oppositePct = averageGradePct(grades, [slots.opposite]);
  const englishPct = averageGradePct(grades, [slots.english]);
  const overallPct = (studentProfile.academicPerformance.overallBacMark / 20) * 100;
  const mains = mainsPct ?? overallPct;
  const opposite = oppositePct ?? overallPct;
  const english = englishPct ?? overallPct;
  if (specialtyIsTechnical) return toFixedNumber(0.75 * mains + 0.15 * opposite + 0.1 * english);
  return toFixedNumber(0.7 * opposite + 0.2 * mains + 0.1 * english);
};

export const technicalAlignmentScore = (
  studentProfile: StudentProfile,
  specialtyIsTechnical: boolean,
): { technicalScore: number; streamBase: number; marksComponent: number } => {
  const streamBase = streamBaseFit(studentProfile.bacStream, specialtyIsTechnical);
  const marksComponent = marksFit(studentProfile, specialtyIsTechnical);
  const technicalScore = toFixedNumber(STREAM_BLEND * streamBase + MARKS_BLEND * marksComponent);
  return { technicalScore: Math.min(100, Math.max(0, technicalScore)), streamBase, marksComponent };
};

const mapWeightToMultiplier = (subjectW: number, minW: number, maxW: number): number => {
  if (maxW <= minW) return (AFFINITY_MIN + AFFINITY_MAX) / 2;
  return AFFINITY_MIN + (AFFINITY_MAX - AFFINITY_MIN) * ((subjectW - minW) / (maxW - minW));
};

const specialtyAverageMappedMultiplier = (specialty: HisSpecialtyConfig): number => {
  const weights = specialty.subjectWeights.weights;
  const values = Object.values(weights).filter((v): v is number => typeof v === "number" && v > 0);
  if (values.length === 0) return 1.0;
  const minW = Math.min(...values), maxW = Math.max(...values);
  return values.map((w) => mapWeightToMultiplier(w, minW, maxW)).reduce((a, b) => a + b, 0) / values.length;
};

export const AFFINITY_MISSING_POLICY = "specialty_average_mapped_multiplier" as const;

const subjectMultiplier = (specialty: HisSpecialtyConfig, subject: SubjectCode): number => {
  const weights = specialty.subjectWeights.weights;
  const values = Object.values(weights).filter((v): v is number => typeof v === "number" && v > 0);
  if (values.length === 0) return 1.0;
  const subjectW = weights[subject];
  if (typeof subjectW !== "number" || subjectW <= 0) return specialtyAverageMappedMultiplier(specialty);
  return mapWeightToMultiplier(subjectW, Math.min(...values), Math.max(...values));
};

const calculateAcademicScore = (studentProfile: StudentProfile, specialty: HisSpecialtyConfig) => {
  const slots = STREAM_GRADE_SLOTS[studentProfile.bacStream];
  const grades = studentProfile.academicPerformance.grades;
  const slotDefs = [
    { key: "main1" as const, subject: slots.main1, weight: ACADEMIC_SLOT_WEIGHTS.main1 },
    { key: "main2" as const, subject: slots.main2, weight: ACADEMIC_SLOT_WEIGHTS.main2 },
    { key: "opposite" as const, subject: slots.opposite, weight: ACADEMIC_SLOT_WEIGHTS.opposite },
    { key: "english" as const, subject: slots.english, weight: ACADEMIC_SLOT_WEIGHTS.english },
  ];
  const slotBreakdown = { main1: 0, main2: 0, opposite: 0, english: 0 };
  const affinityBreakdown = { main1: 0, main2: 0, opposite: 0, english: 0 };
  let weighted = 0;
  for (const slot of slotDefs) {
    const grade = grades[slot.subject];
    if (typeof grade !== "number") continue;
    const pct = (grade / 20) * 100;
    const mult = subjectMultiplier(specialty, slot.subject);
    slotBreakdown[slot.key] = toFixedNumber(slot.weight * pct * mult);
    affinityBreakdown[slot.key] = toFixedNumber(mult, 3);
    weighted += slot.weight * pct * mult;
  }
  const rawAcademicPercentage = toFixedNumber(weighted);
  return {
    academicScore: toFixedNumber(Math.min(Math.max(rawAcademicPercentage, 0), 100)),
    rawAcademicPercentage,
    slotBreakdown,
    affinityBreakdown,
  };
};

const preferenceScoreFor = (preferredCode: string | undefined, specialtyCode: string): number => {
  if (!preferredCode) return PREFERENCE_OTHER;
  return preferredCode === specialtyCode ? PREFERENCE_MATCH : PREFERENCE_OTHER;
};

const genieBiasPoints = (studentProfile: StudentProfile, specialtyCode: string): number => {
  if (studentProfile.bacStream !== "TECHNICAL_MATHEMATICS" || !studentProfile.technicalOption) return 0;
  return GENIE_BIAS[studentProfile.technicalOption][specialtyCode] ?? 0;
};

export const calculateRecommendations = (
  studentProfile: StudentProfile,
  specialties: HisSpecialtyConfig[],
): CalculationResult => {
  const studentVector = topRiasecToVector(studentProfile.topRiasec);
  const technicalStream = isTechnicalBacStream(studentProfile.bacStream);
  const matches: SpecialtyMatchBreakdown[] = specialties
    .filter((s) => s.isActive)
    .map((specialty) => {
      const academic = calculateAcademicScore(studentProfile, specialty);
      const cosine = cosineSimilarity(studentVector, specialty.riasecBenchmark.vector);
      const cosineScore = cosine * 100;
      const codeScore = codeMatchScore(studentProfile.topRiasec, specialty.hollandCode);
      const psychometricScore = toFixedNumber(COSINE_BLEND * cosineScore + CODE_MATCH_BLEND * codeScore);
      const tech = technicalAlignmentScore(studentProfile, specialty.isTechnical);
      const preferenceScore = preferenceScoreFor(studentProfile.preferredSpecialtyCode, specialty.code);
      const bias = genieBiasPoints(studentProfile, specialty.code);
      const blended = toFixedNumber(
        ACADEMIC_WEIGHT * academic.academicScore +
          RIASEC_WEIGHT * psychometricScore +
          TECHNICAL_WEIGHT * tech.technicalScore +
          PREFERENCE_WEIGHT * preferenceScore,
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
        technicalScore: tech.technicalScore,
        preferenceScore,
        finalScore,
        matchLabel,
        matchLabelText: MATCH_LABEL_TEXT[matchLabel],
        rank: 0,
        details: {
          rawAcademicPercentage: academic.rawAcademicPercentage,
          vectorCosineSimilarity: toFixedNumber(cosine, 4),
          codeMatchScore: codeScore,
          cosineComponent: toFixedNumber(COSINE_BLEND * cosineScore),
          codeMatchComponent: toFixedNumber(CODE_MATCH_BLEND * codeScore),
          genieBiasPoints: bias,
          slotBreakdown: academic.slotBreakdown,
          affinityBreakdown: academic.affinityBreakdown,
          technicalStreamBase: tech.streamBase,
          technicalMarksComponent: tech.marksComponent,
        },
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const result: CalculationResult = {
    evaluationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    studentName: studentProfile.fullName,
    bacStream: studentProfile.bacStream,
    isTechnicalStream: technicalStream,
    weights: {
      academic: ACADEMIC_WEIGHT,
      riasec: RIASEC_WEIGHT,
      technical: TECHNICAL_WEIGHT,
      preference: PREFERENCE_WEIGHT,
    },
    matches,
  };
  if (studentProfile.technicalOption !== undefined) {
    result.technicalOption = studentProfile.technicalOption;
  }
  return result;
};
