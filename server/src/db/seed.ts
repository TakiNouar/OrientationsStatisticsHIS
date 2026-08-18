import fs from "node:fs";
import { db, seedPath, careerSeedPath } from "./connection.js";
import type { HisSpecialtyConfig, SeedSpecialty } from "../types.js";

const specialtyIdFromCode = (code: string): string =>
  `spec_${code.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

const normalizeSeed = (seed: SeedSpecialty): HisSpecialtyConfig => ({
  id: specialtyIdFromCode(seed.code),
  code: seed.code,
  title: seed.title,
  department: seed.department,
  description: seed.description,
  isTechnical: Boolean(seed.isTechnical),
  hollandCode: seed.hollandCode,
  subjectWeights: { weights: seed.weights },
  riasecBenchmark: {
    vector: {
      realistic: seed.riasecBenchmark.R,
      investigative: seed.riasecBenchmark.I,
      artistic: seed.riasecBenchmark.A,
      social: seed.riasecBenchmark.S,
      enterprising: seed.riasecBenchmark.E,
      conventional: seed.riasecBenchmark.C,
    },
  },
  isActive: true,
});

export const upsertSpecialties = (): void => {
  const raw = fs.readFileSync(seedPath, "utf8");
  const seeds = (JSON.parse(raw) as SeedSpecialty[]).map(normalizeSeed);

  const insert = db.prepare(`
    INSERT INTO his_specialties (
      id, code, title, department, description, is_technical, holland_code_json,
      subject_weights_json, stream_modifiers_json, riasec_benchmark_json, is_active
    ) VALUES (
      @id, @code, @title, @department, @description, @isTechnical, @hollandCodeJson,
      @subjectWeightsJson, @streamModifiersJson, @riasecBenchmarkJson, @isActive
    )
    ON CONFLICT(code) DO UPDATE SET
      title = excluded.title,
      department = excluded.department,
      description = excluded.description,
      is_technical = excluded.is_technical,
      holland_code_json = excluded.holland_code_json,
      subject_weights_json = excluded.subject_weights_json,
      stream_modifiers_json = excluded.stream_modifiers_json,
      riasec_benchmark_json = excluded.riasec_benchmark_json,
      is_active = excluded.is_active
  `);

  const run = db.transaction((rows: HisSpecialtyConfig[]) => {
    for (const s of rows) {
      insert.run({
        id: s.id,
        code: s.code,
        title: s.title,
        department: s.department,
        description: s.description,
        isTechnical: s.isTechnical ? 1 : 0,
        hollandCodeJson: JSON.stringify(s.hollandCode),
        subjectWeightsJson: JSON.stringify(s.subjectWeights),
        streamModifiersJson: JSON.stringify({}),
        riasecBenchmarkJson: JSON.stringify(s.riasecBenchmark),
        isActive: s.isActive ? 1 : 0,
      });
    }
  });
  run(seeds);
};

type CareerPathSeed = {
  id: string;
  specialtyCode: string;
  titleFr: string;
  titleEn: string;
  sectorFr: string;
  sectorEn: string;
  level: string;
  descriptionFr: string;
  descriptionEn: string;
  examplesFr: string[];
  examplesEn: string[];
};

export const upsertCareerPaths = (): void => {
  if (!fs.existsSync(careerSeedPath)) return;
  const seeds = JSON.parse(fs.readFileSync(careerSeedPath, "utf8")) as CareerPathSeed[];

  const insert = db.prepare(`
    INSERT INTO career_paths (
      id, specialty_code, title_fr, title_en, sector_fr, sector_en, level,
      description_fr, description_en, examples_fr_json, examples_en_json, is_active
    ) VALUES (
      @id, @specialtyCode, @titleFr, @titleEn, @sectorFr, @sectorEn, @level,
      @descriptionFr, @descriptionEn, @examplesFrJson, @examplesEnJson, 1
    )
    ON CONFLICT(id) DO UPDATE SET
      specialty_code = excluded.specialty_code,
      title_fr = excluded.title_fr,
      title_en = excluded.title_en,
      sector_fr = excluded.sector_fr,
      sector_en = excluded.sector_en,
      level = excluded.level,
      description_fr = excluded.description_fr,
      description_en = excluded.description_en,
      examples_fr_json = excluded.examples_fr_json,
      examples_en_json = excluded.examples_en_json,
      is_active = 1
  `);

  const run = db.transaction((rows: CareerPathSeed[]) => {
    for (const row of rows) {
      insert.run({
        id: row.id,
        specialtyCode: row.specialtyCode,
        titleFr: row.titleFr,
        titleEn: row.titleEn,
        sectorFr: row.sectorFr,
        sectorEn: row.sectorEn,
        level: row.level,
        descriptionFr: row.descriptionFr,
        descriptionEn: row.descriptionEn,
        examplesFrJson: JSON.stringify(row.examplesFr ?? []),
        examplesEnJson: JSON.stringify(row.examplesEn ?? []),
      });
    }
  });
  run(seeds);
};
