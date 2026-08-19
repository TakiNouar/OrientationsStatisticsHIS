/**
 * Live mirror of orientation sessions → Google Sheets.
 *
 * DATA ONLY for rows 2+:
 * - values.clear / values.update only — cell formatting is never reset by the API.
 * - Row 1 titles are written once per server process (first resync), values only,
 *   so existing header colors/fonts stay. Set GOOGLE_SHEETS_SEED_HEADER=always
 *   to rewrite titles on every resync, or =never to skip title writes entirely.
 *
 * Columns:
 *  A Profile # | B Evaluation ID | C Submitted at | D Student name | E BAC stream
 *  F Technical option | G–I RIASEC #1–#3 full names | J Overall mark | K Preferred specialty
 *  L–N match #1 | O–Q match #2 | R–T match #3
 */
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import { listAllSessionsForSheet } from "../db.js";
import type { SheetSessionRow } from "../db.js";
import { logger } from "../logger.js";
import type { CalculationResult, StudentProfile } from "../types.js";

const DATA_RANGE = "A2:Z";

/** Official header labels (row 1). Written as values only — does not change cell styles. */
const HEADER_ROW = [
  "Profile #",
  "Evaluation ID",
  "Submitted at",
  "Student name",
  "BAC stream",
  "Technical option",
  "RIASEC #1",
  "RIASEC #2",
  "RIASEC #3",
  "Overall mark",
  "Preferred specialty",
  "Specialty #1",
  "Score #1",
  "Match label #1",
  "Specialty #2",
  "Score #2",
  "Match label #2",
  "Specialty #3",
  "Score #3",
  "Match label #3",
] as const;

let sheetsClient: sheets_v4.Sheets | null = null;
let resyncTimer: ReturnType<typeof setInterval> | null = null;
let resyncInFlight = false;
/** One-time title write per process (unless SEED_HEADER=always|never). */
let headerTitlesWritten = false;

const isConfigured = (): boolean =>
  Boolean((process.env.GOOGLE_SHEETS_ID ?? "").trim());

const spreadsheetId = (): string => (process.env.GOOGLE_SHEETS_ID ?? "").trim();

const tabName = (): string => {
  const raw = (process.env.GOOGLE_SHEETS_TAB ?? "Sessions").trim();
  return raw || "Sessions";
};

/** never | once (default) | always */
const headerSeedMode = (): "never" | "once" | "always" => {
  const v = (process.env.GOOGLE_SHEETS_SEED_HEADER ?? "once").trim().toLowerCase();
  if (v === "never" || v === "0" || v === "false") return "never";
  if (v === "always" || v === "1" || v === "true") return "always";
  return "once";
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
      logger.warn("google_sheets_no_credentials", {
        hint: "Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_JSON",
      });
      return null;
    }

    const auth = new google.auth.GoogleAuth(authOptions);
    sheetsClient = google.sheets({ version: "v4", auth });
    return sheetsClient;
  } catch (error) {
    logger.error("google_sheets_auth_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Write header titles to row 1 as values only.
 * Does not call any formatting APIs — existing colors/fonts on those cells remain.
 */
async function writeHeaderTitles(sheets: sheets_v4.Sheets): Promise<void> {
  const tab = tabName();
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [Array.from(HEADER_ROW)] },
  });
  logger.info("google_sheets_header_titles_written", {
    tab,
    columns: HEADER_ROW.length,
    note: "values only; cell styles preserved",
  });
}

function matchSlot(
  matches: SheetSessionRow["matches"],
  index: number,
): [string, number | "", string] {
  const m = matches[index];
  if (!m) return ["—", "", "—"];
  return [m.code, m.score / 100, m.label];
}

function buildDataRow(session: SheetSessionRow, profileNumber: number): (string | number)[] {
  const [c1, s1, l1] = matchSlot(session.matches, 0);
  const [c2, s2, l2] = matchSlot(session.matches, 1);
  const [c3, s3, l3] = matchSlot(session.matches, 2);
  const names = session.riasecFullNames ?? ["—", "—", "—"];
  const [r1, r2, r3] = names;
  return [
    profileNumber,
    session.evaluationId,
    session.submittedAt,
    session.fullName,
    session.bacStream,
    session.technicalOption,
    r1,
    r2,
    r3,
    session.overallMark,
    session.preferredSpecialtyCode || "—",
    c1,
    s1,
    l1,
    c2,
    s2,
    l2,
    c3,
    s3,
    l3,
  ];
}

export async function fullResyncToSheet(): Promise<void> {
  if (!isConfigured()) return;
  if (resyncInFlight) {
    logger.info("google_sheets_resync_skipped", { reason: "in_flight" });
    return;
  }
  resyncInFlight = true;

  try {
    const sheets = await getSheetsClient();
    if (!sheets) return;

    const mode = headerSeedMode();
    if (mode === "always" || (mode === "once" && !headerTitlesWritten)) {
      await writeHeaderTitles(sheets);
      headerTitlesWritten = true;
    }

    const sessions = listAllSessionsForSheet();
    const rows = sessions.map((session, index) => buildDataRow(session, index + 1));
    const tab = tabName();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId(),
      range: `${tab}!${DATA_RANGE}`,
    });

    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${tab}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows },
      });
    }

    logger.info("google_sheets_resync_ok", {
      rows: rows.length,
      spreadsheetId: spreadsheetId(),
      tab,
      mode: "data_only",
      headerMode: mode,
    });
  } catch (error) {
    logger.error("google_sheets_resync_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
  } finally {
    resyncInFlight = false;
  }
}

export async function syncEvaluationToSheet(
  _studentProfile: StudentProfile,
  _result: CalculationResult,
): Promise<void> {
  await fullResyncToSheet();
}

export async function removeStudentRowsFromSheet(_options: {
  evaluationIds: string[];
  fullName?: string | null;
}): Promise<void> {
  await fullResyncToSheet();
}

export function startSheetsPeriodicResync(intervalMs = 5 * 60 * 1000): void {
  if (!isConfigured()) return;
  if (resyncTimer) return;
  resyncTimer = setInterval(() => {
    void fullResyncToSheet();
  }, intervalMs);
  if (typeof resyncTimer === "object" && resyncTimer !== null && "unref" in resyncTimer) {
    (resyncTimer as NodeJS.Timeout).unref?.();
  }
  logger.info("google_sheets_periodic_resync_started", { intervalMs });
}
