import { db } from "./connection.js";
import type { CalculationResult, StudentProfile, SubjectCode } from "../types.js";
import { topRiasecToVector } from "../types.js";
import type { Statement } from "better-sqlite3";

/**
 * Prepared statements must NOT run at module load time.
 * ESM evaluates imports before index.ts reaches initDatabase()/createTables(),
 * so top-level db.prepare() crashes on a fresh DB with "no such table".
 */
let insertStudent: Statement | null = null;
let insertGrade: Statement | null = null;
let insertRiasec: Statement | null = null;
let insertEvaluation: Statement | null = null;

const getStatements = () => {
  if (!insertStudent) {
    insertStudent = db.prepare(`
      INSERT INTO students (id, full_name, bac_stream, overall_bac_mark, preferred_specialty_code, technical_option)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
  }
  if (!insertGrade) {
    insertGrade = db.prepare(`
      INSERT INTO bac_grades (id, student_id, subject_code, grade_value)
      VALUES (?, ?, ?, ?)
    `);
  }
  if (!insertRiasec) {
    insertRiasec = db.prepare(`
      INSERT INTO riasec_profiles (
        id, student_id, realistic_score, investigative_score, artistic_score,
        social_score, enterprising_score, conventional_score, top_riasec_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }
  if (!insertEvaluation) {
    insertEvaluation = db.prepare(`
      INSERT INTO match_evaluations (
        id, student_id, specialty_id, academic_score, riasec_score, final_score, rank_position, evaluated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }
  return {
    insertStudent,
    insertGrade,
    insertRiasec,
    insertEvaluation,
  };
};

/** Persist one orientation session (student + grades + RIASEC + ranked matches). */
export const persistEvaluation = (
  studentProfile: StudentProfile,
  result: CalculationResult,
): void => {
  const stmts = getStatements();

  const save = db.transaction(() => {
    const studentId = studentProfile.studentId ?? crypto.randomUUID();
    stmts.insertStudent.run(
      studentId,
      studentProfile.fullName,
      studentProfile.bacStream,
      studentProfile.academicPerformance.overallBacMark,
      studentProfile.preferredSpecialtyCode ?? null,
      studentProfile.technicalOption ?? null,
    );

    const gradeEntries = Object.entries(studentProfile.academicPerformance.grades) as [
      SubjectCode,
      number,
    ][];
    for (const [subjectCode, grade] of gradeEntries) {
      stmts.insertGrade.run(crypto.randomUUID(), studentId, subjectCode, grade);
    }

    const expanded = topRiasecToVector(studentProfile.topRiasec);
    stmts.insertRiasec.run(
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
      stmts.insertEvaluation.run(
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
