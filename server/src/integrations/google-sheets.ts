/**
 * Live mirror of orientation sessions → Google Sheets.
 * Full-table resync from SQLite (never wipes the database).
 * No-op when GOOGLE_SHEETS_ID is unset. Never throws to the request path.
 */
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import { listAllSessionsForSheet } from "../db.js";
import type { SheetSessionRow } from "../db.js";
import { logger } from "../logger.js";
import type { CalculationResult, StudentProfile } from "../types.js";

const HEADER_ROW = [
  "Evaluation ID",
  "Submitted at",
  "Student name",
  "BAC stream",
  "Technical option",
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

const COL_COUNT = HEADER_ROW.length;

const COLUMN_WIDTHS: number[] = [
  280, 160, 160, 150, 130, 90, 140, 140, 90, 160, 140, 90, 160, 140, 90, 160,
];

const HEADER_BG = { red: 0.071, green: 0.078, blue: 0.11 };
const HEADER_FG = { red: 0.961, green: 0.949, blue: 0.918 };
const BODY_FG = { red: 0.071, green: 0.078, blue: 0.11 };
const ZEBRA_BG = { red: 0.937, green: 0.906, blue: 0.824 };
const BRASS_HL = { red: 0.851, green: 0.776, blue: 0.549 };

let sheetsClient: sheets_v4.Sheets | null = null;
let headerEnsured = false;
let styleApplied = false;
let cachedSheetId: number | null = null;
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
      logger.warn("google_sheets_auth_missing", {
        message:
          "GOOGLE_SHEETS_ID is set but neither GOOGLE_SERVICE_ACCOUNT_JSON nor GOOGLE_SERVICE_ACCOUNT_KEY_PATH is configured.",
      });
      return null;
    }

    const auth = new google.auth.GoogleAuth(authOptions);
    sheetsClient = google.sheets({ version: "v4", auth: auth as never });
    return sheetsClient;
  } catch (error) {
    logger.error("google_sheets_auth_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function resolveTabSheetId(sheets: sheets_v4.Sheets): Promise<number | null> {
  if (cachedSheetId != null) return cachedSheetId;
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
    fields: "sheets.properties",
  });
  const wanted = tabName();
  for (const s of meta.data.sheets ?? []) {
    const title = s.properties?.title ?? "";
    if (title === wanted) {
      const id = s.properties?.sheetId;
      if (typeof id === "number") {
        cachedSheetId = id;
        return id;
      }
    }
  }
  logger.error("google_sheets_tab_not_found", { tab: wanted });
  return null;
}

function matchSlot(
  matches: SheetSessionRow["matches"],
  index: number,
): [string, number | "", string] {
  const m = matches[index];
  if (!m) return ["\u2014", "", "\u2014"];
  return [m.code, m.score / 100, m.label];
}

