/**
 * Public DB API — re-exports core + analytics helpers.
 */
export {
  db,
  initDatabase,
  getActiveSpecialties,
  getCareerPathsBySpecialty,
  persistEvaluation,
} from "./db-core.js";
export type { CareerPathRecord } from "./db-core.js";

export {
  exportEvaluationsAsCsv,
  getAnalyticsSummary,
  getRecentSessions,
  getRecentEvaluationsAnonymized,
  getStudentProfile,
} from "./db-analytics.js";
export type {
  ExportFilters,
  AnalyticsFilters,
  CountRow,
  AnalyticsSummary,
  SessionListRow,
  StudentMatchRow,
  StudentProfileDetail,
} from "./db-analytics.js";
