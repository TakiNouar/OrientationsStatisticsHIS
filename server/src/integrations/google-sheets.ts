/**
 * Live mirror of orientation sessions → Google Sheets.
 *
 * DATA ONLY:
 * - Never writes or clears row 1 (header stays as the user set it).
 * - Never applies colors, fonts, banding, or column widths.
 * - values.update / values.clear only change cell values — existing cell
 *   formatting is left intact by the Sheets API.
 *
 * Expected columns (row 1 is yours):
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

let sheetsClient: sheets_v4.Sheets | null = null;
let resyncTimer: ReturnType<typeof setInterval> | null = null;
let resyncInFlight = false;

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

/** ISO / SQLite timestamp → plain `YYYY-MM-DD HH:mm` (no ms, no Z). */
function formatSheetDateTime(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return s.replace("T", " ").replace(/\.\d+Z?$/, "").replace(/Z$/, "").slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day} ${h}:${min}`;
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
    formatSheetDateTime(session.submittedAt),
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
