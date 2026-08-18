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
  BacStream,
  TechnicalMathOption,
} from "./types.js";
import {
  ACADEMIC_SLOT_WEIGHTS,
  AFFINITY_MAX,
  AFFINITY_MIN,
  CODE_MATCH_BLEND,
  COSINE_BLEND,
  MARKS_BLEND,
  STREAM_BLEND,
  STREAM_GRADE_SLOTS,
  isTechnicalBacStream,
  labelFromFinalScore,
  resolveAcademicSlots,
  topRiasecToVector,
} from "./types.js";

const ACADEMIC_WEIGHT = 0.5;
const RIASEC_WEIGHT = 0.25;
const TECHNICAL_WEIGHT = 0.2;
const PREFERENCE_WEIGHT = 0.05;
/** Alternate path: RIASEC 0.25 split equally into technical + preference */
const NO_RIASEC_ACADEMIC = 0.5;
const NO_RIASEC_TECHNICAL = 0.325; // 0.20 + 0.125
const NO_RIASEC_PREFERENCE = 0.175; // 0.05 + 0.125
const PREFERENCE_MATCH = 100;
const PREFERENCE_OTHER = 50;

const GENIE_BIAS: Record<TechnicalMathOption, Partial<Record<string, number>>> = {
  GENIE_ELECTRIQUE: { "HIS-ELEC": 8, "HIS-INFO-SI": 3, "HIS-SEC-SI": 2 },
  GENIE_MECANIQUE: { "HIS-ELEC": 5, "HIS-INFO-SI": 2 },
  GENIE_CIVIL: { "HIS-ELEC": 4 },
  GENIE_PROCEDES: { "HIS-INFO-SI": 4, "HIS-SEC-SI": 3, "HIS-ELEC": 2 },
};

const toFixedNumber = (value: number, digits = 2): number =>
  Number(Number(value).toFixed(digits));

export const cosineSimilarity = (a: RiasecVector, b: RiasecVector): number => {
  const keys: (keyof RiasecVector)[] = [
    "realistic",
    "investigative",
    "artistic",
    "social",
    "enterprising",
    "conventional",
  ];
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of keys) {
    dot += a[k] * b[k];
    normA += a[k] * a[k];
    normB += b[k] * b[k];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const codeMatchScore = (top: TopRiasecProfile, hollandCode: HollandCode): number => {
  const sorted = [...top].sort((a, b) => b.weight - a.weight || a.letter.localeCompare(b.letter));
  const studentOrder = sorted.map((e) => e.letter) as RiasecLetter[];
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
  if (specialtyIsTechnical) {
    return toFixedNumber(0.5 * mains + 0.3 * english + 0.2 * opposite);
  }
  return toFixedNumber(0.45 * opposite + 0.35 * english + 0.2 * mains);
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

export const AFFINITY_MISSING_POLICY = "specialty_average_mapped_multiplier" as const;

const subjectMultiplier = (specialty: HisSpecialtyConfig, subject: SubjectCode): number => {
  const weights = specialty.subjectWeights.weights;
  const values = Object.values(weights).filter((v): v is number => typeof v === "number");
  const minW = values.length ? Math.min(...values) : 1;
  const maxW = values.length ? Math.max(...values) : 1;
  const w = weights[subject];
  if (typeof w === "number") return mapWeightToMultiplier(w, minW, maxW);
  if (values.length === 0) return (AFFINITY_MIN + AFFINITY_MAX) / 2;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return mapWeightToMultiplier(avg, minW, maxW);
};

const calculateAcademicScore = (studentProfile: StudentProfile, specialty: HisSpecialtyConfig) => {
  const slots = resolveAcademicSlots(studentProfile.bacStream, specialty.isTechnical);
  const grades = studentProfile.academicPerformance.grades;
  const slotDefs: Array<{ key: "main1" | "main2" | "opposite" | "english"; subject: SubjectCode; weight: number }> =
    [
      { key: "main1", subject: slots.main1, weight: ACADEMIC_SLOT_WEIGHTS.main1 },
      { key: "main2", subject: slots.main2, weight: ACADEMIC_SLOT_WEIGHTS.main2 },
      { key: "opposite", subject: slots.opposite, weight: ACADEMIC_SLOT_WEIGHTS.opposite },
      { key: "english", subject: slots.english, weight: ACADEMIC_SLOT_WEIGHTS.english },
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
      const blendedNoRiasec = toFixedNumber(
        NO_RIASEC_ACADEMIC * academic.academicScore +
          NO_RIASEC_TECHNICAL * tech.technicalScore +
          NO_RIASEC_PREFERENCE * preferenceScore,
      );
      const finalScoreNoRiasec = toFixedNumber(Math.min(100, Math.max(0, blendedNoRiasec + bias)));
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
        finalScoreNoRiasec,
        rank: 0,
        matchLabel,
        details: {
          rawAcademicPercentage: academic.rawAcademicPercentage,
          slotBreakdown: academic.slotBreakdown,
          affinityBreakdown: academic.affinityBreakdown,
          vectorCosineSimilarity: toFixedNumber(cosine, 4),
          codeMatchScore: codeScore,
          preferenceScore,
          genieBiasPoints: bias,
          technicalStreamBase: tech.streamBase,
          technicalMarksComponent: tech.marksComponent,
        },
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore || a.specialtyCode.localeCompare(b.specialtyCode))
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const matchesWithoutRiasec: SpecialtyMatchBreakdown[] = [...matches]
    .map((m) => {
      const finalScore = (m as { finalScoreNoRiasec?: number }).finalScoreNoRiasec ?? m.finalScore;
      return {
        ...m,
        psychometricScore: 0,
        finalScore,
        matchLabel: labelFromFinalScore(finalScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore || a.specialtyCode.localeCompare(b.specialtyCode))
    .map((m, i) => ({ ...m, rank: i + 1 }));

  return {
    evaluationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    studentName: studentProfile.fullName,
    studentId: studentProfile.studentId,
    fullName: studentProfile.fullName,
    bacStream: studentProfile.bacStream,
    technicalOption: studentProfile.technicalOption,
    preferredSpecialtyCode: studentProfile.preferredSpecialtyCode,
    overallBacMark: studentProfile.academicPerformance.overallBacMark,
    matches,
    matchesWithoutRiasec,
    weights: {
      academic: ACADEMIC_WEIGHT,
      riasec: RIASEC_WEIGHT,
      technical: TECHNICAL_WEIGHT,
      preference: PREFERENCE_WEIGHT,
    },
    weightsWithoutRiasec: {
      academic: NO_RIASEC_ACADEMIC,
      riasec: 0,
      technical: NO_RIASEC_TECHNICAL,
      preference: NO_RIASEC_PREFERENCE,
    },
    isTechnicalStream: technicalStream,
    technicalStream,
  };
};
