/**
 * Phase B1 dashboard queries — kept separate from core db CRUD for clarity.
 */
import { db } from "./db.js";
import type { AnalyticsFilters, CountRow } from "./db.js";
import { labelFromFinalScore } from "./types.js";
import type { MatchLabel } from "./types.js";

const buildRank1Where = (
  filters: AnalyticsFilters,
): { where: string; params: Record<string, string> } => {
  const clauses: string[] = ["me.rank_position = 1"];
  const params: Record<string, string> = {};

  if (filters.from) {
    clauses.push("me.evaluated_at >= @from");
    params.from = filters.from;
  }
  if (filters.to) {
    clauses.push("me.evaluated_at <= @to");
    params.to = filters.to;
  }
  if (filters.bacStream) {
    clauses.push("s.bac_stream = @bacStream");
    params.bacStream = filters.bacStream;
  }
  if (filters.specialtyCode) {
    clauses.push("hs.code = @specialtyCode");
    params.specialtyCode = filters.specialtyCode;
  }

  return { where: `WHERE ${clauses.join(" AND ")}`, params };
};

export type VolumePoint = { date: string; count: number };

export type MatrixCell = {
  bacStream: string;
  specialtyCode: string;
  specialtyTitle: string;
  count: number;
};

export type ScoreBucket = {
  key: string;
  label: string;
  min: number;
  max: number;
  count: number;
};

export type DataQualityReport = {
  neverRankedSpecialtyCodes: Array<{ code: string; title: string }>;
  highScoreSessions: number;
  lowScoreSessions: number;
  averageFinalScore: number | null;
  averageOverallBac: number | null;
  sessionsMissingRiasec: number;
};

export type AnalyticsDashboard = {
  volumeByDay: VolumePoint[];
  streamSpecialtyMatrix: MatrixCell[];
  scoreBuckets: ScoreBucket[];
  byMatchLabel: CountRow[];
  dataQuality: DataQualityReport;
  filters: AnalyticsFilters;
};

export const getAnalyticsDashboard = (filters: AnalyticsFilters = {}): AnalyticsDashboard => {
  const { where, params } = buildRank1Where(filters);

  const volumeRows = db
    .prepare(
      `
      SELECT substr(me.evaluated_at, 1, 10) AS day, COUNT(*) AS count
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${where}
      GROUP BY day
      ORDER BY day ASC
    `,
    )
    .all(params) as Array<{ day: string; count: number }>;

  const matrixRows = db
    .prepare(
      `
      SELECT s.bac_stream AS bac_stream, hs.code AS specialty_code, hs.title AS specialty_title,
             COUNT(*) AS count
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${where}
      GROUP BY s.bac_stream, hs.code, hs.title
      ORDER BY s.bac_stream, count DESC
    `,
    )
    .all(params) as Array<{
    bac_stream: string;
    specialty_code: string;
    specialty_title: string;
    count: number;
  }>;

  const scoreRows = db
    .prepare(
      `
      SELECT me.final_score AS final_score
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${where}
    `,
    )
    .all(params) as Array<{ final_score: number }>;

  const bucketDefs: Array<{ key: string; label: string; min: number; max: number }> = [
    { key: "0-35", label: "0–35 (weak)", min: 0, max: 35 },
    { key: "35-50", label: "35–50 (developing)", min: 35, max: 50 },
    { key: "50-65", label: "50–65 (possible)", min: 50, max: 65 },
    { key: "65-80", label: "65–80 (strong conversation)", min: 65, max: 80 },
    { key: "80-100", label: "80–100 (strong)", min: 80, max: 100.001 },
  ];

  const scoreBuckets: ScoreBucket[] = bucketDefs.map((b) => ({
    ...b,
    count: 0,
  }));

  const labelCounts: Record<MatchLabel, number> = {
    STRONG_MATCH: 0,
    STRONG_MATCH_CONVERSATION: 0,
    POSSIBLE_FIT: 0,
    PROFILE_DEVELOPING: 0,
    WEAK_MATCH: 0,
  };

  let sumScore = 0;
  let high = 0;
  let low = 0;
  for (const row of scoreRows) {
    const score = Number(row.final_score);
    sumScore += score;
    if (score >= 90) high += 1;
    if (score < 30) low += 1;
    for (const b of scoreBuckets) {
      if (score >= b.min && score < b.max) {
        b.count += 1;
        break;
      }
    }
    labelCounts[labelFromFinalScore(score)] += 1;
  }

  const byMatchLabel: CountRow[] = (
    [
      "STRONG_MATCH",
      "STRONG_MATCH_CONVERSATION",
      "POSSIBLE_FIT",
      "PROFILE_DEVELOPING",
      "WEAK_MATCH",
    ] as MatchLabel[]
  ).map((key) => ({ key, label: key, count: labelCounts[key] }));

  // Specialties never chosen as rank-1 (within current filters, but compare against all active specialties)
  const rankedCodes = new Set(matrixRows.map((r) => r.specialty_code));
  // When specialty filter is set, matrix only has that specialty — still list others as never ranked in filter context
  const allSpecialties = db
    .prepare(`SELECT code, title FROM his_specialties WHERE is_active = 1 ORDER BY title`)
    .all() as Array<{ code: string; title: string }>;

  const neverRankedSpecialtyCodes = allSpecialties
    .filter((s) => !rankedCodes.has(s.code))
    .map((s) => ({ code: s.code, title: s.title }));

  const avgBacRow = db
    .prepare(
      `
      SELECT AVG(s.overall_bac_mark) AS avg_bac
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      ${where}
    `,
    )
    .get(params) as { avg_bac: number | null };

  const missingRiasecRow = db
    .prepare(
      `
      SELECT COUNT(*) AS c
      FROM match_evaluations me
      JOIN students s ON s.id = me.student_id
      JOIN his_specialties hs ON hs.id = me.specialty_id
      LEFT JOIN riasec_profiles rp ON rp.student_id = s.id
      ${where} AND rp.id IS NULL
    `,
    )
    .get(params) as { c: number };

  const n = scoreRows.length;

  return {
    volumeByDay: volumeRows.map((r) => ({ date: r.day, count: Number(r.count) })),
    streamSpecialtyMatrix: matrixRows.map((r) => ({
      bacStream: r.bac_stream,
      specialtyCode: r.specialty_code,
      specialtyTitle: r.specialty_title,
      count: Number(r.count),
    })),
    scoreBuckets,
    byMatchLabel,
    dataQuality: {
      neverRankedSpecialtyCodes,
      highScoreSessions: high,
      lowScoreSessions: low,
      averageFinalScore: n > 0 ? Number((sumScore / n).toFixed(2)) : null,
      averageOverallBac:
        avgBacRow?.avg_bac != null ? Number(Number(avgBacRow.avg_bac).toFixed(2)) : null,
      sessionsMissingRiasec: Number(missingRiasecRow?.c ?? 0),
    },
    filters,
  };
};
