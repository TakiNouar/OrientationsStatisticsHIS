export type ExportFilters = {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
  /** When true, omit student_name. Default false (named export for counsellor LAN). */
  anonymized?: boolean;
};

export type AnalyticsFilters = {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
};

/** Shared WHERE builder for evaluation joins (me/s/hs aliases). */
export const buildEvaluationWhere = (
  filters: { from?: string; to?: string; bacStream?: string; specialtyCode?: string },
  aliasMe = "me",
  aliasS = "s",
  aliasHs = "hs",
): { where: string; params: Record<string, string> } => {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.from) {
    clauses.push(`${aliasMe}.evaluated_at >= @from`);
    params.from = filters.from;
  }
  if (filters.to) {
    clauses.push(`${aliasMe}.evaluated_at <= @to`);
    params.to = filters.to;
  }
  if (filters.bacStream) {
    clauses.push(`${aliasS}.bac_stream = @bacStream`);
    params.bacStream = filters.bacStream;
  }
  if (filters.specialtyCode) {
    clauses.push(`${aliasHs}.code = @specialtyCode`);
    params.specialtyCode = filters.specialtyCode;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
};
