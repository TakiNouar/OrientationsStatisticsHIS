import { db } from "./db.js";

/**
 * Delete a student and cascade-related rows (grades, RIASEC, evaluations)
 * via FK ON DELETE CASCADE.
 */
export const deleteStudent = (studentId: string): boolean => {
  const result = db.prepare(`DELETE FROM students WHERE id = ?`).run(studentId);
  return Number(result.changes) > 0;
};
