import { db } from "./connection.js";
import type { MatchLabel, RiasecLetter } from "../types.js";
import {
  labelFromFinalScore,
  MATCH_LABEL_TEXT,
  RIASEC_LABELS,
  TECHNICAL_MATH_OPTION_LABELS,
  type TechnicalMathOption,
} from "../types.js";
import { buildEvaluationWhere, type AnalyticsFilters } from "./filters.js";

export type { AnalyticsFilters };

export type CountRow = { key: string; label: string; count: number };

export type AnalyticsSummary = {
  totalEvaluations: number;
  uniqueStudents: number;
  byBacStream: CountRow[];
  byTopSpecialty: CountRow[];
  byMatchLabel: CountRow[];
  averageFinalScore: number | null;
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
  finalScore: number;
  academicScore: number;
  riasecScore: number;
  psychometricScore: number;
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
  riasec: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
    topRiasec: Array<{ letter: RiasecLetter; weight: number }> | null;
  } | null;
  matches: StudentMatchRow[];
};

export const getAnalyticsSummary = (filters: AnalyticsFilters = {}): AnalyticsSummary => {
  const { where, params } = buildEvaluationWhere(filters);

  const totalRow = db
    .prepare(
      `
      SELECT COUNT(*) AS c
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      ${where}
    `,
    )
    .get(params) as { c: number };

  const uniqueRow = db
    .prepare(
      `
      SELECT COUNT(DISTINCT me.student_id) AS c
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      ${where}
    `,
    )
    .get(params) as { c: number };

  const byStream = db
    .prepare(
      `
      SELECT s.bac_stream AS key, COUNT(*) AS count
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      ${where ? where + " AND me.rank_position = 1" : "WHERE me.rank_position = 1"}
      GROUP BY s.bac_stream
      ORDER BY count DESC
    `,
    )
    .all(params) as Array<{ key: string; count: number }>;

  const bySpec = db
    .prepare(
      `
      SELECT hs.code AS key, hs.title AS label, COUNT(*) AS count
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${where ? where + " AND me.rank_position = 1" : "WHERE me.rank_position = 1"}
      GROUP BY hs.code
      ORDER BY count DESC
    `,
    )
    .all(params) as Array<{ key: string; label: string; count: number }>;

  const scoreRows = db
    .prepare(
      `
      SELECT me.final_score AS final_score
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      ${where ? where + " AND me.rank_position = 1" : "WHERE me.rank_position = 1"}
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
  let sum = 0;
  for (const row of scoreRows) {
    const score = Number(row.final_score);
    sum += score;
    labelCounts[labelFromFinalScore(score)] += 1;
  }

  return {
    totalEvaluations: Number(totalRow?.c ?? 0),
    uniqueStudents: Number(uniqueRow?.c ?? 0),
    byBacStream: byStream.map((r) => ({
      key: r.key,
      label: r.key.replaceAll("_", " "),
      count: Number(r.count),
    })),
    byTopSpecialty: bySpec.map((r) => ({
      key: r.key,
      label: r.label,
      count: Number(r.count),
    })),
    byMatchLabel: (Object.keys(labelCounts) as MatchLabel[]).map((key) => ({
      key,
      label: MATCH_LABEL_TEXT[key],
      count: labelCounts[key],
    })),
    averageFinalScore:
      scoreRows.length > 0 ? Number((sum / scoreRows.length).toFixed(2)) : null,
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

  let preferredTitle: string | null = null;
  if (student.preferred_specialty_code) {
    const t = db
      .prepare(`SELECT title FROM his_specialties WHERE code = ? LIMIT 1`)
      .get(student.preferred_specialty_code) as { title: string } | undefined;
    preferredTitle = t?.title ?? null;
  }

  const grades = db
    .prepare(`SELECT subject_code, grade_value FROM bac_grades WHERE student_id = ?`)
    .all(studentId) as Array<{ subject_code: string; grade_value: number }>;

  const riasecRow = db
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

  let topRiasec: Array<{ letter: RiasecLetter; weight: number }> | null = null;
  if (riasecRow?.top_riasec_json) {
    try {
      topRiasec = JSON.parse(riasecRow.top_riasec_json) as Array<{
        letter: RiasecLetter;
        weight: number;
      }>;
    } catch {
      topRiasec = null;
    }
  }

  const matches = db
    .prepare(
      `
      SELECT
        hs.id AS specialty_id,
        hs.code AS specialty_code,
        hs.title AS specialty_title,
        hs.department,
        COALESCE(hs.description, '') AS description,
        hs.is_technical AS is_technical,
        hs.holland_code_json AS holland_code_json,
        me.final_score,
        me.academic_score,
        me.riasec_score,
        me.rank_position,
        me.evaluated_at AS evaluated_at
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
    final_score: number;
    academic_score: number;
    riasec_score: number;
    rank_position: number;
    evaluated_at: string;
  }>;

  return {
    studentId: student.id,
    fullName: student.full_name,
    bacStream: student.bac_stream,
    overallBacMark: Number(student.overall_bac_mark),
    preferredSpecialtyCode: student.preferred_specialty_code,
    preferredSpecialtyTitle: preferredTitle,
    createdAt: student.created_at,
    grades: Object.fromEntries(grades.map((g) => [g.subject_code, Number(g.grade_value)])),
    topRiasec,
    riasec: riasecRow
      ? {
          realistic: Number(riasecRow.realistic_score),
          investigative: Number(riasecRow.investigative_score),
          artistic: Number(riasecRow.artistic_score),
          social: Number(riasecRow.social_score),
          enterprising: Number(riasecRow.enterprising_score),
          conventional: Number(riasecRow.conventional_score),
          topRiasec,
        }
      : null,
    matches: matches.map((m) => {
      const finalScore = Number(m.final_score);
      const matchLabel = labelFromFinalScore(finalScore);
      let hollandCode: [RiasecLetter, RiasecLetter, RiasecLetter] = ["I", "C", "E"];
      try {
        const parsed = JSON.parse(m.holland_code_json || '["I","C","E"]');
        if (Array.isArray(parsed) && parsed.length >= 3) {
          hollandCode = [parsed[0], parsed[1], parsed[2]];
        }
      } catch {
        /* keep default */
      }
      return {
        specialtyId: m.specialty_id,
        specialtyCode: m.specialty_code,
        specialtyTitle: m.specialty_title,
        department: m.department,
        description: m.description,
        isTechnical: Boolean(m.is_technical),
        hollandCode,
        finalScore,
        academicScore: Number(m.academic_score),
        riasecScore: Number(m.riasec_score),
        psychometricScore: Number(m.riasec_score),
        rank: Number(m.rank_position),
        matchLabel,
        matchLabelText: MATCH_LABEL_TEXT[matchLabel],
        evaluatedAt: m.evaluated_at,
      };
    }),
  };
};

