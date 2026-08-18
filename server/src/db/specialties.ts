import { db } from "./connection.js";
import type { HisSpecialtyConfig } from "../types.js";

type SpecialtyRow = {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string;
  is_technical: number;
  holland_code_json: string;
  subject_weights_json: string;
  stream_modifiers_json: string;
  riasec_benchmark_json: string;
  is_active: number;
};

export const getActiveSpecialties = (): HisSpecialtyConfig[] => {
  const rows = db
    .prepare(
      `
      SELECT id, code, title, department, description, is_technical, holland_code_json,
             subject_weights_json, stream_modifiers_json, riasec_benchmark_json, is_active
      FROM his_specialties WHERE is_active = 1 ORDER BY department, title
    `,
    )
    .all() as SpecialtyRow[];

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    department: row.department,
    description: row.description,
    isTechnical: Boolean(row.is_technical),
    hollandCode: JSON.parse(row.holland_code_json || '["I","C","E"]') as HisSpecialtyConfig["hollandCode"],
    subjectWeights: JSON.parse(row.subject_weights_json) as HisSpecialtyConfig["subjectWeights"],
    riasecBenchmark: JSON.parse(row.riasec_benchmark_json) as HisSpecialtyConfig["riasecBenchmark"],
    isActive: Boolean(row.is_active),
  }));
};
