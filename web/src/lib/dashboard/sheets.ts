// Ported from js/sheets.js + js/helpers.js — reads the real, live Everloft Google Sheet
// (public "Anyone with the link: Viewer") via the gviz/tq JSON endpoint. Server-side only
// (avoids the CORS/sign-in issues the original client-side fetch had to work around).

const PINNACLE_SPREADSHEET_ID = "1Q_fEZLHCENn-her2QOSkniZqkP-f6DBe";
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_EVERLOFT_SPREADSHEET_ID || PINNACLE_SPREADSHEET_ID;
const MAX_SHEET_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB limit

export const SHEET_NAMES = [
  "Pinnacle Income",
  "Pinnacle Expenses",
  "Bookings",
  "Assets",
  "Revenue",
  "Expenses",
  "Maintenance",
  "Payouts",
  "Admin_Signups",
  "Notes",
  "New_Assets",
] as const;

export type SheetName = (typeof SHEET_NAMES)[number] | string;
export type SheetRow = Record<string, string | number | boolean | null>;

function buildUrl(sheetName: string, sheetId = SPREADSHEET_ID) {
  return (
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}` +
    `/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
  );
}

function decodeSheetResponse(text: string): { table?: { cols: { label: string; id: string }[]; rows: { c: ({ v: unknown } | null)[] }[] } } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Invalid payload structure.");
  return JSON.parse(text.slice(start, end + 1));
}

function buildRow(cols: { label: string; id: string }[], row: { c: ({ v: unknown } | null)[] }): SheetRow {
  const result: SheetRow = {};
  cols.forEach((col, index) => {
    const key = (col.label && col.label.trim()) || col.id || `column_${index}`;
    const cell = row.c?.[index];
    result[key] = (cell?.v as string | number | boolean | null) ?? "";
  });
  return result;
}

function parseSheetData(payloadText: string): SheetRow[] {
  const parsed = decodeSheetResponse(payloadText);
  if (!parsed.table) return [];
  return parsed.table.rows.map((row) => buildRow(parsed.table!.cols, row));
}

/**
 * Hardened Google Sheet Fetcher
 * Includes 10s AbortController timeout, 5MB streaming size limit, status checks, and error sanitization.
 */
export async function fetchSheetData(sheetName: SheetName, targetSheetId?: string): Promise<SheetRow[]> {
  const targetId = targetSheetId || SPREADSHEET_ID;
  if (!targetId) {
    throw new Error("Spreadsheet ID is missing.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(buildUrl(sheetName, targetId), {
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Google Sheet request timed out after 10 seconds.");
    }
    throw new Error("Network error while contacting Google Sheets.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Sheet request failed: HTTP ${response.status}`);
  }

  // Check Content-Length header if present
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_SHEET_RESPONSE_BYTES) {
    throw new Error("Google Sheet response size exceeded maximum allowed limit of 5MB.");
  }

  // Enforce streaming body size limit before retaining full payload in memory
  let text = "";
  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > MAX_SHEET_RESPONSE_BYTES) {
            await reader.cancel();
            throw new Error("Google Sheet response size exceeded maximum allowed limit of 5MB.");
          }
          chunks.push(value);
        }
      }
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      text = new TextDecoder("utf-8").decode(combined);
    } catch (streamErr) {
      if (streamErr instanceof Error && streamErr.message.includes("5MB")) {
        throw streamErr;
      }
      // Fallback read if stream reader interrupted
      text = await response.text();
    }
  } else {
    text = await response.text();
  }

  if (Buffer.byteLength(text, "utf-8") > MAX_SHEET_RESPONSE_BYTES) {
    throw new Error("Google Sheet response size exceeded maximum allowed limit of 5MB.");
  }

  if (/"status"\s*:\s*"error"/i.test(text)) {
    const match = text.match(/"message"\s*:\s*"([^"]+)"/i);
    throw new Error(match?.[1] || "Google Sheets query returned an error");
  }

  try {
    return parseSheetData(text);
  } catch {
    const body = text.toLowerCase();
    if (body.includes("signin") || body.includes("accounts.google.com")) {
      throw new Error('Google Sheet requires sign-in. Share it to "Anyone with the link" (Viewer).');
    }
    // Return sanitized error without exposing raw sheet contents
    throw new Error("Failed to parse Google Sheet data payload structure.");
  }
}

export function getField(row: SheetRow, keys: string[], fallback: string = ""): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return fallback;
}

export function formatInr(value: number): string {
  if (Number.isNaN(value)) return "INR 0";
  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatSheetDate(value: unknown): string {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value ?? "-") || "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function toNumber(value: unknown): number {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}
