import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { calculateRecommendations } from "./engine.js";
import { initDatabase, insertStudentEvaluation, listSpecialties } from "./db/index.js";
import {
  getAnalyticsSummary,
  getRecentSessions,
  getStudentProfile,
} from "./db/analytics.js";
import { deleteStudentById } from "./db/student-delete.js";
import { requireAdminToken } from "./admin-auth.js";
import { getAnalyticsDashboard } from "./analytics-dashboard.js";
import { exportEvaluationsCsv } from "./db/export-csv.js";
import {
  BAC_STREAMS,
  SUBJECT_CODES,
  STREAM_LABELS,
  SUBJECT_LABELS,
  STREAM_SUBJECT_MAP,
  STREAM_GRADE_SLOTS,
  TECHNICAL_MATH_OPTIONS,
  TECHNICAL_MATH_OPTION_LABELS,
  RIASEC_LETTERS,
  RIASEC_LABELS,
  FORMULA_WEIGHTS,
  recommendationInputSchema,
} from "./types.js";
import { logger } from "./logger.js";
import {
  isSheetsConfigured,
  scheduleSheetsResync,
  startSheetsPeriodicResync,
} from "./integrations/google-sheets.js";
import { CAREER_PATHS_BY_SPECIALTY } from "./data/career-paths.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "127.0.0.1";
const isDev = process.env.NODE_ENV !== "production";

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
const allowedOrigins = (process.env.CORS_ORIGINS ?? defaultOrigins.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

initDatabase();

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseAnalyticsFilters(req: express.Request) {
  return {
    from: typeof req.query.from === "string" ? req.query.from : undefined,
    to: typeof req.query.to === "string" ? req.query.to : undefined,
    bacStream: typeof req.query.bacStream === "string" ? req.query.bacStream : undefined,
    specialtyCode:
      typeof req.query.specialtyCode === "string" ? req.query.specialtyCode : undefined,
  };
}

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "his-sre-server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/config", (_req, res) => {
  try {
    const specialties = listSpecialties().map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      department: s.department,
      isTechnical: s.isTechnical,
      hollandCode: s.hollandCode,
    }));
    res.json({
      bacStreams: BAC_STREAMS,
      streamLabels: STREAM_LABELS,
      subjectCodes: SUBJECT_CODES,
      subjectLabels: SUBJECT_LABELS,
      streamSubjectMap: STREAM_SUBJECT_MAP,
      streamGradeSlots: STREAM_GRADE_SLOTS,
      technicalMathOptions: TECHNICAL_MATH_OPTIONS,
      technicalMathOptionLabels: TECHNICAL_MATH_OPTION_LABELS,
      riasecLetters: RIASEC_LETTERS,
      riasecLabels: RIASEC_LABELS,
      formulaWeights: FORMULA_WEIGHTS,
      specialties,
      careerPathsBySpecialty: CAREER_PATHS_BY_SPECIALTY,
    });
  } catch (error) {
    logger.error("config_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load config." });
  }
});

app.post("/api/v1/recommendations", (req, res) => {
  try {
    const parsed = recommendationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed.",
        issues: parsed.error.issues,
      });
      return;
    }
    const result = calculateRecommendations(parsed.data);
    const evaluationId = insertStudentEvaluation(parsed.data, result);
    if (isSheetsConfigured()) {
      scheduleSheetsResync();
    }
    res.json({ ...result, evaluationId });
  } catch (error) {
    logger.error("recommendations_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to calculate recommendations." });
  }
});

app.get("/api/v1/analytics/summary", (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req);
    res.json(getAnalyticsSummary(filters));
  } catch (error) {
    logger.error("analytics_summary_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load analytics summary." });
  }
});

app.get("/api/v1/analytics/dashboard", (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req);
    res.json(getAnalyticsDashboard(filters));
  } catch (error) {
    logger.error("analytics_dashboard_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load analytics dashboard." });
  }
});

app.get("/api/v1/analytics/recent", (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const sessions = getRecentSessions(filters, limit);
    res.json({ sessions, filters, limit });
  } catch (error) {
    logger.error("analytics_recent_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load recent sessions." });
  }
});

app.get("/api/v1/analytics/students/:studentId", (req, res) => {
  try {
    const studentId = routeParam(req.params.studentId);
    const profile = getStudentProfile(studentId);
    if (!profile) {
      res.status(404).json({ message: "Student not found." });
      return;
    }
    res.json(profile);
  } catch (error) {
    logger.error("student_profile_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load student profile." });
  }
});

app.delete("/api/v1/analytics/students/:studentId", requireAdminToken, (req, res) => {
  try {
    const studentId = routeParam(req.params.studentId);
    const deleted = deleteStudentById(studentId);
    if (!deleted) {
      res.status(404).json({ message: "Student not found." });
      return;
    }
    if (isSheetsConfigured()) {
      scheduleSheetsResync();
    }
    res.json({ ok: true, studentId });
  } catch (error) {
    logger.error("student_delete_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to delete student." });
  }
});

app.get("/api/v1/export/evaluations.csv", (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req);
    const csv = exportEvaluationsCsv(filters);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="evaluations.csv"');
    res.send(csv);
  } catch (error) {
    logger.error("export_csv_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to export CSV." });
  }
});

app.listen(PORT, HOST, () => {
  logger.info("server_started", {
    host: HOST,
    port: PORT,
    isDev,
    adminAuthRequired: Boolean(process.env.ADMIN_TOKEN),
    allowedOrigins,
    health: `http://${HOST}:${PORT}/api/v1/health`,
  });
  if (isSheetsConfigured()) {
    startSheetsPeriodicResync();
  }
});
