/**
 * Database layer — schema, seed, persist, analytics.
 * Import from "../db.js" (server/src/db.ts re-exports this).
 */
import { createTables } from "./schema.js";
import { upsertSpecialties, upsertCareerPaths } from "./seed.js";

export { db } from "./connection.js";
export { getActiveSpecialties } from "./specialties.js";
export { getCareerPathsBySpecialty } from "./careers.js";
export type { CareerPathRecord } from "./careers.js";
export { persistEvaluation } from "./persist.js";
export { exportEvaluationsAsCsv } from "./export-csv.js";
export type { ExportFilters } from "./filters.js";
export {
  getAnalyticsSummary,
  getRecentSessions,
  getRecentEvaluationsAnonymized,
  getStudentProfile,
  listAllSessionsForSheet,
} from "./analytics.js";
export type {
  AnalyticsFilters,
  CountRow,
  AnalyticsSummary,
  SessionListRow,
  StudentMatchRow,
  StudentProfileDetail,
  SheetSessionRow,
} from "./analytics.js";

/** Create schema (if needed) and re-seed specialties + career paths. */
export const initDatabase = (): void => {
  createTables();
  upsertSpecialties();
  upsertCareerPaths();
};
