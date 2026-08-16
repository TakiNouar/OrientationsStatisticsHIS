/**
 * Optional live mirror of each evaluation to Google Sheets.
 * No-op when GOOGLE_SHEETS_ID is unset. Never throws to the request path.
 */
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import { logger } from "../logger.js";
import type { CalculationResult, StudentProfile } from "../types.js";

const HEADER_ROW = [
  "Evaluation ID",
  "Submitted At",
  "Student Name",
  "Bac Stream",
  "Technical Option",
  "Overall Bac Mark",
  "Top Match — Specialty",
  "Top Match — Department",
  "Top Match — Score",
  "Top Match — Label",
  "All Matches",
] as const;

let sheetsClient: sheets_v4.Sheets | null = null;
let headerEnsured = false;

const isConfigured = (): boolean =>
  Boolean((process.env.GOOGLE_SHEETS_ID ?? "").trim());

const spreadsheetId = (): string => (process.env.GOOGLE_SHEETS_ID ?? "").trim();

const tabName = (): string => {
  const raw = (process.env.GOOGLE_SHEETS_TAB ?? "Sessions").trim();
  return raw || "Sessions";
};

async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  if (sheetsClient) return sheetsClient;
  if (!isConfigured()) return null;

  try {
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    const jsonInline = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").trim();
    const keyPath = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ?? "").trim();

    const authOptions: {
      scopes: string[];
      credentials?: Record<string, unknown>;
      keyFile?: string;
    } = { scopes };

    if (jsonInline) {
      authOptions.credentials = JSON.parse(jsonInline) as Record<string, unknown>;
    } else if (keyPath) {
      authOptions.keyFile = keyPath;
    } else {
      logger.warn("google_sheets_auth_missing", {
        message:
          "GOOGLE_SHEETS_ID is set but neither GOOGLE_SERVICE_ACCOUNT_JSON nor GOOGLE_SERVICE_ACCOUNT_KEY_PATH is configured.",
      });
      return null;
    }

    const auth = new google.auth.GoogleAuth(authOptions);
    // Auth client typing varies across googleapis versions.
    sheetsClient = google.sheets({ version: "v4", auth: auth as never });
    return sheetsClient;
  } catch (error) {
    logger.error("google_sheets_auth_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function ensureHeaderRow(sheets: sheets_v4.Sheets): Promise<void> {
  if (headerEnsured) return;
  const id = spreadsheetId();
  const tab = tabName();
  const range = `${tab}!A1:K1`;

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range,
  });
  const first = existing.data.values?.[0];
  const empty =
    !first || first.length === 0 || first.every((cell) => String(cell ?? "").trim() === "");

  if (empty) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [Array.from(HEADER_ROW)] },
    });
  }
  headerEnsured = true;
}

function buildRow(
  studentProfile: StudentProfile,
  result: CalculationResult,
): (string | number)[] {
  const top = result.matches[0];
  const allMatches = result.matches
    .map((m) => `${m.specialtyCode}:${Number(m.finalScore).toFixed(1)}`)
    .join(", ");

  return [
    result.evaluationId,
    result.timestamp,
    studentProfile.fullName,
    studentProfile.bacStream,
    studentProfile.technicalOption ?? "",
    studentProfile.academicPerformance.overallBacMark,
    top?.specialtyTitle ?? "",
    top?.department ?? "",
    top != null ? Number(top.finalScore) : "",
    top?.matchLabelText ?? "",
    allMatches,
  ];
}

/**
 * Append one evaluation row to the configured sheet.
 * Safe to call without await; never throws to callers.
 */
export async function syncEvaluationToSheet(
  studentProfile: StudentProfile,
  result: CalculationResult,
): Promise<void> {
  if (!isConfigured()) return;

  try {
    const sheets = await getSheetsClient();
    if (!sheets) return;

    await ensureHeaderRow(sheets);

    const tab = tabName();
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId(),
      range: `${tab}!A:K`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [buildRow(studentProfile, result)],
      },
    });

    logger.info("google_sheets_sync_ok", {
      evaluationId: result.evaluationId,
      spreadsheetId: spreadsheetId(),
      tab,
    });
  } catch (error) {
    logger.error("google_sheets_sync_failed", {
      evaluationId: result.evaluationId,
      err: error instanceof Error ? error.message : String(error),
    });
  }
}
