import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { getActiveSpecialties, exportEvaluationsAsCsv, initDatabase, persistEvaluation } from "./db.js";
import { calculateRecommendations } from "./engine.js";
import { CalculateRecommendationSchema } from "./schema.js";
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
  type StudentProfile,
  type TopRiasecProfile,
} from "./types.js";

initDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

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
    technicalMathOptions: TECHNICAL_MATH_OPTIONS,
    technicalMathOptionLabels: TECHNICAL_MATH_OPTION_LABELS,
    riasecLetters: RIASEC_LETTERS,
    riasecLabels: RIASEC_LABELS,
    formulaWeights: { academic: 0.4, riasec: 0.4, technical: 0.2 },
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
  if (req.query.format !== "csv") {
    res.status(400).json({
      message: "Only format=csv is currently supported.",
    });
    return;
  }

  const csv = exportEvaluationsAsCsv();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=evaluations.csv");
  res.send(csv);
});

app.post("/api/v1/recommendations/calculate", (req, res) => {
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
      persistEvaluation(studentProfile, result);
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

    console.error("Failed to calculate recommendations", error);
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

app.listen(port, () => {
  console.log(`HIS-SRE backend running on http://localhost:${port}`);
});