export type SheetSessionRow = {
  evaluationId: string;
  submittedAt: string;
  fullName: string;
  bacStream: string;
  technicalOption: string;
  /** Full English RIASEC names in weight order (top 3) */
  riasecFullNames: [string, string, string];
  overallMark: number;
  preferredSpecialtyCode: string;
  matches: Array<{ code: string; score: number; label: string }>;
};

/** All sessions for sheet mirror (read-only). Oldest first → newest at bottom of sheet. */
export const listAllSessionsForSheet = (): SheetSessionRow[] => {
  const students = db
    .prepare(
      `
      SELECT
        s.id AS student_id,
        s.full_name AS full_name,
        s.bac_stream AS bac_stream,
        s.overall_bac_mark AS overall_bac_mark,
        COALESCE(s.preferred_specialty_code, '') AS preferred_specialty_code,
        s.technical_option AS technical_option,
        (
          SELECT rp.top_riasec_json
          FROM riasec_profiles rp
          WHERE rp.student_id = s.id
          LIMIT 1
        ) AS top_riasec_json,
        (
          SELECT me.evaluated_at
          FROM match_evaluations me
          WHERE me.student_id = s.id
          ORDER BY me.rank_position ASC
          LIMIT 1
        ) AS evaluated_at
      FROM students s
      WHERE EXISTS (SELECT 1 FROM match_evaluations me WHERE me.student_id = s.id)
      ORDER BY evaluated_at ASC
    `,
    )
    .all() as Array<{
    student_id: string;
    full_name: string;
    bac_stream: string;
    overall_bac_mark: number;
    preferred_specialty_code: string;
    technical_option: string | null;
    top_riasec_json: string | null;
    evaluated_at: string | null;
  }>;

  const matchStmt = db.prepare(
    `
    SELECT
      hs.code AS code,
      me.final_score AS final_score,
      me.rank_position AS rank_position
    FROM match_evaluations me
    JOIN his_specialties hs ON hs.id = me.specialty_id
    WHERE me.student_id = ?
    ORDER BY me.rank_position ASC
    LIMIT 3
  `,
  );

  return students.map((s) => {
    const matchRows = matchStmt.all(s.student_id) as Array<{
      code: string;
      final_score: number;
      rank_position: number;
    }>;
    const matches = matchRows.map((m) => {
      const score = Number(m.final_score);
      const label = MATCH_LABEL_TEXT[labelFromFinalScore(score)];
      return { code: m.code, score, label };
    });

    let riasecFullNames: [string, string, string] = ["—", "—", "—"];
    if (s.top_riasec_json) {
      try {
        const top = JSON.parse(s.top_riasec_json) as Array<{ letter: RiasecLetter; weight: number }>;
        const sorted = [...top].sort(
          (a, b) => b.weight - a.weight || a.letter.localeCompare(b.letter),
        );
        riasecFullNames = [
          sorted[0] ? RIASEC_LABELS[sorted[0].letter] ?? sorted[0].letter : "—",
          sorted[1] ? RIASEC_LABELS[sorted[1].letter] ?? sorted[1].letter : "—",
          sorted[2] ? RIASEC_LABELS[sorted[2].letter] ?? sorted[2].letter : "—",
        ];
      } catch {
        /* keep dashes */
      }
    }

    const techRaw = s.technical_option ? String(s.technical_option).trim() : "";
    const technicalOption = techRaw
      ? TECHNICAL_MATH_OPTION_LABELS[techRaw as TechnicalMathOption] ??
        techRaw.replaceAll("_", " ")
      : "—";

    return {
      evaluationId: s.student_id,
      submittedAt: s.evaluated_at ?? "",
      fullName: s.full_name,
      bacStream: s.bac_stream.replaceAll("_", " "),
      technicalOption,
      riasecFullNames,
      overallMark: Number(s.overall_bac_mark),
      preferredSpecialtyCode: s.preferred_specialty_code || "—",
      matches,
    };
  });
};
