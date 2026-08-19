import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Always resolve data files from the server package root, not process.cwd().
 * - tsx:   .../server/src/db → ../../data
 * - dist:  .../server/dist/db → ../../data
 */
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, "../..");
const dataDir = path.join(packageRoot, "data");

export const dbPath = path.join(dataDir, "his-sre.db");
export const seedPath = path.join(dataDir, "specialties.seed.json");
export const careerSeedPath = path.join(dataDir, "career-paths.seed.json");

fs.mkdirSync(dataDir, { recursive: true });

/** Shared SQLite handle (WAL + foreign keys). */
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
