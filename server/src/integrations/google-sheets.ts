/**
 * Optional live mirror of each evaluation to Google Sheets.
 * No-op when GOOGLE_SHEETS_ID is unset. Never throws to the request path.
 * Applies a readable table style (header, freeze, widths, zebra) once per process.
 */
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import { logger } from "../logger.js";
import type { CalculationResult, StudentProfile } from "../types.js";

/** Human-friendly headers (row 1). */
const HEADER_ROW = [
  "Evaluation ID",
  "Submitted at",
  "Student name",
  "BAC stream",
  "Technical option",
  "Overall mark",
  "Top specialty",
  "Department",
  "Top score",
  "Match label",
  "All matches",
] as const;

/** Approximate pixel widths for columns A–K */
const COLUMN_WIDTHS_PX = [
  280, // Evaluation ID
  160, // Submitted at
  180, // Student name
  160, // BAC stream
  140, // Technical option
  110, // Overall mark
  220, // Top specialty
  160, // Department
  100, // Top score
  200, // Match label
  320, // All matches
];

const HEADER_BG = { red: 0.12, green: 0.25, blue: 0.45 }; // deep navy
const HEADER_FG = { red: 1, green: 1, blue: 1 };
const ZEBRA_BG = { red: 0.93, green: 0.95, blue: 0.98 }; // light blue-gray
const BORDER = {
  style: "SOLID" as const,
  width: 1,
  color: { red: 0.75, green: 0.8, blue: 0.85 },
};

let sheetsClient: sheets_v4.Sheets | null = null;
let headerEnsured = false;
let styleApplied = false;
let cachedSheetId: number | null = null;

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

/** Header row + freeze + column widths + header look + zebra banded range. */
async function ensureHeaderAndStyle(sheets: sheets_v4.Sheets): Promise<void> {
  const id = spreadsheetId();
  const tab = tabName();
  const range = `${tab}!A1:K1`;

  if (!headerEnsured) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range,
    });
    const first = existing.data.values?.[0];
    const empty =
      !first ||
      first.length === 0 ||
      first.every((cell) => String(cell ?? "").trim() === "");

    // Always refresh header labels so older sheets get the cleaner titles.
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [Array.from(HEADER_ROW)] },
    });
    if (empty) {
      // first write only
    }
    headerEnsured = true;
  }

  if (styleApplied) return;

  const sheetId = await resolveTabSheetId(sheets);
  if (sheetId == null) return;

  const requests: sheets_v4.Schema$Request[] = [
    // Freeze header
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
    // Header cell style
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 11,
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
    // Header row height
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: 0,
          endIndex: 1,
        },
        properties: { pixelSize: 36 },
        fields: "pixelSize",
      },
    },
    // Body text defaults for a large band (grows as rows are added)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2000,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              fontFamily: "Google Sans",
              fontSize: 10,
            },
            verticalAlignment: "MIDDLE",
            wrapStrategy: "CLIP",
          },
        },
        fields: "userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)",
      },
    },
    // Score column (I) — center + number format
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2000,
          startColumnIndex: 8,
          endColumnIndex: 9,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            numberFormat: { type: "NUMBER", pattern: "0.0" },
          },
        },
        fields: "userEnteredFormat(horizontalAlignment,numberFormat)",
      },
    },
    // Overall mark (F) — center
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2000,
          startColumnIndex: 5,
          endColumnIndex: 6,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            numberFormat: { type: "NUMBER", pattern: "0.00" },
          },
        },
        fields: "userEnteredFormat(horizontalAlignment,numberFormat)",
      },
    },
    // Thin borders on used-looking range
    {
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 2000,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        top: BORDER,
        bottom: BORDER,
        left: BORDER,
        right: BORDER,
        innerHorizontal: BORDER,
        innerVertical: BORDER,
      },
    },
    // Alternating row colors (banded rows) — rows 2+ even indices
    {
      addBanding: {
        bandedRange: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 2000,
            startColumnIndex: 0,
            endColumnIndex: 11,
          },
          rowProperties: {
            headerColor: HEADER_BG,
            firstBandColor: { red: 1, green: 1, blue: 1 },
            secondBandColor: ZEBRA_BG,
          },
        },
      },
    },
  ];

  // Column widths
  for (let i = 0; i < COLUMN_WIDTHS_PX.length; i++) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: i,
          endIndex: i + 1,
        },
        properties: { pixelSize: COLUMN_WIDTHS_PX[i] ?? 120 },
        fields: "pixelSize",
      },
    });
  }

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests },
    });
    styleApplied = true;
    logger.info("google_sheets_style_ok", { tab });
  } catch (error) {
    // Banding may fail if a band already exists — still mark applied for other styles
    const msg = error instanceof Error ? error.message : String(error);
    if (/band/i.test(msg)) {
      // Retry without addBanding
      const withoutBand = requests.filter((r) => !r.addBanding);
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: id,
          requestBody: { requests: withoutBand },
        });
        styleApplied = true;
        logger.info("google_sheets_style_ok", { tab, banding: "skipped" });
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

