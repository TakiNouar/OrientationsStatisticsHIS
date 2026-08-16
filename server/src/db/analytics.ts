import { db } from "./connection.js";
import type { MatchLabel, RiasecLetter } from "../types.js";
import { labelFromFinalScore, MATCH_LABEL_TEXT } from "../types.js";
import { buildEvaluationWhere, type AnalyticsFilters } from "./filters.js";

export type { AnalyticsFilters };

export type CountRow = { key: string; label: string; count: number };

export type AnalyticsSummary = {
  totalSessions: number;
  byStream: CountRow[];
  byTopSpecialty: CountRow[];
  byMatchLabel: CountRow[];
  filters: AnalyticsFilters;
};

export type SessionListRow = {
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
};

export type StudentMatchRow = {
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
};

export type StudentProfileDetail = {
  studentId: string;
  fullName: string;
  bacStream: string;
  overallBacMark: number;
  preferredSpecialtyCode: string | null;
  preferredSpecialtyTitle: string | null;
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
};

export const getAnalyticsSummary = (filters: AnalyticsFilters = {}): AnalyticsSummary => {
  const { where, params } = buildEvaluationWhere(filters);
  const rankClause = where ? `${where} AND me.rank_position = 1` : `WHERE me.rank_position = 1`;

  const totalRow = db
    .prepare(
      `
      SELECT COUNT(*) AS c
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${rankClause}
    `,
    )
    .get(params) as { c: number };

  const byStreamRows = db
    .prepare(
      `
      SELECT s.bac_stream AS key, COUNT(*) AS count
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${rankClause}
      GROUP BY s.bac_stream
      ORDER BY count DESC, key ASC
    `,
    )
    .all(params) as Array<{ key: string; count: number }>;

  const bySpecialtyRows = db
    .prepare(
      `
      SELECT hs.code AS key, hs.title AS label, COUNT(*) AS count
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${rankClause}
      GROUP BY hs.code, hs.title
      ORDER BY count DESC, key ASC
    `,
    )
    .all(params) as Array<{ key: string; label: string; count: number }>;

  const scoreRows = db
    .prepare(
      `
      SELECT me.final_score AS final_score
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${rankClause}
    `,
    )
    .all(params) as Array<{ final_score: number }>;

  const labelCounts: Record<MatchLabel, number> = {
    STRONG_MATCH: 0,
    STRONG_MATCH_CONVERSATION: 0,
    POSSIBLE_FIT: 0,
    PROFILE_DEVELOPING: 0,
    WEAK_MATCH: 0,
  };
  for (const row of scoreRows) {
    labelCounts[labelFromFinalScore(Number(row.final_score))] += 1;
  }

  const order: MatchLabel[] = [
    "STRONG_MATCH",
    "STRONG_MATCH_CONVERSATION",
    "POSSIBLE_FIT",
    "PROFILE_DEVELOPING",
    "WEAK_MATCH",
  ];

  return {
    totalSessions: Number(totalRow?.c ?? 0),
    byStream: byStreamRows.map((r) => ({ key: r.key, label: r.key, count: Number(r.count) })),
    byTopSpecialty: bySpecialtyRows.map((r) => ({
      key: r.key,
      label: r.label,
      count: Number(r.count),
    })),
    byMatchLabel: order.map((key) => ({ key, label: key, count: labelCounts[key] })),
    filters,
  };
};

export const getRecentSessions = (
  filters: AnalyticsFilters = {},
  limit = 50,
): SessionListRow[] => {
  const { where, params } = buildEvaluationWhere(filters);
  const rankClause = where ? `${where} AND me.rank_position = 1` : `WHERE me.rank_position = 1`;
  const safeLimit = Math.min(Math.max(1, limit), 500);

  const rows = db
    .prepare(
      `
      SELECT
        s.id AS student_id,
        s.full_name AS full_name,
        me.evaluated_at,
        s.bac_stream,
        s.overall_bac_mark,
        hs.code AS specialty_code,
        hs.title AS specialty_title,
        hs.department,
        me.final_score,
        me.academic_score,
        me.riasec_score
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${rankClause}
      ORDER BY me.evaluated_at DESC
      LIMIT ${safeLimit}
    `,
    )
    .all(params) as Array<{
    student_id: string;
    full_name: string;
    evaluated_at: string;
    bac_stream: string;
    overall_bac_mark: number;
    specialty_code: string;
    specialty_title: string;
    department: string;
    final_score: number;
    academic_score: number;
    riasec_score: number;
  }>;

  return rows.map((row) => ({
    studentId: row.student_id,
    fullName: row.full_name,
    evaluatedAt: row.evaluated_at,
    bacStream: row.bac_stream,
    overallBacMark: Number(row.overall_bac_mark),
    topSpecialtyCode: row.specialty_code,
    topSpecialtyTitle: row.specialty_title,
    department: row.department,
    finalScore: Number(row.final_score),
    matchLabel: labelFromFinalScore(Number(row.final_score)),
    academicScore: Number(row.academic_score),
    riasecScore: Number(row.riasec_score),
  }));
};

