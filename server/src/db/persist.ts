import { db } from "./connection.js";
import type { CalculationResult, StudentProfile, SubjectCode } from "../types.js";
import { topRiasecToVector } from "../types.js";

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

/** Persist one orientation session (student + grades + RIASEC + ranked matches). */
export const persistEvaluation = (
  studentProfile: StudentProfile,
  result: CalculationResult,
): void => {
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