function buildRow(
  studentProfile: StudentProfile,
  result: CalculationResult,
): (string | number)[] {
  const top = result.matches[0];
  const allMatches = result.matches
    .map((m) => `${m.specialtyCode}: ${Number(m.finalScore).toFixed(1)}`)
    .join(" · ");

  return [
    result.evaluationId,
    result.timestamp,
    studentProfile.fullName,
    studentProfile.bacStream.replaceAll("_", " "),
    studentProfile.technicalOption?.replaceAll("_", " ") ?? "—",
    studentProfile.academicPerformance.overallBacMark,
    top?.specialtyTitle ?? "",
    top?.department ?? "",
    top != null ? Number(top.finalScore) : "",
    top?.matchLabelText ?? "",
    allMatches,
  ];
}

/** Append one evaluation row. Safe without await; never throws to callers. */
export async function syncEvaluationToSheet(
  studentProfile: StudentProfile,
  result: CalculationResult,
): Promise<void> {
  if (!isConfigured()) return;

  try {
    const sheets = await getSheetsClient();
    if (!sheets) return;

    await ensureHeaderAndStyle(sheets);

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

/**
 * Delete sheet data rows matching evaluation IDs (column A).
 * If no IDs are provided, falls back to exact Student Name (column C).
 */
export async function removeStudentRowsFromSheet(options: {
  evaluationIds: string[];
  fullName?: string | null;
}): Promise<void> {
  if (!isConfigured()) return;

  const idSet = new Set(
    options.evaluationIds.map((x) => x.trim()).filter(Boolean),
  );
  const name = (options.fullName ?? "").trim();
  if (idSet.size === 0 && !name) return;

  try {
    const sheets = await getSheetsClient();
    if (!sheets) return;

    const tab = tabName();
    const sheetId = await resolveTabSheetId(sheets);
    if (sheetId == null) return;

    const all = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${tab}!A:C`,
    });
    const values = all.data.values ?? [];
    if (values.length <= 1) return;

    const toDelete: number[] = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i] ?? [];
      const evalId = String(row[0] ?? "").trim();
      const studentName = String(row[2] ?? "").trim();
      if (idSet.size > 0) {
        if (idSet.has(evalId)) toDelete.push(i);
      } else if (name && studentName === name) {
        toDelete.push(i);
      }
    }

    if (toDelete.length === 0) {
      logger.info("google_sheets_delete_noop", {
        evaluationIds: [...idSet],
        fullName: name || undefined,
      });
      return;
    }

    toDelete.sort((a, b) => b - a);
    const requests = toDelete.map((rowIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS" as const,
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId(),
      requestBody: { requests },
    });

    logger.info("google_sheets_delete_ok", {
      removed: toDelete.length,
      evaluationIds: [...idSet],
      fullName: name || undefined,
    });
  } catch (error) {
    logger.error("google_sheets_delete_failed", {
      evaluationIds: options.evaluationIds,
      err: error instanceof Error ? error.message : String(error),
    });
  }
}
