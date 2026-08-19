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
  finalScoreNoRiasec: number | null;
  rankNoRiasec: number | null;
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
      `\n      SELECT COUNT(*) AS c\n      FROM match_evaluations me\n      JOIN students s ON s.id = me.student_id\n      ${where}\n    `,
    )
    .get(params) as { c: number };

  const uniqueRow = db
    .prepare(
      `\n      SELECT COUNT(DISTINCT me.student_id) AS c\n      FROM match_evaluations me\n      JOIN students s ON s.id = me.student_id\n      ${where}\n    `,
    )
    .get(params) as { c: number };

  const byStream = db
    .prepare(
      `\n      SELECT s.bac_stream AS key, COUNT(*) AS count\n      FROM match_evaluations me\n      JOIN students s ON s.id = me.student_id\n      ${where ? where + " AND me.rank_position = 1" : "WHERE me.rank_position = 1"}\n      GROUP BY s.bac_stream\n      ORDER BY count DESC\n    `,
    )
    .all(params) as Array<{ key: string; count: number }>;

  const bySpec = db
    .prepare(
      `\n      SELECT hs.code AS key, hs.title AS label, COUNT(*) AS count\n      FROM match_evaluations me\n      JOIN students s ON s.id = me.student_id\n      JOIN his_specialties hs ON hs.id = me.specialty_id\n      ${where ? where + " AND me.rank_position = 1" : "WHERE me.rank_position = 1"}\n      GROUP BY hs.code\n      ORDER BY count DESC\n    `,
    )
    .all(params) as Array<{ key: string; label: string; count: number }>;

  const scoreRows = db
    .prepare(
      `\n      SELECT me.final_score AS final_score\n      FROM match_evaluations me\n      JOIN students s ON s.id = me.student_id\n      ${where ? where + " AND me.rank_position = 1" : "WHERE me.rank_position = 1"}\n    `,
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
      `\n      SELECT\n        s.id AS student_id,\n        s.full_name AS full_name,\n        me.evaluated_at,\n        s.bac_stream,\n        s.overall_bac_mark,\n        hs.code AS specialty_code,\n        hs.title AS specialty_title,\n        hs.department,\n        me.final_score,\n        me.academic_score,\n        me.riasec_score\n      FROM match_evaluations me\n      JOIN students s ON s.id = me.student_id\n      JOIN his_specialties hs ON hs.id = me.specialty_id\n      ${rankClause}\n      ORDER BY me.evaluated_at DESC\n      LIMIT ${safeLimit}\n    `,
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
      `SELECT id, full_name, bac_stream, overall_bac_mark, preferred_specialty_code, created_at\n       FROM students WHERE id = ?`,
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
      `SELECT realistic_score, investigative_score, artistic_score, social_score,\n              enterprising_score, conventional_score, top_riasec_json\n       FROM riasec_profiles WHERE student_id = ?`,
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
      `\n      SELECT\n        hs.id AS specialty_id,\n        hs.code AS specialty_code,\n        hs.title AS specialty_title,\n        hs.department,\n        COALESCE(hs.description, '') AS description,\n        hs.is_technical AS is_technical,\n        hs.holland_code_json AS holland_code_json,\n        me.final_score,\n        me.academic_score,\n        me.riasec_score,\n        me.rank_position,\n        me.final_score_no_riasec AS final_score_no_riasec,\n        me.rank_position_no_riasec AS rank_position_no_riasec,\n        me.evaluated_at AS evaluated_at\n      FROM match_evaluations me\n      JOIN his_specialties hs ON hs.id = me.specialty_id\n      WHERE me.student_id = ?\n      ORDER BY me.rank_position ASC\n    `,
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
    final_score_no_riasec: number | null;
    rank_position_no_riasec: number | null;
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
      const noR =
        m.final_score_no_riasec == null ? null : Number(m.final_score_no_riasec);
      const noRRank =
        m.rank_position_no_riasec == null ? null : Number(m.rank_position_no_riasec);
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
        finalScoreNoRiasec: noR,
        rankNoRiasec: noRRank,
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
  riasecFullNames: [string, string, string];
  overallMark: number;
  preferredSpecialtyCode: string;
  matches: Array<{ code: string; score: number; label: string }>;
};

/** All sessions for sheet mirror (read-only). Oldest first → newest at bottom of sheet. */
export const listAllSessionsForSheet = (): SheetSessionRow[] => {
  const students = db
    .prepare(
      `\n      SELECT\n        s.id AS student_id,\n        s.full_name AS full_name,\n        s.bac_stream AS bac_stream,\n        s.overall_bac_mark AS overall_bac_mark,\n        COALESCE(s.preferred_specialty_code, '') AS preferred_specialty_code,\n        s.technical_option AS technical_option,\n        (\n          SELECT rp.top_riasec_json\n          FROM riasec_profiles rp\n          WHERE rp.student_id = s.id\n          LIMIT 1\n        ) AS top_riasec_json,\n        (\n          SELECT me.evaluated_at\n          FROM match_evaluations me\n          WHERE me.student_id = s.id\n          ORDER BY me.rank_position ASC\n          LIMIT 1\n        ) AS evaluated_at\n      FROM students s\n      WHERE EXISTS (SELECT 1 FROM match_evaluations me WHERE me.student_id = s.id)\n      ORDER BY evaluated_at ASC\n    `,
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
    `\n    SELECT\n      hs.code AS code,\n      me.final_score AS final_score,\n      me.rank_position AS rank_position\n    FROM match_evaluations me\n    JOIN his_specialties hs ON hs.id = me.specialty_id\n    WHERE me.student_id = ?\n    ORDER BY me.rank_position ASC\n    LIMIT 3\n  `,
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
