import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";
import {
  getActiveSpecialties,
  getCareerPathsBySpecialty,
  exportEvaluationsAsCsv,
  getAnalyticsSummary,
  getRecentSessions,
  getStudentProfile,
  initDatabase,
  persistEvaluation,
} from "./db.js";
import type { AnalyticsFilters, ExportFilters } from "./db.js";
import {
  deleteStudent,
  getEvaluationIdsForStudent,
  getStudentFullName,
} from "./student-delete.js";
import { getAnalyticsDashboard } from "./analytics-dashboard.js";
import { isAdminAuthConfigured, requireAdminToken } from "./admin-auth.js";
import { calculateRecommendations } from "./engine.js";
import {
  removeStudentRowsFromSheet,
  startSheetsPeriodicResync,
  syncEvaluationToSheet,
} from "./integrations/google-sheets.js";
import { logger } from "./logger.js";
import { CalculateRecommendationSchema, type CalculateRecommendationInput } from "./schema.js";
import {
  STREAM_SUBJECT_MAP,
  STREAM_GRADE_SLOTS,
  SUBJECT_CODES,
  BAC_STREAMS,
  TECHNICAL_MATH_OPTIONS,
  TECHNICAL_MATH_OPTION_LABELS,
  ACADEMIC_SLOT_WEIGHTS,
  RIASEC_LETTERS,
  RIASEC_LABELS,
  FORMULA_WEIGHTS,
  STREAM_LABELS,
  SUBJECT_LABELS,
  type StudentProfile,
} from "./types.js";

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
  helmet({
    contentSecurityPolicy: false,
  }),
);

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

const limiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 300 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseAnalyticsFilters(req: express.Request): AnalyticsFilters {
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
    const specialties = getActiveSpecialties().map((s) => ({
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
      academicSlotWeights: ACADEMIC_SLOT_WEIGHTS,
      specialties,
      careerPathsBySpecialty: getCareerPathsBySpecialty(),
    });
  } catch (error) {
    logger.error("config_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load config." });
  }
});

/** Map flat Zod input → nested StudentProfile the engine/persist expect. */
function toStudentProfile(input: CalculateRecommendationInput): StudentProfile {
  return {
    fullName: input.fullName,
    bacStream: input.bacStream,
    technicalOption: input.technicalOption,
    preferredSpecialtyCode: input.preferredSpecialtyCode,
    academicPerformance: {
      overallBacMark: input.overallBacMark,
      grades: input.grades as StudentProfile["academicPerformance"]["grades"],
    },
    topRiasec: input.topRiasec,
  };
}

app.post("/api/v1/recommendations", (req, res) => {
  try {
    const parsed = CalculateRecommendationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed.",
        issues: parsed.error.issues,
      });
      return;
    }
    const profile = toStudentProfile(parsed.data);
    const specialties = getActiveSpecialties();
    const result = calculateRecommendations(profile, specialties);
    persistEvaluation(profile, result);
    const evaluationId = result.evaluationId;
    void syncEvaluationToSheet(evaluationId).catch((err) => {
      logger.error("google_sheets_sync_failed", {
        evaluationId,
        err: err instanceof Error ? err.message : String(err),
      });
    });
    res.json({ ...result, evaluationId });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation failed.", issues: error.issues });
      return;
    }
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
    const name = getStudentFullName(studentId);
    const evalIds = getEvaluationIdsForStudent(studentId);
    const deleted = deleteStudent(studentId);
    if (!deleted) {
      res.status(404).json({ message: "Student not found." });
      return;
    }
    void removeStudentRowsFromSheet(evalIds).catch((err) => {
      logger.error("google_sheets_delete_sync_failed", {
        studentId,
        err: err instanceof Error ? err.message : String(err),
      });
    });
    res.json({ ok: true, studentId, fullName: name });
  } catch (error) {
    logger.error("student_delete_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to delete student." });
  }
});

app.get("/api/v1/export/evaluations.csv", (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req) as ExportFilters;
    const csv = exportEvaluationsAsCsv(filters);
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
    adminAuthRequired: isAdminAuthConfigured(),
    allowedOrigins,
    health: `http://${HOST}:${PORT}/api/v1/health`,
  });
  startSheetsPeriodicResync();
});
