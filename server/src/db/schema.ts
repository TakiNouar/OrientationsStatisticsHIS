import { db } from "./connection.js";

/** Create tables and safe additive migrations. Idempotent. */
export const createTables = (): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      bac_stream TEXT NOT NULL,
      overall_bac_mark NUMERIC NOT NULL CHECK (overall_bac_mark BETWEEN 0.00 AND 20.00),
      preferred_specialty_code TEXT,
      technical_option TEXT,
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
      final_score_no_riasec NUMERIC,
      rank_position_no_riasec INTEGER,
      evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_evaluations_student ON match_evaluations(student_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_specialty ON match_evaluations(specialty_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_final_score ON match_evaluations(final_score DESC);
    CREATE INDEX IF NOT EXISTS idx_evaluations_evaluated_at ON match_evaluations(evaluated_at);

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

  const tryAlter = (sql: string): void => {
    try {
      db.exec(sql);
    } catch {
      // column already exists
    }
  };

  tryAlter(`ALTER TABLE students ADD COLUMN preferred_specialty_code TEXT`);
  tryAlter(`ALTER TABLE students ADD COLUMN technical_option TEXT`);
  tryAlter(`ALTER TABLE riasec_profiles ADD COLUMN top_riasec_json TEXT`);
  tryAlter(`ALTER TABLE his_specialties ADD COLUMN is_technical INTEGER DEFAULT 0`);
  tryAlter(
    `ALTER TABLE his_specialties ADD COLUMN holland_code_json TEXT DEFAULT '["I","C","E"]'`,
  );
  tryAlter(`ALTER TABLE match_evaluations ADD COLUMN final_score_no_riasec NUMERIC`);
  tryAlter(`ALTER TABLE match_evaluations ADD COLUMN rank_position_no_riasec INTEGER`);
};
