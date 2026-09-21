'use server';

import { revalidatePath } from 'next/cache';
import { getDashboardSession } from '@/lib/dashboard/session';
import { fetchSheetData } from '@/lib/dashboard/sheets';
import { parseGoogleSheetCsv } from '../utils/csv-parser';
import { importBookingsAction } from './import.actions';

export type TabSyncResult = {
  propertyId: string;
  propertyName: string;
  tabName: string;
  tabType: 'income' | 'expense';
  success: boolean;
  count?: number;
  message: string;
  timestamp?: string;
};

const MAX_SHEET_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB max response size

/**
 * Extracts spreadsheet ID from full Google Drive share link or ID string
 */
export async function extractSpreadsheetId(input: string): Promise<string | null> {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();
  
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Tests live connection to Google Sheet URL/ID and diagnoses permission/network issues
 */
export async function testGoogleSheetConnectionAction(urlOrId: string) {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings') && session.role !== 'super_admin' && session.role !== 'finance_admin' && session.role !== 'operations_manager') {
    throw new Error('Forbidden: Insufficient permissions (manage_bookings required).');
  }

  const spreadsheetId = await extractSpreadsheetId(urlOrId);
  if (!spreadsheetId) {
    return {
      success: false,
      spreadsheetId: null,
      message: 'Invalid Google Sheet URL format. Please paste a valid Google Drive share link.',
      diagnostic: 'URL must contain "/spreadsheets/d/YOUR_SPREADSHEET_ID/".',
    };
  }

  try {
    const testUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(testUrl, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      return {
        success: false,
        spreadsheetId,
        message: `HTTP Error ${res.status}: Unable to access Google Drive spreadsheet.`,
        diagnostic: 'Check internet connectivity or spreadsheet URL.',
      };
    }

    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_SHEET_RESPONSE_BYTES) {
      return {
        success: false,
        spreadsheetId,
        message: 'Google Sheet payload exceeds maximum allowed size (5 MB).',
        diagnostic: 'Spreadsheet size limit exceeded.',
      };
    }

    const text = await res.text();
    if (text.length > MAX_SHEET_RESPONSE_BYTES) {
      return {
        success: false,
        spreadsheetId,
        message: 'Google Sheet payload exceeds maximum allowed size (5 MB).',
        diagnostic: 'Spreadsheet size limit exceeded.',
      };
    }

    if (text.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('signin')) {
      return {
        success: false,
        spreadsheetId,
        requiresPermission: true,
        message: 'Google Sheet access is restricted (Sign-in required).',
        diagnostic: 'Fix: Open your Google Sheet ➔ Click Share (top right) ➔ Change General Access to "Anyone with the link can view".',
      };
    }

    if (!text.includes('/*O_o*/') && !text.includes('google.visualization.Query.setResponse')) {
      return {
        success: false,
        spreadsheetId,
        message: 'Sheet payload error.',
        diagnostic: 'Google Sheets returned non-JSON data. Ensure the link points to a valid Google Spreadsheet.',
      };
    }

    return {
      success: true,
      spreadsheetId,
      message: 'Successfully connected to Google Sheet in Google Drive!',
      diagnostic: 'Live reader is ready.',
    };
  } catch (err) {
    return {
      success: false,
      spreadsheetId,
      message: 'Network failure or timeout while connecting to Google Drive.',
      diagnostic: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Granular sync action for an individual property tab
 */
export async function syncSinglePropertyTabAction({
  spreadsheetUrlOrId,
  propertyId,
  propertyName,
  tabName,
  tabType,
}: {
  spreadsheetUrlOrId: string;
  propertyId: string;
  propertyName: string;
  tabName: string;
  tabType: 'income' | 'expense';
}): Promise<TabSyncResult> {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Authorization Check
  const session = await getDashboardSession();
  if (!session) {
    return {
      propertyId,
      propertyName,
      tabName: tabName || '(Not specified)',
      tabType,
      success: false,
      message: 'Unauthorized: Authentication required.',
      timestamp,
    };
  }
  if (!session.permissions.includes('manage_bookings') && session.role !== 'super_admin' && session.role !== 'finance_admin' && session.role !== 'operations_manager') {
    return {
      propertyId,
      propertyName,
      tabName: tabName || '(Not specified)',
      tabType,
      success: false,
      message: 'Forbidden: Insufficient permissions (manage_bookings required).',
      timestamp,
    };
  }

  // 2. Environment Guard Check
  const { isBackgroundJobAllowed } = await import('@/lib/env-guard');
  if (!isBackgroundJobAllowed(`Google Sheet Sync (${tabName})`)) {
    return {
      propertyId,
      propertyName,
      tabName,
      tabType,
      success: false,
      message: 'Sync skipped: Execution in Vercel Preview or disabled environment.',
      timestamp,
    };
  }

  const spreadsheetId = await extractSpreadsheetId(spreadsheetUrlOrId);

  if (!spreadsheetId) {
    return {
      propertyId,
      propertyName,
      tabName,
      tabType,
      success: false,
      message: 'Invalid Google Sheet URL.',
      timestamp,
    };
  }

  if (!tabName || !tabName.trim()) {
    return {
      propertyId,
      propertyName,
      tabName: tabName || '(Not specified)',
      tabType,
      success: false,
      message: `No ${tabType} tab name specified. Enter tab name to sync.`,
      timestamp,
    };
  }

  try {
    const rawRows = await fetchSheetData(tabName.trim(), spreadsheetId);
    if (!rawRows || rawRows.length === 0) {
      return {
        propertyId,
        propertyName,
        tabName,
        tabType,
        success: false,
        message: `Tab '${tabName}' is empty or contains no readable data.`,
        timestamp,
      };
    }

    const keys = Object.keys(rawRows[0] || {});
    const csvLines = [
      keys.join(','),
      ...rawRows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
    ];
    const csvContent = csvLines.join('\n');

    if (csvContent.length > MAX_SHEET_RESPONSE_BYTES) {
      return {
        propertyId,
        propertyName,
        tabName,
        tabType,
        success: false,
        message: `Tab '${tabName}' payload exceeds maximum size limit (5 MB).`,
        timestamp,
      };
    }

    const parsedRows = parseGoogleSheetCsv(csvContent);
    const validRows = parsedRows.filter((r) => r.isValid);

    if (validRows.length === 0) {
      return {
        propertyId,
        propertyName,
        tabName,
        tabType,
        success: false,
        message: `Tab '${tabName}' accessible, but no valid rows passed schema validation.`,
        timestamp,
      };
    }

    const res = await importBookingsAction(validRows, propertyId);
    revalidatePath('/dashboard/bookings', 'layout');

    return {
      propertyId,
      propertyName,
      tabName,
      tabType,
      success: true,
      count: res.count,
      message: `✓ Synced ${res.count} ${tabType} row(s) from tab '${tabName}' into database.`,
      timestamp,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let errorMsg = `Sync failed for tab '${tabName}': ${msg}`;

    if (msg.includes('sign-in') || msg.includes('Anyone with the link')) {
      errorMsg = `Permission Restricted: Share Google Sheet to "Anyone with the link can view".`;
    } else if (msg.includes('Sheet request failed') || msg.includes('not found') || msg.includes('query returned an error')) {
      errorMsg = `Tab '${tabName}' does not exist in spreadsheet. Please check tab name spelling.`;
    }

    return {
      propertyId,
      propertyName,
      tabName,
      tabType,
      success: false,
      message: errorMsg,
      timestamp,
    };
  }
}

/**
 * Syncs all mapped property income and expense tabs at once
 */
export async function syncAllPropertyTabsAction({
  spreadsheetUrlOrId,
  mappings,
}: {
  spreadsheetUrlOrId: string;
  mappings: {
    propertyId: string;
    propertyName: string;
    incomeTab: string;
    expenseTab: string;
  }[];
}): Promise<TabSyncResult[]> {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (!session.permissions.includes('manage_bookings') && session.role !== 'super_admin' && session.role !== 'finance_admin' && session.role !== 'operations_manager') {
    throw new Error('Forbidden: Insufficient permissions (manage_bookings required).');
  }

  const results: TabSyncResult[] = [];

  for (const item of mappings) {
    if (item.incomeTab && item.incomeTab.trim()) {
      const incRes = await syncSinglePropertyTabAction({
        spreadsheetUrlOrId,
        propertyId: item.propertyId,
        propertyName: item.propertyName,
        tabName: item.incomeTab.trim(),
        tabType: 'income',
      });
      results.push(incRes);
    }

    if (item.expenseTab && item.expenseTab.trim()) {
      const expRes = await syncSinglePropertyTabAction({
        spreadsheetUrlOrId,
        propertyId: item.propertyId,
        propertyName: item.propertyName,
        tabName: item.expenseTab.trim(),
        tabType: 'expense',
      });
      results.push(expRes);
    }
  }

  revalidatePath('/dashboard/bookings', 'layout');
  return results;
}

export type GoogleSheetTabPreviewResult = {
  success: boolean;
  propertyId: string;
  propertyName: string;
  tabName: string;
  tabType: 'income' | 'expense';
  message: string;
  parsedRows?: ReturnType<typeof parseGoogleSheetCsv>;
  analysis?: {
    total: number;
    newCount: number;
    duplicateCount: number;
    invalidCount: number;
    analyzedRows: import('./import.actions').ImportRowAnalysis[];
  };
  requiresPermission?: boolean;
};

/**
 * Previews live Google Sheet tab rows and analyzes them against DB without writing to DB
 */
export async function previewGoogleSheetTabAction({
  spreadsheetUrlOrId,
  propertyId,
  propertyName,
  tabName,
  tabType,
}: {
  spreadsheetUrlOrId: string;
  propertyId: string;
  propertyName: string;
  tabName: string;
  tabType: 'income' | 'expense';
}): Promise<GoogleSheetTabPreviewResult> {
  const session = await getDashboardSession();
  if (!session) {
    throw new Error('Unauthorized: Authentication required.');
  }
  if (
    !session.permissions.includes('manage_bookings') &&
    session.role !== 'super_admin' &&
    session.role !== 'finance_admin' &&
    session.role !== 'operations_manager'
  ) {
    throw new Error('Forbidden: Insufficient permissions (manage_bookings required).');
  }

  const spreadsheetId = await extractSpreadsheetId(spreadsheetUrlOrId);
  if (!spreadsheetId) {
    return {
      success: false,
      propertyId,
      propertyName,
      tabName,
      tabType,
      message: 'Invalid Google Sheet URL format.',
    };
  }

  if (!tabName || !tabName.trim()) {
    return {
      success: false,
      propertyId,
      propertyName,
      tabName: tabName || '(Not specified)',
      tabType,
      message: `No ${tabType} tab name specified.`,
    };
  }

  try {
    const rawRows = await fetchSheetData(tabName.trim(), spreadsheetId);
    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        propertyId,
        propertyName,
        tabName,
        tabType,
        message: `Tab '${tabName}' is empty or contains no readable data.`,
      };
    }

    const keys = Object.keys(rawRows[0] || {});
    const csvLines = [
      keys.join(','),
      ...rawRows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
    ];
    const csvContent = csvLines.join('\n');

    const parsedRows = parseGoogleSheetCsv(csvContent);
    if (parsedRows.length === 0) {
      return {
        success: false,
        propertyId,
        propertyName,
        tabName,
        tabType,
        message: `Tab '${tabName}' accessible, but no rows could be parsed.`,
      };
    }

    const { analyzeImportRowsAction } = await import('./import.actions');
    const analysis = await analyzeImportRowsAction(parsedRows, propertyId);

    return {
      success: true,
      propertyId,
      propertyName,
      tabName,
      tabType,
      message: `Successfully fetched and pre-scanned ${parsedRows.length} rows from tab '${tabName}'!`,
      parsedRows,
      analysis,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('sign-in') || msg.includes('Anyone with the link')) {
      return {
        success: false,
        propertyId,
        propertyName,
        tabName,
        tabType,
        requiresPermission: true,
        message: `Permission Restricted: Share Google Sheet to "Anyone with the link can view".`,
      };
    }
    return {
      success: false,
      propertyId,
      propertyName,
      tabName,
      tabType,
      message: `Failed to preview tab '${tabName}': ${msg}`,
    };
  }
}
