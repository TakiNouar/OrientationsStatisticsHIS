import { z } from "zod";
import {
  BAC_STREAMS,
  RIASEC_LETTERS,
  STREAM_SUBJECT_MAP,
  SUBJECT_CODES,
  TECHNICAL_MATH_OPTIONS,
  type BacStream,
} from "./types.js";

export const BacStreamSchema = z.enum(BAC_STREAMS);
export const SubjectCodeSchema = z.enum(SUBJECT_CODES);
export const RiasecLetterSchema = z.enum(RIASEC_LETTERS);
export const TechnicalMathOptionSchema = z.enum(TECHNICAL_MATH_OPTIONS);

const gradeSchema = z.coerce.number().min(0).max(20);

const TopRiasecEntrySchema = z.object({
  letter: RiasecLetterSchema,
  weight: z.coerce.number().min(1).max(100),
});

export const CalculateRecommendationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(250),
    bacStream: BacStreamSchema,
    technicalOption: TechnicalMathOptionSchema.optional(),
    overallBacMark: z.coerce.number().min(0).max(20),
    grades: z.record(z.string(), gradeSchema),
    topRiasec: z.tuple([TopRiasecEntrySchema, TopRiasecEntrySchema, TopRiasecEntrySchema]),
  })
  .superRefine((value, ctx) => {
    const stream = value.bacStream as BacStream;
    const requiredSubjects = STREAM_SUBJECT_MAP[stream];
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

    if (stream === "TECHNICAL_MATHEMATICS" && !value.technicalOption) {
      ctx.addIssue({
        code: "custom",
        path: ["technicalOption"],
        message: "Technical Mathematics requires a génie option.",
      });
    }

    if (stream !== "TECHNICAL_MATHEMATICS" && value.technicalOption) {
      ctx.addIssue({
        code: "custom",
        path: ["technicalOption"],
        message: "technicalOption is only allowed for Technical Mathematics.",
      });
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
