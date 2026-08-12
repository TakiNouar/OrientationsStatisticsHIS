import { z } from "zod";
import { BAC_STREAMS, STREAM_SUBJECT_MAP, SUBJECT_CODES, type BacStream } from "./types.js";

export const BacStreamSchema = z.enum(BAC_STREAMS);
export const SubjectCodeSchema = z.enum(SUBJECT_CODES);

const gradeSchema = z.number().min(0).max(20);

export const CalculateRecommendationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(250),
    bacStream: BacStreamSchema,
    overallBacMark: z.number().min(0).max(20),
    grades: z.record(SubjectCodeSchema, gradeSchema),
    riasec: z.object({
      realistic: z.number().min(0).max(100),
      investigative: z.number().min(0).max(100),
      artistic: z.number().min(0).max(100),
      social: z.number().min(0).max(100),
      enterprising: z.number().min(0).max(100),
      conventional: z.number().min(0).max(100),
    }),
  })
  .superRefine((value, ctx) => {
    const requiredSubjects = STREAM_SUBJECT_MAP[value.bacStream as BacStream];
    const presentSubjects = new Set(Object.keys(value.grades));

    for (const subject of requiredSubjects) {
      if (!presentSubjects.has(subject)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["grades", subject],
          message: `Missing required subject grade for ${subject}.`,
        });
      }
    }
  });

export type CalculateRecommendationInput = z.infer<typeof CalculateRecommendationSchema>;
