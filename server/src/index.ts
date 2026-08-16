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
import { deleteStudent } from "./student-delete.js";
import { getAnalyticsDashboard } from "./analytics-dashboard.js";
import { isAdminAuthConfigured, requireAdminToken } from "./admin-auth.js";
import { calculateRecommendations } from "./engine.js";
import { logger } from "./logger.js";
import { CalculateRecommendationSchema } from "./schema.js";
import {
  STREAM_SUBJECT_MAP,
  STREAM_GRADE_SLOTS,
  SUBJECT_CODES,
  BAC_STREAMS,
  TECHNICAL_MATH_OPTIONS,
  TECHNICAL_MATH_OPTION_LABELS,
  ACADEMIC_SLOT_WEIGHTS,
  AFFINITY_MIN,
  AFFINITY_MAX,
  RIASEC_LETTERS,
  RIASEC_LABELS,
  type StudentProfile,
  type TopRiasecProfile,
  type BacStream,
} from "./types.js";

initDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";
const isDev = (process.env.NODE_ENV ?? "development") !== "production";

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (isDev && isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      logger.warn("cors_blocked", { origin });
      callback(null, false);
    },
  }),
);

app.use(express.json({ limit: "100kb" }));

const calculateLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 120 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many calculation requests. Try again shortly." },
});

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "his-sre-server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/config", (_req, res) => {
  try {
    res.json({
      bacStreams: BAC_STREAMS,
      subjectCodes: SUBJECT_CODES,
      streamSubjects: STREAM_SUBJECT_MAP,
      streamGradeSlots: STREAM_GRADE_SLOTS,
      academicSlotWeights: ACADEMIC_SLOT_WEIGHTS,
      affinityRange: { min: AFFINITY_MIN, max: AFFINITY_MAX },
      technicalMathOptions: TECHNICAL_MATH_OPTIONS,
      technicalMathOptionLabels: TECHNICAL_MATH_OPTION_LABELS,
      riasecLetters: RIASEC_LETTERS,
      riasecLabels: RIASEC_LABELS,
      formulaWeights: { academic: 0.5, riasec: 0.3, technical: 0.2 },
      careerPathsBySpecialty: getCareerPathsBySpecialty(),
      adminAuthRequired: isAdminAuthConfigured(),
      specialties: getActiveSpecialties().map((specialty) => ({
        id: specialty.id,
        code: specialty.code,
        title: specialty.title,
        department: specialty.department,
        description: specialty.description,
        isTechnical: specialty.isTechnical,
        hollandCode: specialty.hollandCode,
        streamModifiers: specialty.streamModifiers,
        subjectWeights: specialty.subjectWeights.weights,
        riasecBenchmark: specialty.riasecBenchmark.vector,
      })),
    });
  } catch (error) {
    logger.error("config_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load configuration." });
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
    res.json({ sessions: getRecentSessions(filters, limit), filters });
  } catch (error) {
    logger.error("analytics_recent_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: "Failed to load recent sessions." });
  }
});

app.get("/api/v1/analytics/students/:studentId", (req, res) => {
  try {
    const studentId = req.params.studentId;
    if (!studentId || studentId.length < 8) {
      res.status(400).json({ message: "Invalid student id." });
      return;
    }
    const profile = getStudentProfile(studentId);
    if (!profile) {
      res.status(404).json({ message: "Student not found." });
      return;
    }
    res.json(profile);
  } catch (error) {
    logger.error("student_profile_failed", {
      err: error instanceof Error ? error.message : String(error),
      studentId: req.params.studentId,
    });
    res.status(500).json({ message: "Failed to load student profile." });
  }
});

app.delete("/api/v1/analytics/students/:studentId", requireAdminToken, (req, res) => {
  try {
    const studentId = req.params.studentId;
    if (!studentId || studentId.length < 8) {
      res.status(400).json({ message: "Invalid student id." });
      return;
    }
    const deleted = deleteStudent(studentId);
    if (!deleted) {
      res.status(404).json({ message: "Student not found." });
      return;
    }
    logger.info("student_deleted", { studentId });
    res.status(204).send();
  } catch (error) {
    logger.error("student_delete_failed", {
      err: error instanceof Error ? error.message : String(error),
      studentId: req.params.studentId,
    });
    res.status(500).json({ message: "Failed to delete student profile." });
  }
});

app.get("/api/v1/export/evaluations", (req, res) => {
  const format = req.query.format;
  if (format !== "csv") {
    res.status(400).json({
      message: "Unsupported format. Supported: format=csv",
    });
    return;
  }

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const bacStream =
    typeof req.query.bacStream === "string" ? (req.query.bacStream as BacStream) : undefined;
  const specialtyCode =
    typeof req.query.specialtyCode === "string" ? req.query.specialtyCode : undefined;
  const anonymized =
    req.query.anonymized === "1" ||
    req.query.anonymized === "true" ||
    req.query.anonymized === "yes";

  try {
    const csv = exportEvaluationsAsCsv({
      from,
      to,
      bacStream,
      specialtyCode,
      anonymized,
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=evaluations.csv");
    res.send(csv);
  } catch (error) {
    logger.error("export_failed", {
      err: error instanceof Error ? error.message : String(error),
      from,
      to,
      bacStream,
      specialtyCode,
      anonymized,
    });
    res.status(500).json({ message: "Failed to export evaluations." });
  }
});

app.post("/api/v1/recommendations/calculate", calculateLimiter, (req, res) => {
  try {
    const input = CalculateRecommendationSchema.parse(req.body);
    const studentProfile: StudentProfile = {
      fullName: input.fullName,
      bacStream: input.bacStream,
      technicalOption: input.technicalOption,
      academicPerformance: {
        overallBacMark: input.overallBacMark,
        grades: input.grades as StudentProfile["academicPerformance"]["grades"],
      },
      topRiasec: input.topRiasec as TopRiasecProfile,
    };

    const specialties = getActiveSpecialties();
    if (specialties.length === 0) {
      res.status(503).json({
        message: "No active specialties loaded. Check server seed data.",
      });
      return;
    }

    const result = calculateRecommendations(studentProfile, specialties);
    const careerMap = getCareerPathsBySpecialty();

    const enriched = {
      ...result,
      matches: result.matches.map((match) => ({
        ...match,
        careerPaths: careerMap[match.specialtyCode] ?? [],
      })),
    };

    queueMicrotask(() => {
      try {
        persistEvaluation(studentProfile, result);
      } catch (persistError) {
        logger.error("persist_evaluation_failed", {
          studentName: studentProfile.fullName,
          evaluationId: result.evaluationId,
          err: persistError instanceof Error ? persistError.message : String(persistError),
        });
      }
    });

    res.json(enriched);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Validation failed.",
        issues: error.issues,
      });
      return;
    }

    logger.error("calculate_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      message: "Failed to calculate recommendations.",
    });
  }
});

function parseAnalyticsFilters(req: express.Request) {
  return {
    from: typeof req.query.from === "string" ? req.query.from : undefined,
    to: typeof req.query.to === "string" ? req.query.to : undefined,
    bacStream:
      typeof req.query.bacStream === "string" ? (req.query.bacStream as BacStream) : undefined,
    specialtyCode:
      typeof req.query.specialtyCode === "string" ? req.query.specialtyCode : undefined,
  };
}

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

app.listen(port, host, () => {
  logger.info("server_started", {
    host,
    port,
    isDev,
    adminAuthRequired: isAdminAuthConfigured(),
    allowedOrigins,
    health: `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}/api/v1/health`,
  });
});
