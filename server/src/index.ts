import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";
import {
  getActiveSpecialties,
  exportEvaluationsAsCsv,
  initDatabase,
  persistEvaluation,
} from "./db.js";
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

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "100kb" }));

const calculateLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
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

  try {
    const csv = exportEvaluationsAsCsv({ from, to, bacStream });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=evaluations.csv");
    res.send(csv);
  } catch (error) {
    logger.error("export_failed", {
      err: error instanceof Error ? error.message : String(error),
      from,
      to,
      bacStream,
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
    const result = calculateRecommendations(studentProfile, specialties);

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

    res.json(result);
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

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

app.listen(port, host, () => {
  logger.info("server_started", { host, port, allowedOrigins });
});