function buildDataRow(session: SheetSessionRow): (string | number)[] {
  const [c1, s1, l1] = matchSlot(session.matches, 0);
  const [c2, s2, l2] = matchSlot(session.matches, 1);
  const [c3, s3, l3] = matchSlot(session.matches, 2);
  return [
    session.evaluationId,
    session.submittedAt,
    session.fullName,
    session.bacStream,
    session.technicalOption,
    session.overallMark,
    session.preferredSpecialtyCode || "\u2014",
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

async function ensureHeaderAndStyle(
  sheets: sheets_v4.Sheets,
  dataRowCount: number,
): Promise<void> {
  const id = spreadsheetId();
  const tab = tabName();

  if (!headerEnsured) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [Array.from(HEADER_ROW)] },
    });
    headerEnsured = true;
  }

  if (styleApplied) return;

  const sheetId = await resolveTabSheetId(sheets);
  if (sheetId == null) return;

  const bodyEnd = Math.max(2000, dataRowCount + 50);

  const requests: sheets_v4.Schema$Request[] = [
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: COL_COUNT,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: HEADER_BG,
            textFormat: {
              foregroundColor: HEADER_FG,
              bold: true,
              fontFamily: "Google Sans",
              fontSize: 11,
            },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
          },
        },
        fields:
          "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 36 },
        fields: "pixelSize",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: bodyEnd,
          startColumnIndex: 0,
          endColumnIndex: COL_COUNT,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              foregroundColor: BODY_FG,
              fontFamily: "Google Sans",
              fontSize: 10,
            },
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(textFormat,verticalAlignment)",
      },
    },
    ...[8, 11, 14].map(
      (col): sheets_v4.Schema$Request => ({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 1,
            endRowIndex: bodyEnd,
            startColumnIndex: col,
            endColumnIndex: col + 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: { type: "PERCENT", pattern: "0.0%" },
              textFormat: { foregroundColor: BODY_FG },
            },
          },
          fields: "userEnteredFormat(numberFormat,textFormat)",
        },
      }),
    ),
  ];

  for (let i = 0; i < COLUMN_WIDTHS.length; i++) {
    const width = COLUMN_WIDTHS[i] ?? 120;
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: i,
          endIndex: i + 1,
        },
        properties: { pixelSize: width },
        fields: "pixelSize",
      },
    });
  }

  requests.push({
    addBanding: {
      bandedRange: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: bodyEnd,
          startColumnIndex: 0,
          endColumnIndex: COL_COUNT,
        },
        rowProperties: {
          headerColor: HEADER_BG,
          firstBandColor: { red: 0.969, green: 0.953, blue: 0.91 },
          secondBandColor: ZEBRA_BG,
        },
      },
    },
  });

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests },
    });
    styleApplied = true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.toLowerCase().includes("band")) {
      const withoutBand = requests.filter((r) => !("addBanding" in r));
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: id,
          requestBody: { requests: withoutBand },
        });
        styleApplied = true;
        return;
      } catch (e2) {
        logger.error("google_sheets_style_failed", {
          err: e2 instanceof Error ? e2.message : String(e2),
        });
        return;
      }
    }
    logger.error("google_sheets_style_failed", { err: msg });
  }
}

async function applyPreferenceHighlights(sheets: sheets_v4.Sheets): Promise<void> {
  const sheetId = await resolveTabSheetId(sheets);
  if (sheetId == null) return;

  try {
    const sessions = listAllSessionsForSheet();
    const requests: sheets_v4.Schema$Request[] = [];
    sessions.forEach((s, i) => {
      const top = s.matches[0]?.code;
      if (!top || !s.preferredSpecialtyCode || s.preferredSpecialtyCode === "\u2014") return;
      if (s.preferredSpecialtyCode !== top) return;
      const rowIndex = i + 1;
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 6,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: BRASS_HL,
              textFormat: { bold: true, foregroundColor: BODY_FG },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      });
    });
    if (requests.length === 0) return;
    const chunk = 50;
    for (let i = 0; i < requests.length; i += chunk) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId(),
        requestBody: { requests: requests.slice(i, i + chunk) },
      });
    }
  } catch (error) {
    logger.warn("google_sheets_highlight_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Rebuild entire data region from SQLite. Header refreshed; DB never modified. */
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
    const rows = sessions.map(buildDataRow);
    const tab = tabName();

    try {
      await ensureHeaderAndStyle(sheets, rows.length);
    } catch (styleErr) {
      logger.warn("google_sheets_style_failed", {
        err: styleErr instanceof Error ? styleErr.message : String(styleErr),
      });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId(),
      range: `${tab}!A2:P`,
    });

    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${tab}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows },
      });
    }

    await applyPreferenceHighlights(sheets);

    logger.info("google_sheets_resync_ok", {
      rows: rows.length,
      spreadsheetId: spreadsheetId(),
      tab,
    });
  } catch (error) {
    logger.error("google_sheets_resync_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
  } finally {
    resyncInFlight = false;
  }
}

/** After persist \u2014 full mirror. */
export async function syncEvaluationToSheet(
  _studentProfile: StudentProfile,
  _result: CalculationResult,
): Promise<void> {
  await fullResyncToSheet();
}

/** After admin delete \u2014 rebuild from remaining DB rows. */
export async function removeStudentRowsFromSheet(_options: {
  evaluationIds: string[];
  fullName?: string | null;
}): Promise<void> {
  await fullResyncToSheet();
}

/** 5-minute self-heal when Sheets is configured. */
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
