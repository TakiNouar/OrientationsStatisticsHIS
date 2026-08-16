import { db } from "./connection.js";

export type CareerPathRecord = {
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

export const getCareerPathsBySpecialty = (): Record<string, CareerPathRecord[]> => {
  const rows = db
    .prepare(
      `SELECT id, specialty_code, title_fr, title_en, sector_fr, sector_en, level,
              description_fr, description_en, examples_fr_json, examples_en_json
       FROM career_paths WHERE is_active = 1
       ORDER BY specialty_code, level, title_fr`,
    )
    .all() as Array<{
    id: string;
    specialty_code: string;
    title_fr: string;
    title_en: string;
    sector_fr: string;
    sector_en: string;
    level: string;
    description_fr: string;
    description_en: string;
    examples_fr_json: string;
    examples_en_json: string;
  }>;

  const map: Record<string, CareerPathRecord[]> = {};
  for (const row of rows) {
    const item: CareerPathRecord = {
      id: row.id,
      specialtyCode: row.specialty_code,
      titleFr: row.title_fr,
      titleEn: row.title_en,
      sectorFr: row.sector_fr,
      sectorEn: row.sector_en,
      level: row.level,
      descriptionFr: row.description_fr,
      descriptionEn: row.description_en,
      examplesFr: JSON.parse(row.examples_fr_json || "[]") as string[],
      examplesEn: JSON.parse(row.examples_en_json || "[]") as string[],
    };
    const list = map[item.specialtyCode] ?? [];
    list.push(item);
    map[item.specialtyCode] = list;
  }
  return map;
};
