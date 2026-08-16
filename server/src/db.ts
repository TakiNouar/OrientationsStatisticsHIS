import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  CalculationResult,
  HisSpecialtyConfig,
  SeedSpecialty,
  StudentProfile,
  SubjectCode,
  MatchLabel,
  RiasecLetter,
} from "./types.js";
import { labelFromFinalScore, MATCH_LABEL_TEXT, topRiasecToVector } from "./types.js";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "his-sre.db");
const seedPath = path.join(dataDir, "specialties.seed.json");
const careerSeedPath = path.join(dataDir, "career-paths.seed.json");

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const createTables = (): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      bac_stream TEXT NOT NULL,
      overall_bac_mark NUMERIC NOT NULL CHECK (overall_bac_mark BETWEEN 0.00 AND 20.00),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bac_grades (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_code TEXT NOT NULL,
      grade_value NUMERIC NOT NULL CHECK (grade_value BETWEEN 0.00 AND 20.00),
      UNIQUE(student_id, subject_code)
    );

    CREATE TABLE IF NOT EXISTS riasec_profiles (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
      realistic_score NUMERIC NOT NULL CHECK (realistic_score >= 0.00),
      investigative_score NUMERIC NOT NULL CHECK (investigative_score >= 0.00),
      artistic_score NUMERIC NOT NULL CHECK (artistic_score >= 0.00),
      social_score NUMERIC NOT NULL CHECK (social_score >= 0.00),
      enterprising_score NUMERIC NOT NULL CHECK (enterprising_score >= 0.00),
      conventional_score NUMERIC NOT NULL CHECK (conventional_score >= 0.00),
      top_riasec_json TEXT
    );

    CREATE TABLE IF NOT EXISTS his_specialties (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      description TEXT,
      is_technical INTEGER DEFAULT 0,
      holland_code_json TEXT NOT NULL DEFAULT '["I","C","E"]',
      subject_weights_json TEXT NOT NULL,
      stream_modifiers_json TEXT NOT NULL,
      riasec_benchmark_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_evaluations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      specialty_id TEXT NOT NULL REFERENCES his_specialties(id) ON DELETE CASCADE,
      academic_score NUMERIC NOT NULL,
      riasec_score NUMERIC NOT NULL,
      final_score NUMERIC NOT NULL,
      rank_position INTEGER NOT NULL,
      evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_evaluations_student ON match_evaluations(student_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_specialty ON match_evaluations(specialty_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_final_score ON match_evaluations(final_score DESC);

    CREATE TABLE IF NOT EXISTS career_paths (
      id TEXT PRIMARY KEY,
      specialty_code TEXT NOT NULL,
      title_fr TEXT NOT NULL,
      title_en TEXT NOT NULL,
      sector_fr TEXT NOT NULL,
      sector_en TEXT NOT NULL,
      level TEXT NOT NULL,
      description_fr TEXT NOT NULL,
      description_en TEXT NOT NULL,
      examples_fr_json TEXT NOT NULL,
      examples_en_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_career_paths_specialty ON career_paths(specialty_code);
  `);

  try {
    db.exec(`ALTER TABLE riasec_profiles ADD COLUMN top_riasec_json TEXT`);
  } catch {
    // Column already exists.
  }

  try {
    db.exec(`ALTER TABLE his_specialties ADD COLUMN is_technical INTEGER DEFAULT 0`);
  } catch {
    // Column already exists.
  }

  try {
    db.exec(`ALTER TABLE his_specialties ADD COLUMN holland_code_json TEXT DEFAULT '["I","C","E"]'`);
  } catch {
    // Column already exists.
  }
};

const loadSeedData = (): SeedSpecialty[] => {
  const raw = fs.readFileSync(seedPath, "utf8");
  return JSON.parse(raw) as SeedSpecialty[];
};

const specialtyIdFromCode = (code: string): string =>
  `spec_${code.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

const normalizeSeed = (seed: SeedSpecialty): HisSpecialtyConfig => ({
  id: specialtyIdFromCode(seed.code),
  code: seed.code,
  title: seed.title,
  department: seed.department,
  description: seed.description,
  isTechnical: Boolean(seed.isTechnical),
  hollandCode: seed.hollandCode,
  subjectWeights: {
    weights: seed.weights,
  },
  streamModifiers: seed.streamModifiers,
  riasecBenchmark: {
    vector: {
      realistic: seed.riasecBenchmark.R,
      investigative: seed.riasecBenchmark.I,
      artistic: seed.riasecBenchmark.A,
      social: seed.riasecBenchmark.S,
      enterprising: seed.riasecBenchmark.E,
      conventional: seed.riasecBenchmark.C,
    },
  },
  isActive: true,
});

const upsertSpecialties = (): void => {
  const insert = db.prepare(`
    INSERT INTO his_specialties (
      id, code, title, department, description, is_technical, holland_code_json,
      subject_weights_json, stream_modifiers_json, riasec_benchmark_json, is_active
    ) VALUES (
      @id, @code, @title, @department, @description, @isTechnical, @hollandCodeJson,
      @subjectWeightsJson, @streamModifiersJson, @riasecBenchmarkJson, @isActive
    )
    ON CONFLICT(code) DO UPDATE SET
      title = excluded.title,
      department = excluded.department,
      description = excluded.description,
      is_technical = excluded.is_technical,
      holland_code_json = excluded.holland_code_json,
      subject_weights_json = excluded.subject_weights_json,
      stream_modifiers_json = excluded.stream_modifiers_json,
      riasec_benchmark_json = excluded.riasec_benchmark_json,
      is_active = excluded.is_active
  `);

  const run = db.transaction((specialties: HisSpecialtyConfig[]) => {
    for (const specialty of specialties) {
      insert.run({
        id: specialty.id,
        code: specialty.code,
        title: specialty.title,
        department: specialty.department,
        description: specialty.description,
        isTechnical: specialty.isTechnical ? 1 : 0,
        hollandCodeJson: JSON.stringify(specialty.hollandCode),
        subjectWeightsJson: JSON.stringify(specialty.subjectWeights),
        streamModifiersJson: JSON.stringify(specialty.streamModifiers),
        riasecBenchmarkJson: JSON.stringify(specialty.riasecBenchmark),
        isActive: specialty.isActive ? 1 : 0,
      });
    }
  });

  run(loadSeedData().map(normalizeSeed));
};

type CareerPathSeed = {
  id: string;
  specialtyCode: string;
  titleFr: string;
  titleEn: string;
  sectorFr: string;
  sectorEn: string;
  level: string;
  descriptionFr: string;
  descriptionEn: string;
  examplesFr: string[];
  examplesEn: string[];
};

export type CareerPathRecord = {
  id: string;
  specialtyCode: string;
  titleFr: string;
  titleEn: string;
  sectorFr: string;
  sectorEn: string;
  level: string;
  descriptionFr: string;
  descriptionEn: string;
  examplesFr: string[];
  examplesEn: string[];
};

const upsertCareerPaths = (): void => {
  if (!fs.existsSync(careerSeedPath)) {
    return;
  }
  const seeds = JSON.parse(fs.readFileSync(careerSeedPath, "utf8")) as CareerPathSeed[];
  const insert = db.prepare(`
    INSERT INTO career_paths (
      id, specialty_code, title_fr, title_en, sector_fr, sector_en, level,
      description_fr, description_en, examples_fr_json, examples_en_json, is_active
    ) VALUES (
      @id, @specialtyCode, @titleFr, @titleEn, @sectorFr, @sectorEn, @level,
      @descriptionFr, @descriptionEn, @examplesFrJson, @examplesEnJson, 1
    )
    ON CONFLICT(id) DO UPDATE SET
      specialty_code = excluded.specialty_code,
      title_fr = excluded.title_fr,
      title_en = excluded.title_en,
      sector_fr = excluded.sector_fr,
      sector_en = excluded.sector_en,
      level = excluded.level,
      description_fr = excluded.description_fr,
      description_en = excluded.description_en,
      examples_fr_json = excluded.examples_fr_json,
      examples_en_json = excluded.examples_en_json,
      is_active = 1
  `);
  const run = db.transaction((rows: CareerPathSeed[]) => {
    for (const row of rows) {
      insert.run({
        id: row.id,
        specialtyCode: row.specialtyCode,
        titleFr: row.titleFr,
        titleEn: row.titleEn,
        sectorFr: row.sectorFr,
        sectorEn: row.sectorEn,
        level: row.level,
        descriptionFr: row.descriptionFr,
        descriptionEn: row.descriptionEn,
        examplesFrJson: JSON.stringify(row.examplesFr ?? []),
        examplesEnJson: JSON.stringify(row.examplesEn ?? []),
      });
    }
  });
  run(seeds);
};

export const getCareerPathsBySpecialty = (): Record<string, CareerPathRecord[]> => {
  const rows = db
    .prepare(
      `SELECT id, specialty_code, title_fr, title_en, sector_fr, sector_en, level,
              description_fr, description_en, examples_fr_json, examples_en_json
       FROM career_paths WHERE is_active = 1 ORDER BY specialty_code, level, title_fr`,
    )
    .all() as Array<{
    id: string;
    specialty_code: string;
    title_fr: string;
    title_en: string;
    sector_fr: string;
    sector_en: string;
    level: string;
    description_fr: string;
    description_en: string;
    examples_fr_json: string;
    examples_en_json: string;
  }>;

  const map: Record<string, CareerPathRecord[]> = {};
  for (const row of rows) {
    const item: CareerPathRecord = {
      id: row.id,
      specialtyCode: row.specialty_code,
      titleFr: row.title_fr,
      titleEn: row.title_en,
      sectorFr: row.sector_fr,
      sectorEn: row.sector_en,
      level: row.level,
      descriptionFr: row.description_fr,
      descriptionEn: row.description_en,
      examplesFr: JSON.parse(row.examples_fr_json || "[]") as string[],
      examplesEn: JSON.parse(row.examples_en_json || "[]") as string[],
    };
    if (!map[item.specialtyCode]) map[item.specialtyCode] = [];
    map[item.specialtyCode].push(item);
  }
  return map;
};

export const initDatabase = (): void => {
  createTables();
  upsertSpecialties();
  upsertCareerPaths();
};

type SpecialtyRow = {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  is_technical: number;
  holland_code_json: string;
  subject_weights_json: string;
  stream_modifiers_json: string;
  riasec_benchmark_json: string;
  is_active: number;
};

export const getActiveSpecialties = (): HisSpecialtyConfig[] => {
  const rows = db
    .prepare(
      `
        SELECT id, code, title, department, description, is_technical, holland_code_json,
               subject_weights_json, stream_modifiers_json, riasec_benchmark_json, is_active
        FROM his_specialties WHERE is_active = 1 ORDER BY department, title
      `,
    )
    .all() as SpecialtyRow[];

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    department: row.department,
    description: row.description,
    isTechnical: Boolean(row.is_technical),
    hollandCode: JSON.parse(row.holland_code_json || '["I","C","E"]') as HisSpecialtyConfig["hollandCode"],
    subjectWeights: JSON.parse(row.subject_weights_json) as HisSpecialtyConfig["subjectWeights"],
    streamModifiers: JSON.parse(row.stream_modifiers_json) as HisSpecialtyConfig["streamModifiers"],
    riasecBenchmark: JSON.parse(row.riasec_benchmark_json) as HisSpecialtyConfig["riasecBenchmark"],
    isActive: Boolean(row.is_active),
  }));
};

createTables();

const insertStudent = db.prepare(`
  INSERT INTO students (id, full_name, bac_stream, overall_bac_mark)
  VALUES (?, ?, ?, ?)
`);

const insertGrade = db.prepare(`
  INSERT INTO bac_grades (id, student_id, subject_code, grade_value)
  VALUES (?, ?, ?, ?)
`);

const insertRiasec = db.prepare(`
  INSERT INTO riasec_profiles (
    id, student_id, realistic_score, investigative_score, artistic_score,
    social_score, enterprising_score, conventional_score, top_riasec_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEvaluation = db.prepare(`
  INSERT INTO match_evaluations (
    id, student_id, specialty_id, academic_score, riasec_score, final_score, rank_position, evaluated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export const persistEvaluation = (studentProfile: StudentProfile, result: CalculationResult): void => {
  const save = db.transaction(() => {
    const studentId = studentProfile.studentId ?? crypto.randomUUID();
    insertStudent.run(
      studentId,
      studentProfile.fullName,
      studentProfile.bacStream,
      studentProfile.academicPerformance.overallBacMark,
    );

    const gradeEntries = Object.entries(studentProfile.academicPerformance.grades) as [
      SubjectCode,
      number,
    ][];
    for (const [subjectCode, grade] of gradeEntries) {
      insertGrade.run(crypto.randomUUID(), studentId, subjectCode, grade);
    }

    const expanded = topRiasecToVector(studentProfile.topRiasec);
    insertRiasec.run(
      crypto.randomUUID(),
      studentId,
      expanded.realistic,
      expanded.investigative,
      expanded.artistic,
      expanded.social,
      expanded.enterprising,
      expanded.conventional,
      JSON.stringify(studentProfile.topRiasec),
    );

    for (const match of result.matches) {
      insertEvaluation.run(
        `${result.evaluationId}_${match.specialtyId}`,
        studentId,
        match.specialtyId,
        match.academicScore,
        match.psychometricScore,
        match.finalScore,
        match.rank,
        result.timestamp,
      );
    }
  });

  save();
};

type ExportRow = {
  evaluation_id: string;
  evaluated_at: string;
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
};

export type ExportFilters = {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
  /** When true, omit student_name. Default false (named export for counsellor LAN). */
  anonymized?: boolean;
};

const buildEvaluationWhere = (
  filters: ExportFilters,
  aliasMe = "me",
  aliasS = "s",
  aliasHs = "hs",
): { where: string; params: Record<string, string> } => {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.from) {
    clauses.push(`${aliasMe}.evaluated_at >= @from`);
    params.from = filters.from;
  }
  if (filters.to) {
    clauses.push(`${aliasMe}.evaluated_at <= @to`);
    params.to = filters.to;
  }
  if (filters.bacStream) {
    clauses.push(`${aliasS}.bac_stream = @bacStream`);
    params.bacStream = filters.bacStream;
  }
  if (filters.specialtyCode) {
    clauses.push(`${aliasHs}.code = @specialtyCode`);
    params.specialtyCode = filters.specialtyCode;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
};

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
    .all(params) as Array<ExportRow & { student_id: string }>;

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

export type AnalyticsFilters = {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
};

export type CountRow = { key: string; label: string; count: number };

export type AnalyticsSummary = {
  totalSessions: number;
  byStream: CountRow[];
  byTopSpecialty: CountRow[];
  byMatchLabel: CountRow[];
  filters: AnalyticsFilters;
};

/** Named session row for counsellor list (clickable profile). */
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
    const label = labelFromFinalScore(Number(row.final_score));
    labelCounts[label] += 1;
  }

  const byMatchLabel: CountRow[] = (
    [
      "STRONG_MATCH",
      "STRONG_MATCH_CONVERSATION",
      "POSSIBLE_FIT",
      "PROFILE_DEVELOPING",
      "WEAK_MATCH",
    ] as MatchLabel[]
  ).map((key) => ({
    key,
    label: key,
    count: labelCounts[key],
  }));

  return {
    totalSessions: Number(totalRow?.c ?? 0),
    byStream: byStreamRows.map((r) => ({ key: r.key, label: r.key, count: Number(r.count) })),
    byTopSpecialty: bySpecialtyRows.map((r) => ({
      key: r.key,
      label: r.label,
      count: Number(r.count),
    })),
    byMatchLabel,
    filters,
  };
};

/** Named sessions list (rank 1 only). */
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

/** @deprecated Use getRecentSessions — kept as alias during transition. */
export const getRecentEvaluationsAnonymized = getRecentSessions;

export const getStudentProfile = (studentId: string): StudentProfileDetail | null => {
  const student = db
    .prepare(
      `SELECT id, full_name, bac_stream, overall_bac_mark, created_at FROM students WHERE id = ?`,
    )
    .get(studentId) as
    | {
        id: string;
        full_name: string;
        bac_stream: string;
        overall_bac_mark: number;
        created_at: string;
      }
    | undefined;

  if (!student) return null;

  const gradeRows = db
    .prepare(`SELECT subject_code, grade_value FROM bac_grades WHERE student_id = ?`)
    .all(studentId) as Array<{ subject_code: string; grade_value: number }>;

  const grades: Record<string, number> = {};
  for (const g of gradeRows) {
    grades[g.subject_code] = Number(g.grade_value);
  }

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
      // keep default
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
