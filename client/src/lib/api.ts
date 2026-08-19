import type { CalculationResult, ConfigResponse, RecommendationInput } from "../types";
import type {
  AnalyticsDashboard,
  AnalyticsRecentResponse,
  AnalyticsSummary,
  StudentProfileDetail,
} from "../types";

/**
 * Dev stability: default to same-origin `/api` so Vite proxy handles the backend
 * (no CORS). Set VITE_API_BASE only when calling the API directly (e.g. LAN IP).
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
const REQUEST_TIMEOUT_MS = 10_000;

const ADMIN_TOKEN_KEY = "his-sre-admin-token";

export function getStoredAdminToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredAdminToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function adminHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return token ? { "X-Admin-Token": token } : {};
}

function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

function analyticsQueryString(params?: {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
  limit?: number;
}): string {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.bacStream) q.set("bacStream", params.bacStream);
  if (params?.specialtyCode) q.set("specialtyCode", params.specialtyCode);
  if (params?.limit != null) q.set("limit", String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
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
  } catch (first) {
    try {
      await new Promise((r) => setTimeout(r, 400));
      return await attempt();
    } catch {
      throw first instanceof Error
        ? first
        : new Error("Failed to load config from server.");
    }
  }
}

export async function calculateRecommendations(
  input: RecommendationInput,
): Promise<CalculationResult> {
  const response = await fetchWithTimeout(apiUrl("/api/v1/recommendations"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = `Calculation failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return response.json() as Promise<CalculationResult>;
}

export async function fetchAnalyticsSummary(params?: {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
}): Promise<AnalyticsSummary> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/summary${analyticsQueryString(params)}`),
  );
  if (!response.ok) throw new Error(`Failed to load analytics summary (${response.status})`);
  return response.json() as Promise<AnalyticsSummary>;
}

export async function fetchAnalyticsDashboard(params?: {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
}): Promise<AnalyticsDashboard> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/dashboard${analyticsQueryString(params)}`),
  );
  if (!response.ok) throw new Error(`Failed to load analytics dashboard (${response.status})`);
  return response.json() as Promise<AnalyticsDashboard>;
}

export async function fetchAnalyticsRecent(params?: {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
  limit?: number;
}): Promise<AnalyticsRecentResponse> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/recent${analyticsQueryString(params)}`),
  );
  if (!response.ok) throw new Error(`Failed to load recent sessions (${response.status})`);
  const data = (await response.json()) as AnalyticsRecentResponse & {
    rows?: AnalyticsRecentResponse["sessions"];
  };
  return {
    sessions: data.sessions ?? data.rows ?? [],
  };
}

export async function fetchStudentProfile(studentId: string): Promise<StudentProfileDetail> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/students/${encodeURIComponent(studentId)}`),
  );
  if (response.status === 404) throw new Error("Student not found.");
  if (!response.ok) throw new Error(`Failed to load student profile (${response.status})`);
  return response.json() as Promise<StudentProfileDetail>;
}

/** Permanently delete student + cascaded grades / RIASEC / evaluations. */
export async function deleteStudentProfile(studentId: string): Promise<void> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/v1/analytics/students/${encodeURIComponent(studentId)}`),
    {
      method: "DELETE",
      headers: { ...adminHeaders() },
    },
  );
  if (response.status === 401 || response.status === 403) {
    throw new Error("Admin token rejected.");
  }
  if (response.status === 404) throw new Error("Student not found.");
  if (!response.ok) throw new Error(`Failed to delete student (${response.status})`);
}

export function exportEvaluationsUrl(params?: {
  from?: string;
  to?: string;
  bacStream?: string;
  specialtyCode?: string;
}): string {
  return apiUrl(`/api/v1/export/evaluations.csv${analyticsQueryString(params)}`);
}