/** @deprecated alias */
export const getRecentEvaluationsAnonymized = getRecentSessions;

export const getStudentProfile = (studentId: string): StudentProfileDetail | null => {
  const student = db
    .prepare(
      `SELECT id, full_name, bac_stream, overall_bac_mark, preferred_specialty_code, created_at
       FROM students WHERE id = ?`,
    )
    .get(studentId) as
    | {
        id: string;
        full_name: string;
        bac_stream: string;
        overall_bac_mark: number;
        preferred_specialty_code: string | null;
        created_at: string;
      }
    | undefined;

  if (!student) return null;

  let preferredSpecialtyTitle: string | null = null;
  const prefCode = student.preferred_specialty_code?.trim() || null;
  if (prefCode) {
    const titleRow = db
      .prepare(`SELECT title FROM his_specialties WHERE code = ? LIMIT 1`)
      .get(prefCode) as { title: string } | undefined;
    preferredSpecialtyTitle = titleRow?.title ?? null;
  }

  const gradeRows = db
    .prepare(`SELECT subject_code, grade_value FROM bac_grades WHERE student_id = ?`)
    .all(studentId) as Array<{ subject_code: string; grade_value: number }>;

  const grades: Record<string, number> = {};
  for (const g of gradeRows) grades[g.subject_code] = Number(g.grade_value);

  const riasec = db
    .prepare(
      `SELECT realistic_score, investigative_score, artistic_score, social_score,
              enterprising_score, conventional_score, top_riasec_json
       FROM riasec_profiles WHERE student_id = ?`,
    )
    .get(studentId) as
    | {
        realistic_score: number;
        investigative_score: number;
        artistic_score: number;
        social_score: number;
        enterprising_score: number;
        conventional_score: number;
        top_riasec_json: string | null;
      }
    | undefined;

  let topRiasec: StudentProfileDetail["topRiasec"] = null;
  if (riasec?.top_riasec_json) {
    try {
      topRiasec = JSON.parse(riasec.top_riasec_json) as StudentProfileDetail["topRiasec"];
    } catch {
      topRiasec = null;
    }
  }

  const matchRows = db
    .prepare(
      `
      SELECT
        me.specialty_id,
        hs.code AS specialty_code,
        hs.title AS specialty_title,
        hs.department,
        hs.description,
        hs.is_technical,
        hs.holland_code_json,
        me.academic_score,
        me.riasec_score,
        me.final_score,
        me.rank_position,
        me.evaluated_at
      FROM match_evaluations me
      JOIN his_specialties hs ON hs.id = me.specialty_id
      WHERE me.student_id = ?
      ORDER BY me.rank_position ASC
    `,
    )
    .all(studentId) as Array<{
    specialty_id: string;
    specialty_code: string;
    specialty_title: string;
    department: string;
    description: string;
    is_technical: number;
    holland_code_json: string;
    academic_score: number;
    riasec_score: number;
    final_score: number;
    rank_position: number;
    evaluated_at: string;
  }>;

  const matches: StudentMatchRow[] = matchRows.map((row) => {
    const finalScore = Number(row.final_score);
    const matchLabel = labelFromFinalScore(finalScore);
    let hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter] = ["I", "C", "E"];
    try {
      hollandCode = JSON.parse(row.holland_code_json || '["I","C","E"]') as [
        RiasecLetter,
        RiasecLetter,
        RiasecLetter,
      ];
    } catch {
      // default
    }
    return {
      specialtyId: row.specialty_id,
      specialtyCode: row.specialty_code,
      specialtyTitle: row.specialty_title,
      department: row.department,
      description: row.description ?? "",
      isTechnical: Boolean(row.is_technical),
      hollandCode,
      academicScore: Number(row.academic_score),
      psychometricScore: Number(row.riasec_score),
      finalScore,
      rank: Number(row.rank_position),
      matchLabel,
      matchLabelText: MATCH_LABEL_TEXT[matchLabel],
      evaluatedAt: row.evaluated_at,
    };
  });

  return {
    studentId: student.id,
    fullName: student.full_name,
    bacStream: student.bac_stream,
    overallBacMark: Number(student.overall_bac_mark),
    preferredSpecialtyCode: prefCode,
    preferredSpecialtyTitle,
    createdAt: student.created_at,
    grades,
    topRiasec,
    riasecVector: riasec
      ? {
          realistic: Number(riasec.realistic_score),
          investigative: Number(riasec.investigative_score),
          artistic: Number(riasec.artistic_score),
          social: Number(riasec.social_score),
          enterprising: Number(riasec.enterprising_score),
          conventional: Number(riasec.conventional_score),
        }
      : null,
    matches,
  };
};
