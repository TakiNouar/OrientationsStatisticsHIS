import { db } from "./connection.js";
import { labelFromFinalScore } from "../types.js";
import { buildEvaluationWhere, type ExportFilters } from "./filters.js";

export type { ExportFilters };

export const exportEvaluationsAsCsv = (filters: ExportFilters = {}): string => {
  const anonymized = filters.anonymized === true;
  const { where, params } = buildEvaluationWhere(filters);

  const rows = db
    .prepare(
      `
      SELECT
        me.id AS evaluation_id,
        me.evaluated_at,
        s.id AS student_id,
        s.full_name AS student_name,
        s.bac_stream,
        s.overall_bac_mark,
        hs.code AS specialty_code,
        hs.title AS specialty_title,
        hs.department,
        me.academic_score,
        me.riasec_score,
        me.final_score,
        me.rank_position
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${where}
      ORDER BY me.evaluated_at DESC, me.rank_position ASC
    `,
    )
    .all(params) as Array<{
    evaluation_id: string;
    evaluated_at: string;
    student_id: string;
    student_name: string;
    bac_stream: string;
    overall_bac_mark: number;
    specialty_code: string;
    specialty_title: string;
    department: string;
    academic_score: number;
    riasec_score: number;
    final_score: number;
    rank_position: number;
  }>;

  const header = anonymized
    ? [
        "session_ref",
        "evaluated_at",
        "bac_stream",
        "overall_bac_mark",
        "specialty_code",
        "specialty_title",
        "department",
        "academic_score",
        "riasec_score",
        "final_score",
        "rank_position",
        "match_label",
      ]
    : [
        "student_id",
        "evaluation_id",
        "evaluated_at",
        "student_name",
        "bac_stream",
        "overall_bac_mark",
        "specialty_code",
        "specialty_title",
        "department",
        "academic_score",
        "riasec_score",
        "final_score",
        "rank_position",
        "match_label",
      ];

  const escapeCsv = (value: string | number): string => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const body = rows.map((row) => {
    const matchLabel = labelFromFinalScore(Number(row.final_score));
    if (anonymized) {
      return [
        row.student_id.slice(0, 8),
        row.evaluated_at,
        row.bac_stream,
        row.overall_bac_mark,
        row.specialty_code,
        row.specialty_title,
        row.department,
        row.academic_score,
        row.riasec_score,
        row.final_score,
        row.rank_position,
        matchLabel,
      ]
        .map(escapeCsv)
        .join(",");
    }
    return [
      row.student_id,
      row.evaluation_id,
      row.evaluated_at,
      row.student_name,
      row.bac_stream,
      row.overall_bac_mark,
      row.specialty_code,
      row.specialty_title,
      row.department,
      row.academic_score,
      row.riasec_score,
      row.final_score,
      row.rank_position,
      matchLabel,
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [header.join(","), ...body].join("\n");
};
