import { z } from "zod";
import {
  BAC_STREAMS,
  RIASEC_LETTERS,
  STREAM_SUBJECT_MAP,
  SUBJECT_CODES,
  type BacStream,
} from "./types.js";

export const BacStreamSchema = z.enum(BAC_STREAMS);
export const SubjectCodeSchema = z.enum(SUBJECT_CODES);
export const RiasecLetterSchema = z.enum(RIASEC_LETTERS);

const gradeSchema = z.coerce.number().min(0).max(20);

const TopRiasecEntrySchema = z.object({
  letter: RiasecLetterSchema,
  weight: z.coerce.number().min(1).max(100),
});

export const CalculateRecommendationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(250),
    bacStream: BacStreamSchema,
    overallBacMark: z.coerce.number().min(0).max(20),
    // Partial map of subject → grade (only required stream subjects must be present).
    // Zod 4 z.record(enum, ...) can require every enum key; use string keys + refine instead.
    grades: z.record(z.string(), gradeSchema),
    topRiasec: z.tuple([TopRiasecEntrySchema, TopRiasecEntrySchema, TopRiasecEntrySchema]),
  })
  .superRefine((value, ctx) => {
    const requiredSubjects = STREAM_SUBJECT_MAP[value.bacStream as BacStream];
    const presentSubjects = new Set(Object.keys(value.grades));
    const allowedSubjects = new Set<string>(SUBJECT_CODES);

    for (const key of presentSubjects) {
      if (!allowedSubjects.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["grades", key],
          message: `Unknown subject code: ${key}.`,
        });
      }
    }

    for (const subject of requiredSubjects) {
      if (!presentSubjects.has(subject)) {
        ctx.addIssue({
          code: "custom",
          path: ["grades", subject],
          message: `Missing required subject grade for ${subject}.`,
        });
      }
    }

    const letters = value.topRiasec.map((entry) => entry.letter);
    if (new Set(letters).size !== 3) {
      ctx.addIssue({
        code: "custom",
        path: ["topRiasec"],
        message: "Top 3 RIASEC letters must be distinct.",
      });
    }
  });

export type CalculateRecommendationInput = z.infer<typeof CalculateRecommendationSchema>;
