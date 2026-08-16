import { db } from "./db.js";

/**
 * Base evaluation UUIDs for a student (sheet column A stores this id).
 * DB evaluation row ids are `${evaluationId}_${specialtyId}`.
 */
export const getEvaluationIdsForStudent = (studentId: string): string[] => {
  const rows = db
    .prepare(`SELECT DISTINCT id FROM match_evaluations WHERE student_id = ?`)
    .all(studentId) as Array<{ id: string }>;

  const ids = new Set<string>();
  for (const row of rows) {
    const raw = row.id ?? "";
    // UUID is 36 chars; specialty suffix starts at first underscore after that.
    const cut = raw.indexOf("_");
    if (cut === 36) {
      ids.add(raw.slice(0, 36));
    } else if (cut > 0) {
      ids.add(raw.slice(0, cut));
    } else if (raw) {
      ids.add(raw);
    }
  }
  return [...ids];
};

export const getStudentFullName = (studentId: string): string | null => {
  const row = db
    .prepare(`SELECT full_name FROM students WHERE id = ?`)
    .get(studentId) as { full_name: string } | undefined;
  return row?.full_name ?? null;
};

/**
 * Delete a student and cascade-related rows (grades, RIASEC, evaluations)
 * via FK ON DELETE CASCADE.
 */
export const deleteStudent = (studentId: string): boolean => {
  const result = db.prepare(`DELETE FROM students WHERE id = ?`).run(studentId);
  return Number(result.changes) > 0;
};
