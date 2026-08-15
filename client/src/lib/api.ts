import type { CalculationResult, ConfigResponse, RecommendationInput } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const REQUEST_TIMEOUT_MS = 10_000;

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
      throw new Error("Server not responding (timeout). Check that the API is running.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const attempt = async (): Promise<ConfigResponse> => {
    const response = await fetchWithTimeout(`${API_BASE}/api/v1/config`);
    if (!response.ok) {
      throw new Error(`Failed to load config (${response.status})`);
    }
    return response.json() as Promise<ConfigResponse>;
  };

  try {
    return await attempt();
  } catch (firstError) {
    // One silent retry with short backoff before surfacing to the wizard.
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
  const response = await fetchWithTimeout(`${API_BASE}/api/v1/recommendations/calculate`, {
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
