import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { getActiveSpecialties, exportEvaluationsAsCsv, initDatabase, persistEvaluation } from "./db.js";
import { calculateRecommendations } from "./engine.js";
import { CalculateRecommendationSchema } from "./schema.js";
import { STREAM_SUBJECT_MAP, SUBJECT_CODES, BAC_STREAMS, type StudentProfile } from "./types.js";

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
    specialties: getActiveSpecialties().map((specialty) => ({
      id: specialty.id,
      code: specialty.code,
      title: specialty.title,
      department: specialty.department,
      description: specialty.description,
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
      academicPerformance: {
        overallBacMark: input.overallBacMark,
        grades: input.grades,
      },
      psychometricProfile: input.riasec,
    };

    const specialties = getActiveSpecialties();
    const result = calculateRecommendations(studentProfile, specialties);

    // Persistence happens after computation to keep request latency low.
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
