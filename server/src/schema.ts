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

const gradeSchema = z.number().min(0).max(20);

const TopRiasecEntrySchema = z.object({
  letter: RiasecLetterSchema,
  weight: z.number().min(1).max(100),
});

export const CalculateRecommendationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(250),
    bacStream: BacStreamSchema,
    overallBacMark: z.number().min(0).max(20),
    grades: z.record(SubjectCodeSchema, gradeSchema),
    topRiasec: z.tuple([TopRiasecEntrySchema, TopRiasecEntrySchema, TopRiasecEntrySchema]),
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

    const letters = value.topRiasec.map((entry) => entry.letter);
    if (new Set(letters).size !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["topRiasec"],
        message: "Top 3 RIASEC letters must be distinct.",
      });
    }
  });

export type CalculateRecommendationInput = z.infer<typeof CalculateRecommendationSchema>;
