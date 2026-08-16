import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
export const dbPath = path.join(dataDir, "his-sre.db");
export const seedPath = path.join(dataDir, "specialties.seed.json");
export const careerSeedPath = path.join(dataDir, "career-paths.seed.json");

fs.mkdirSync(dataDir, { recursive: true });

/** Shared SQLite handle (WAL + foreign keys). */
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
