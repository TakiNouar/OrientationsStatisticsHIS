/**
 * Database layer — schema, seed, persist, analytics.
 * Import from "../db.js" (server/src/db.ts re-exports this).
 */
import { createTables } from "./schema.js";
import { upsertSpecialties, upsertCareerPaths } from "./seed.js";
import { db, careerSeedPath, seedPath } from "./connection.js";
import { logger } from "../logger.js";
import fs from "node:fs";

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

  const specialtyCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM his_specialties WHERE is_active = 1`).get() as { n: number }
  ).n;
  const careerCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM career_paths WHERE is_active = 1`).get() as { n: number }
  ).n;

  logger.info("database_ready", {
    specialties: specialtyCount,
    careerPaths: careerCount,
    specialtySeedExists: fs.existsSync(seedPath),
    careerSeedExists: fs.existsSync(careerSeedPath),
    specialtySeedPath: seedPath,
    careerSeedPath,
  });

  if (careerCount === 0) {
    logger.error("career_paths_empty", {
      hint: "career-paths.seed.json missing or failed to load — Careers tab will be empty",
      careerSeedPath,
      exists: fs.existsSync(careerSeedPath),
    });
  }
};
