import type {
  AnalyticsRecentResponse,
  AnalyticsSummary,
  CalculationResult,
  ConfigResponse,
  RecommendationInput,
  StudentProfileDetail,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
const REQUEST_TIMEOUT_MS = 10_000;

function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Server not responding (timeout). Is the API running on port 3001?",
      );
    }
    if (error instanceof TypeError) {
      throw new Error(
        "Cannot reach the API. Start the server (cd server && npm run dev) and keep Vite proxy on.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const attempt = async (): Promise<ConfigResponse> => {
    const response = await fetchWithTimeout(apiUrl("/api/v1/config"));
    if (!response.ok) {
      throw new Error(`Failed to load config (${response.status})`);
    }
    return response.json() as Promise<ConfigResponse>;
  };

  try {
    return await attempt();
  } catch (firstError) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await attempt();
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("Failed to load config from server.");
    }
  }
}

export async function calculateRecommendations(
  input: RecommendationInput,
): Promise<CalculationResult> {
  const response = await fetchWithTimeout(apiUrl("/api/v1/recommendations/calculate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `Calculation failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        message?: string;
        issues?: Array<{ path?: (string | number)[]; message?: string }>;
      };
      if (body.message) {
        message = body.message;
      }
      if (body.issues && body.issues.length > 0) {
        const details = body.issues
          .map((issue) => {
            const path = issue.path?.join(".") || "payload";
            return `${path}: ${issue.message ?? "invalid"}`;
          })
          .join(" | ");
        message = `${message} — ${details}`;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<CalculationResult>;
}

export type AnalyticsQuery = {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
  limit?: number;
};

function analyticsQueryString(params?: AnalyticsQuery): string {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.bacStream) q.set("bacStream", params.bacStream);
  if (params?.specialtyCode) q.set("specialtyCode", params.specialtyCode);
  if (params?.limit != null) q.set("limit", String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAnalyticsSummary(
  params?: AnalyticsQuery,
): Promise<AnalyticsSummary> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/summary${analyticsQueryString(params)}`),
  );
  if (!response.ok) {
    throw new Error(`Failed to load analytics summary (${response.status})`);
  }
  return response.json() as Promise<AnalyticsSummary>;
}

export async function fetchAnalyticsRecent(
  params?: AnalyticsQuery,
): Promise<AnalyticsRecentResponse> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/recent${analyticsQueryString(params)}`),
  );
  if (!response.ok) {
    throw new Error(`Failed to load recent evaluations (${response.status})`);
  }
  return response.json() as Promise<AnalyticsRecentResponse>;
}

export async function fetchStudentProfile(studentId: string): Promise<StudentProfileDetail> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/students/${encodeURIComponent(studentId)}`),
  );
  if (response.status === 404) {
    throw new Error("Student not found.");
  }
  if (!response.ok) {
    throw new Error(`Failed to load student profile (${response.status})`);
  }
  return response.json() as Promise<StudentProfileDetail>;
}

export function exportEvaluationsUrl(params?: {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
  anonymized?: boolean;
}): string {
  const q = new URLSearchParams({ format: "csv" });
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.bacStream) q.set("bacStream", params.bacStream);
  if (params?.specialtyCode) q.set("specialtyCode", params.specialtyCode);
  q.set("anonymized", params?.anonymized === true ? "1" : "0");
  return apiUrl(`/api/v1/export/evaluations?${q.toString()}`);
}
