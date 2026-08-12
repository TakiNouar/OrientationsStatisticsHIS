import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  CalculationResult,
  HisSpecialtyConfig,
  SeedSpecialty,
  StudentProfile,
  SubjectCode,
} from "./types.js";
import { topRiasecToVector } from "./types.js";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "his-sre.db");
const seedPath = path.join(dataDir, "specialties.seed.json");

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
  `);

  try {
    db.exec(`ALTER TABLE riasec_profiles ADD COLUMN top_riasec_json TEXT`);
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
      id,
      code,
      title,
      department,
      description,
      subject_weights_json,
      stream_modifiers_json,
      riasec_benchmark_json,
      is_active
    ) VALUES (
      @id,
      @code,
      @title,
      @department,
      @description,
      @subjectWeightsJson,
      @streamModifiersJson,
      @riasecBenchmarkJson,
      @isActive
    )
    ON CONFLICT(code) DO UPDATE SET
      title = excluded.title,
      department = excluded.department,
      description = excluded.description,
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
        subjectWeightsJson: JSON.stringify(specialty.subjectWeights),
        streamModifiersJson: JSON.stringify(specialty.streamModifiers),
        riasecBenchmarkJson: JSON.stringify(specialty.riasecBenchmark),
        isActive: specialty.isActive ? 1 : 0,
      });
    }
  });

  run(loadSeedData().map(normalizeSeed));
};

export const initDatabase = (): void => {
  createTables();
  upsertSpecialties();
};

type SpecialtyRow = {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  subject_weights_json: string;
  stream_modifiers_json: string;
  riasec_benchmark_json: string;
  is_active: number;
};

export const getActiveSpecialties = (): HisSpecialtyConfig[] => {
  const rows = db
    .prepare(
      `
        SELECT
          id,
          code,
          title,
          department,
          description,
          subject_weights_json,
          stream_modifiers_json,
          riasec_benchmark_json,
          is_active
        FROM his_specialties
        WHERE is_active = 1
        ORDER BY department, title
      `,
    )
    .all() as SpecialtyRow[];

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    department: row.department,
    description: row.description,
    subjectWeights: JSON.parse(row.subject_weights_json) as HisSpecialtyConfig["subjectWeights"],
    streamModifiers: JSON.parse(row.stream_modifiers_json) as HisSpecialtyConfig["streamModifiers"],
    riasecBenchmark: JSON.parse(row.riasec_benchmark_json) as HisSpecialtyConfig["riasecBenchmark"],
    isActive: Boolean(row.is_active),
  }));
};

// Tables must exist before statements are prepared (module load order).
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
    id,
    student_id,
    realistic_score,
    investigative_score,
    artistic_score,
    social_score,
    enterprising_score,
    conventional_score,
    top_riasec_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEvaluation = db.prepare(`
  INSERT INTO match_evaluations (
    id,
    student_id,
    specialty_id,
    academic_score,
    riasec_score,
    final_score,
    rank_position,
    evaluated_at
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

export const exportEvaluationsAsCsv = (): string => {
  const rows = db
    .prepare(
      `
      SELECT
        me.id AS evaluation_id,
        me.evaluated_at,
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
      ORDER BY me.evaluated_at DESC, me.rank_position ASC
    `,
    )
    .all() as ExportRow[];

  const header = [
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
  ];

  const escapeCsv = (value: string | number): string => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const body = rows.map((row) => header.map((column) => escapeCsv(row[column as keyof ExportRow])).join(","));
  return [header.join(","), ...body].join("\n");
};
