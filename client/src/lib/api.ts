import type { CalculationResult, ConfigResponse, RecommendationInput } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

export async function fetchConfig(): Promise<ConfigResponse> {
  const response = await fetch(`${API_BASE}/api/v1/config`);
  if (!response.ok) {
    throw new Error(`Failed to load config (${response.status})`);
  }
  return response.json() as Promise<ConfigResponse>;
}

export async function calculateRecommendations(
  input: RecommendationInput,
): Promise<CalculationResult> {
  const response = await fetch(`${API_BASE}/api/v1/recommendations/calculate`, {
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
