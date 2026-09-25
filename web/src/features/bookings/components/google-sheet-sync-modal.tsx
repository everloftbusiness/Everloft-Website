'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RefreshCw,
  Link2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Building2,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Layers,
  Clock,
  Eye,
} from 'lucide-react';
import { type PropertyOption } from '../types/booking.types';
import {
  testGoogleSheetConnectionAction,
  syncSinglePropertyTabAction,
  syncAllPropertyTabsAction,
  previewGoogleSheetTabAction,
  fetchTabRowsForInteractiveSyncAction,
  type TabSyncResult,
  type GoogleSheetTabPreviewResult,
} from '../actions/dynamic-sheet-sync.action';
import { importBookingsAction, type ImportRowAnalysis } from '../actions/import.actions';
import { money } from '../utils/money';
import { toast } from 'sonner';
import { FormattedDateTime, LocalTimezoneBadge } from '@/components/ui/formatted-date-time';
import {
  SyncProgressOverlay,
  type SyncProgressState,
  formatEtaDisplay,
} from './sync-progress-tracker';
import { calculateProgressAndEta, chunkArray } from '../utils/sync-progress';

type PropertyMapping = {
  propertyId: string;
  propertyName: string;
  incomeTab: string;
  expenseTab: string;
};

export function GoogleSheetSyncModal({ properties }: { properties: PropertyOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1Q_fEZLHCENn-her2QOSkniZqkP-f6DBe/edit'
  );
  
  // Connection state
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    diagnostic?: string;
    requiresPermission?: boolean;
  } | null>(null);

  // Per-property tab mappings state
  const [mappings, setMappings] = useState<PropertyMapping[]>(() =>
    properties.map((p) => {
      const isPinnacle = p.name.toLowerCase().includes('pinnacle');
      return {
        propertyId: p.id,
        propertyName: p.name,
        incomeTab: isPinnacle ? 'Pinnacle Income' : `${p.name} Income`,
        expenseTab: isPinnacle ? 'Pinnacle Expenses' : `${p.name} Expenses`,
      };
    })
  );
  
  // Tab-by-tab sync results map & timestamps
  const [tabResults, setTabResults] = useState<Record<string, TabSyncResult>>({});
  const [lastSyncedTimes, setLastSyncedTimes] = useState<Record<string, string>>({});
  const [lastGlobalSyncTime, setLastGlobalSyncTime] = useState<string | null>(null);

  useEffect(() => {
    setIsClientMounted(true);
    try {
      if (typeof window !== 'undefined') {
        const savedUrl = localStorage.getItem('everloft_google_sheet_url');
        if (savedUrl) setSpreadsheetUrl(savedUrl);

        const savedMappings = localStorage.getItem('everloft_property_sheet_mappings');
        if (savedMappings) setMappings(JSON.parse(savedMappings));

        const savedTabTimes = localStorage.getItem('everloft_google_sheet_last_sync_times');
        if (savedTabTimes) setLastSyncedTimes(JSON.parse(savedTabTimes));

        const savedGlobalTime = localStorage.getItem('everloft_google_sheet_last_global_sync');
        if (savedGlobalTime) setLastGlobalSyncTime(savedGlobalTime);
      }
    } catch (e) {
      console.error('Failed to load saved sheet settings from localStorage:', e);
    }
  }, []);

  const [activeSyncingKey, setActiveSyncingKey] = useState<string | null>(null);
  const [isSyncingAll, startTransitionSyncAll] = useTransition();

  // Real-Time Progress, Percentage & ETA Estimation State
  const [syncProgress, setSyncProgress] = useState<SyncProgressState | null>(null);

  // Google Sheet Live Row Preview / Inspection Modal State
  const [activePreview, setActivePreview] = useState<GoogleSheetTabPreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);
  const [previewStatusFilter, setPreviewStatusFilter] = useState<'all' | 'new' | 'duplicate' | 'invalid'>('all');
  const [isExecutingPreviewImport, startTransitionPreviewImport] = useTransition();

  const isSyncOngoing = isSyncingAll || activeSyncingKey !== null;

  function saveMappings(updated: PropertyMapping[]) {
    setMappings(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('everloft_property_sheet_mappings', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save mappings:', e);
    }
  }

  function saveSyncTimestamp(key: string) {
    const nowIso = new Date().toISOString();
    setLastGlobalSyncTime(nowIso);
    setLastSyncedTimes((prev) => {
      const updated = { ...prev, [key]: nowIso };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('everloft_google_sheet_last_global_sync', nowIso);
          localStorage.setItem('everloft_google_sheet_last_sync_times', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
  }

  function saveAllSyncTimestamps(keys: string[]) {
    const nowIso = new Date().toISOString();
    setLastGlobalSyncTime(nowIso);
    setLastSyncedTimes((prev) => {
      const updated = { ...prev };
      keys.forEach((k) => (updated[k] = nowIso));
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('everloft_google_sheet_last_global_sync', nowIso);
          localStorage.setItem('everloft_google_sheet_last_sync_times', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
  }



  function handleUrlChange(newUrl: string) {
    setSpreadsheetUrl(newUrl);
    setConnectionStatus(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('everloft_google_sheet_url', newUrl);
      }
    } catch {
      // ignore
    }
  }

  async function handleTestConnection() {
    if (!spreadsheetUrl.trim()) {
      toast.error('Please enter a Google Drive spreadsheet URL');
      return;
    }

    setIsTesting(true);
    try {
      const res = await testGoogleSheetConnectionAction(spreadsheetUrl);
      setConnectionStatus({
        tested: true,
        success: res.success,
        message: res.message,
        diagnostic: res.diagnostic,
        requiresPermission: res.requiresPermission,
      });

      if (res.success) {
        toast.success('Connected to Google Sheet in Google Drive!');
      } else if (res.requiresPermission) {
        toast.error('Google Sheet access restricted (Sign-in required)', { duration: 6000 });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: 'Network test failed.',
        diagnostic: err instanceof Error ? err.message : String(err),
      });
      toast.error('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  }

  function handleTabNameChange(propertyId: string, field: 'incomeTab' | 'expenseTab', val: string) {
    const updated = mappings.map((m) => (m.propertyId === propertyId ? { ...m, [field]: val } : m));
    saveMappings(updated);
  }

  async function handleSyncSingleTab(
    propertyId: string,
    propertyName: string,
    tabName: string,
    tabType: 'income' | 'expense'
  ) {
    const key = `${propertyId}_${tabType}`;
    setActiveSyncingKey(key);

    const startTime = Date.now();
    setSyncProgress({
      active: true,
      title: `Syncing ${propertyName} (${tabName})`,
      currentStep: `Connecting to Google Drive and reading tab "${tabName}"...`,
      totalUnits: 100,
      completedUnits: 5,
      percent: 5,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: null,
      speedUnitsPerSec: 0,
      successCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      isComplete: false,
    });

    const ticker = setInterval(() => {
      setSyncProgress((prev) => {
        if (!prev || !prev.active || prev.isComplete) return prev;
        const now = Date.now();
        const calc = calculateProgressAndEta(startTime, prev.completedUnits, prev.totalUnits, now);
        return {
          ...prev,
          elapsedSeconds: calc.elapsedSeconds,
          estimatedRemainingSeconds: calc.estimatedRemainingSeconds,
          speedUnitsPerSec: calc.speedUnitsPerSec,
        };
      });
    }, 400);

    try {
      const fetchRes = await fetchTabRowsForInteractiveSyncAction({
        spreadsheetUrlOrId: spreadsheetUrl,
        propertyId,
        propertyName,
        tabName,
        tabType,
      });

      if (!fetchRes.success || !fetchRes.rows || fetchRes.rows.length === 0) {
        clearInterval(ticker);
        const errMsg = fetchRes.message || 'No valid rows found in tab.';
        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                isComplete: true,
                percent: 100,
                currentStep: errMsg,
                errorMessage: errMsg,
              }
            : null
        );

        setTabResults((prev) => ({
          ...prev,
          [key]: {
            propertyId,
            propertyName,
            tabName,
            tabType,
            success: false,
            message: errMsg,
            timestamp: new Date().toISOString(),
          },
        }));

        if (fetchRes.requiresPermission) {
          toast.error('Google Sheet access restricted (Sign-in required)', { duration: 6000 });
        } else {
          toast.error(errMsg);
        }
        return;
      }

      const totalRows = fetchRes.rows.length;
      const chunks = chunkArray(fetchRes.rows, 25);
      let cumulativeCompleted = 0;
      let cumulativeSuccess = 0;
      let cumulativeDuplicates = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                title: `Syncing ${propertyName} (${tabName})`,
                currentStep: `Processing batch ${i + 1} of ${chunks.length} (${chunk.length} records)...`,
                totalUnits: totalRows,
              }
            : null
        );

        const importRes = await importBookingsAction(chunk, propertyId);
        cumulativeCompleted += chunk.length;
        cumulativeSuccess += importRes.count;
        cumulativeDuplicates += chunk.length - importRes.count;

        const now = Date.now();
        const calc = calculateProgressAndEta(startTime, cumulativeCompleted, totalRows, now);

        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                completedUnits: cumulativeCompleted,
                totalUnits: totalRows,
                percent: calc.percent,
                elapsedSeconds: calc.elapsedSeconds,
                estimatedRemainingSeconds: calc.estimatedRemainingSeconds,
                speedUnitsPerSec: calc.speedUnitsPerSec,
                successCount: cumulativeSuccess,
                duplicateCount: cumulativeDuplicates,
              }
            : null
        );
      }

      clearInterval(ticker);

      setSyncProgress((prev) =>
        prev
          ? {
              ...prev,
              isComplete: true,
              percent: 100,
              estimatedRemainingSeconds: 0,
              currentStep: `Completed! Synced ${cumulativeSuccess} new booking(s) (${cumulativeDuplicates} duplicates skipped).`,
            }
          : null
      );

      const syncResult: TabSyncResult = {
        propertyId,
        propertyName,
        tabName,
        tabType,
        success: true,
        count: cumulativeSuccess,
        message: `✓ Synced ${cumulativeSuccess} ${tabType} row(s) from tab '${tabName}'.`,
        timestamp: new Date().toISOString(),
      };

      setTabResults((prev) => ({ ...prev, [key]: syncResult }));
      saveSyncTimestamp(key);
      toast.success(syncResult.message);
    } catch (err) {
      clearInterval(ticker);
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setSyncProgress((prev) =>
        prev
          ? {
              ...prev,
              isComplete: true,
              errorMessage: msg,
              currentStep: `Failed: ${msg}`,
            }
          : null
      );
      toast.error(msg);
    } finally {
      setActiveSyncingKey(null);
    }
  }

  async function handleOpenPreview(
    propertyId: string,
    propertyName: string,
    tabName: string,
    tabType: 'income' | 'expense'
  ) {
    const key = `${propertyId}_${tabType}`;
    setPreviewLoadingKey(key);
    setIsPreviewLoading(true);

    try {
      const res = await previewGoogleSheetTabAction({
        spreadsheetUrlOrId: spreadsheetUrl,
        propertyId,
        propertyName,
        tabName,
        tabType,
      });

      if (res.success && res.analysis && res.parsedRows) {
        setActivePreview(res);
        setPreviewStatusFilter('all');
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch Google Sheet preview.');
    } finally {
      setIsPreviewLoading(false);
      setPreviewLoadingKey(null);
    }
  }

  function handleImportFromPreview() {
    if (!activePreview || !activePreview.parsedRows || !activePreview.analysis) return;

    const duplicateIndices = new Set(
      activePreview.analysis.analyzedRows
        .filter((ar) => ar.status === 'duplicate')
        .map((ar) => ar.rawLineIndex)
    );

    const validNewRows = activePreview.parsedRows.filter(
      (r) => r.isValid && !duplicateIndices.has(r.rawLineIndex)
    );

    if (validNewRows.length === 0) {
      toast.info('No new valid rows to import. All rows are duplicates or invalid.');
      return;
    }

    const previewData = activePreview;
    const previewAnalysis = activePreview.analysis;
    const startTime = Date.now();
    const totalRows = validNewRows.length;

    startTransitionPreviewImport(async () => {
      setSyncProgress({
        active: true,
        title: `Importing Tab "${previewData.tabName}"`,
        currentStep: `Preparing ${totalRows} verified records...`,
        totalUnits: totalRows,
        completedUnits: 0,
        percent: 0,
        elapsedSeconds: 0,
        estimatedRemainingSeconds: null,
        speedUnitsPerSec: 0,
        successCount: 0,
        duplicateCount: previewAnalysis.duplicateCount,
        failedCount: 0,
        isComplete: false,
      });

      const ticker = setInterval(() => {
        setSyncProgress((prev) => {
          if (!prev || !prev.active || prev.isComplete) return prev;
          const now = Date.now();
          const calc = calculateProgressAndEta(startTime, prev.completedUnits, prev.totalUnits, now);
          return {
            ...prev,
            elapsedSeconds: calc.elapsedSeconds,
            estimatedRemainingSeconds: calc.estimatedRemainingSeconds,
            speedUnitsPerSec: calc.speedUnitsPerSec,
          };
        });
      }, 400);

      try {
        const chunks = chunkArray(validNewRows, 25);
        let cumulativeCompleted = 0;
        let cumulativeSuccess = 0;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          setSyncProgress((prev) =>
            prev
              ? {
                  ...prev,
                  currentStep: `Writing batch ${i + 1} of ${chunks.length} (${chunk.length} records) to database...`,
                }
              : null
          );

          const res = await importBookingsAction(chunk, previewData.propertyId);
          cumulativeCompleted += chunk.length;
          cumulativeSuccess += res.count;

          const now = Date.now();
          const calc = calculateProgressAndEta(startTime, cumulativeCompleted, totalRows, now);

          setSyncProgress((prev) =>
            prev
              ? {
                  ...prev,
                  completedUnits: cumulativeCompleted,
                  percent: calc.percent,
                  elapsedSeconds: calc.elapsedSeconds,
                  estimatedRemainingSeconds: calc.estimatedRemainingSeconds,
                  speedUnitsPerSec: calc.speedUnitsPerSec,
                  successCount: cumulativeSuccess,
                }
              : null
          );
        }

        clearInterval(ticker);

        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                isComplete: true,
                percent: 100,
                estimatedRemainingSeconds: 0,
                currentStep: `Successfully saved ${cumulativeSuccess} records into database!`,
              }
            : null
        );

        const key = `${previewData.propertyId}_${previewData.tabType}`;
        setTabResults((prev) => ({
          ...prev,
          [key]: {
            propertyId: previewData.propertyId,
            propertyName: previewData.propertyName,
            tabName: previewData.tabName,
            tabType: previewData.tabType,
            success: true,
            count: cumulativeSuccess,
            message: `✓ Synced ${cumulativeSuccess} ${previewData.tabType} row(s) from tab '${previewData.tabName}'.`,
            timestamp: new Date().toISOString(),
          },
        }));

        saveSyncTimestamp(key);
        toast.success(`Successfully imported ${cumulativeSuccess} new booking(s) from tab '${previewData.tabName}'!`);
        setActivePreview(null);
      } catch (err) {
        clearInterval(ticker);
        const msg = err instanceof Error ? err.message : 'Import failed.';
        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                isComplete: true,
                errorMessage: msg,
                currentStep: `Failed: ${msg}`,
              }
            : null
        );
        toast.error(msg);
      }
    });
  }

  function handleSyncAll() {
    startTransitionSyncAll(async () => {
      const startTime = Date.now();

      type TabTarget = {
        propertyId: string;
        propertyName: string;
        tabName: string;
        tabType: 'income' | 'expense';
      };

      const targets: TabTarget[] = [];
      for (const m of mappings) {
        if (m.incomeTab?.trim()) {
          targets.push({
            propertyId: m.propertyId,
            propertyName: m.propertyName,
            tabName: m.incomeTab.trim(),
            tabType: 'income',
          });
        }
        if (m.expenseTab?.trim()) {
          targets.push({
            propertyId: m.propertyId,
            propertyName: m.propertyName,
            tabName: m.expenseTab.trim(),
            tabType: 'expense',
          });
        }
      }

      if (targets.length === 0) {
        toast.error('No property sheet tabs configured to sync.');
        return;
      }

      setSyncProgress({
        active: true,
        title: 'Syncing All Property Ledgers',
        currentStep: `Scanning ${targets.length} sheet tabs in Google Drive...`,
        totalUnits: targets.length * 30,
        completedUnits: 0,
        percent: 0,
        elapsedSeconds: 0,
        estimatedRemainingSeconds: null,
        speedUnitsPerSec: 0,
        successCount: 0,
        duplicateCount: 0,
        failedCount: 0,
        isComplete: false,
      });

      const ticker = setInterval(() => {
        setSyncProgress((prev) => {
          if (!prev || !prev.active || prev.isComplete) return prev;
          const now = Date.now();
          const calc = calculateProgressAndEta(startTime, prev.completedUnits, prev.totalUnits, now);
          return {
            ...prev,
            elapsedSeconds: calc.elapsedSeconds,
            estimatedRemainingSeconds: calc.estimatedRemainingSeconds,
            speedUnitsPerSec: calc.speedUnitsPerSec,
          };
        });
      }, 400);

      const newMap: Record<string, TabSyncResult> = { ...tabResults };
      const keysToUpdate: string[] = [];
      let totalSuccessBookings = 0;
      let totalDuplicatesSkipped = 0;
      let totalFailedTabs = 0;
      let totalCompletedRows = 0;
      let totalDiscoveredRows = 0;

      try {
        for (let tIdx = 0; tIdx < targets.length; tIdx++) {
          const target = targets[tIdx];
          const key = `${target.propertyId}_${target.tabType}`;
          setActiveSyncingKey(key);

          setSyncProgress((prev) =>
            prev
              ? {
                  ...prev,
                  currentStep: `[${tIdx + 1}/${targets.length}] Reading "${target.tabName}" (${target.propertyName})...`,
                }
              : null
          );

          const fetchRes = await fetchTabRowsForInteractiveSyncAction({
            spreadsheetUrlOrId: spreadsheetUrl,
            propertyId: target.propertyId,
            propertyName: target.propertyName,
            tabName: target.tabName,
            tabType: target.tabType,
          });

          if (!fetchRes.success || !fetchRes.rows || fetchRes.rows.length === 0) {
            totalFailedTabs++;
            newMap[key] = {
              propertyId: target.propertyId,
              propertyName: target.propertyName,
              tabName: target.tabName,
              tabType: target.tabType,
              success: false,
              message: fetchRes.message || 'No valid rows found.',
              timestamp: new Date().toISOString(),
            };
            continue;
          }

          const tabRows = fetchRes.rows;
          totalDiscoveredRows += tabRows.length;

          const chunks = chunkArray(tabRows, 25);
          for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
            const chunk = chunks[cIdx];
            setSyncProgress((prev) => {
              if (!prev) return null;
              const dynamicTotal = Math.max(prev.totalUnits, totalDiscoveredRows);
              return {
                ...prev,
                currentStep: `[${target.propertyName}] Tab "${target.tabName}": batch ${cIdx + 1}/${chunks.length}...`,
                totalUnits: dynamicTotal,
              };
            });

            const importRes = await importBookingsAction(chunk, target.propertyId);
            totalCompletedRows += chunk.length;
            totalSuccessBookings += importRes.count;
            totalDuplicatesSkipped += chunk.length - importRes.count;

            const now = Date.now();
            const dynamicTotal = Math.max(totalDiscoveredRows, totalCompletedRows);
            const calc = calculateProgressAndEta(startTime, totalCompletedRows, dynamicTotal, now);

            setSyncProgress((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                completedUnits: totalCompletedRows,
                totalUnits: dynamicTotal,
                percent: calc.percent,
                elapsedSeconds: calc.elapsedSeconds,
                estimatedRemainingSeconds: calc.estimatedRemainingSeconds,
                speedUnitsPerSec: calc.speedUnitsPerSec,
                successCount: totalSuccessBookings,
                duplicateCount: totalDuplicatesSkipped,
              };
            });
          }

          newMap[key] = {
            propertyId: target.propertyId,
            propertyName: target.propertyName,
            tabName: target.tabName,
            tabType: target.tabType,
            success: true,
            count: tabRows.length,
            message: `✓ Synced tab '${target.tabName}'.`,
            timestamp: new Date().toISOString(),
          };
          keysToUpdate.push(key);
        }

        clearInterval(ticker);

        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                isComplete: true,
                percent: 100,
                completedUnits: totalCompletedRows,
                totalUnits: Math.max(totalCompletedRows, 1),
                estimatedRemainingSeconds: 0,
                currentStep: `Finished! Synced ${totalSuccessBookings} new bookings across ${targets.length - totalFailedTabs} tabs (${totalDuplicatesSkipped} duplicates skipped).`,
              }
            : null
        );

        setTabResults(newMap);
        saveAllSyncTimestamps(keysToUpdate);

        if (totalFailedTabs === 0) {
          toast.success(`✓ Successfully synced all ${targets.length} property tabs!`);
        } else {
          toast.warning(`Synced ${targets.length - totalFailedTabs} tab(s), ${totalFailedTabs} tab(s) had issues.`);
        }
      } catch (err) {
        clearInterval(ticker);
        const msg = err instanceof Error ? err.message : 'Sync all failed.';
        setSyncProgress((prev) =>
          prev
            ? {
                ...prev,
                isComplete: true,
                errorMessage: msg,
                currentStep: `Failed: ${msg}`,
              }
            : null
        );
        toast.error(msg);
      } finally {
        setActiveSyncingKey(null);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`h-9 rounded-lg transition-all text-xs font-semibold shadow-2xs ${
          isSyncOngoing
            ? 'border-purple-500/60 bg-purple-500/15 text-purple-700 dark:text-purple-300 animate-pulse font-bold'
            : 'border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 text-purple-600 dark:text-purple-400 ${isSyncOngoing ? 'animate-spin' : ''}`} />
        {isSyncOngoing ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            {syncProgress?.active ? (
              <span>
                Syncing: {Math.round(syncProgress.percent)}% ({formatEtaDisplay(syncProgress.estimatedRemainingSeconds, syncProgress.percent)})
              </span>
            ) : (
              <span>Syncing Google Sheet...</span>
            )}
          </span>
        ) : (
          <span>⚡ Google Sheet Sync</span>
        )}
        {!isSyncOngoing && isClientMounted && lastGlobalSyncTime && (
          <span className="ml-1.5 text-[10px] font-normal opacity-80 border-l border-purple-500/30 pl-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3 text-purple-500" />
            <FormattedDateTime date={lastGlobalSyncTime} relative includeTimezone={false} />
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[92vh] bg-card border border-border/80 shadow-2xl rounded-2xl p-6 overflow-y-auto space-y-6 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    <Sparkles className="h-3.5 w-3.5" /> Dynamic Google Sheet Sync Manager
                  </span>
                </div>
                <h2 className="mt-1.5 text-2xl font-bold text-foreground">
                  Google Drive Sheet Integration
                </h2>
                <p className="text-xs text-muted-foreground">
                  Connect any Google Sheet link, assign income/expense tab names per property, and run granular tab syncs with instant diagnostics.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* STEP 1: Google Drive Share Link & Connection Status */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Step 1: Google Drive Spreadsheet Share Link
                </label>
                {spreadsheetUrl.trim() && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Open in Google Drive <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit..."
                  value={spreadsheetUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="text-xs font-mono h-9 bg-background"
                />
                <Button
                  type="button"
                  variant="blue-accent"
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold whitespace-nowrap"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Testing...
                    </>
                  ) : (
                    'Connect & Test Sheet'
                  )}
                </Button>
              </div>

              {/* Connection Diagnostics Banner */}
              {connectionStatus && (
                <div
                  className={`rounded-lg border p-3 text-xs space-y-1 ${
                    connectionStatus.success
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {connectionStatus.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                    )}
                    {connectionStatus.message}
                  </div>
                  {connectionStatus.diagnostic && (
                    <p className="text-[11px] opacity-90 font-medium pl-6 leading-relaxed">
                      {connectionStatus.diagnostic}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Property Income & Expense Tab Mapping Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Step 2: Per-Property Tab Assignment & Mapping
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {properties.length} platform properties registered
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-card overflow-x-auto shadow-inner">
                <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                  <thead className="bg-muted/80 border-b text-[11px] font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">Property Name</th>
                      <th className="px-3 py-2.5">📥 Income Page Tab Name</th>
                      <th className="px-3 py-2.5">📤 Expense Page Tab Name</th>
                      <th className="px-3 py-2.5 text-center">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {properties.map((p) => {
                      const mapItem = mappings.find((m) => m.propertyId === p.id) || {
                        propertyId: p.id,
                        propertyName: p.name,
                        incomeTab: `${p.name} Income`,
                        expenseTab: `${p.name} Expenses`,
                      };

                      const incKey = `${p.id}_income`;
                      const expKey = `${p.id}_expense`;
                      const incRes = tabResults[incKey];
                      const expRes = tabResults[expKey];

                      const isIncSyncing = activeSyncingKey === incKey;
                      const isExpSyncing = activeSyncingKey === expKey;

                      return (
                        <tr key={p.id} className="hover:bg-muted/20">
                          {/* Property Name */}
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              {p.name}
                            </span>
                          </td>

                          {/* Income Tab Field & Status */}
                          <td className="px-3 py-2.5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={mapItem.incomeTab}
                                placeholder="e.g. Pinnacle Income"
                                onChange={(e) => handleTabNameChange(p.id, 'incomeTab', e.target.value)}
                                className="h-8 w-44 rounded border border-input bg-background px-2.5 text-xs font-mono"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="h-8 text-[11px] px-2 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 font-semibold"
                                disabled={(isPreviewLoading && previewLoadingKey === incKey) || !mapItem.incomeTab.trim()}
                                onClick={() => handleOpenPreview(p.id, p.name, mapItem.incomeTab, 'income')}
                              >
                                <Eye className={`mr-1 h-3 w-3 ${isPreviewLoading && previewLoadingKey === incKey ? 'animate-spin' : ''}`} />
                                {isPreviewLoading && previewLoadingKey === incKey ? 'Scanning...' : 'Preview'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                                disabled={isIncSyncing || !mapItem.incomeTab.trim()}
                                onClick={() =>
                                  handleSyncSingleTab(p.id, p.name, mapItem.incomeTab, 'income')
                                }
                              >
                                <RefreshCw className={`mr-1 h-3 w-3 ${isIncSyncing ? 'animate-spin' : ''}`} />
                                Direct Sync
                              </Button>
                            </div>
                            {/* Income Status Badge & Last Sync Time */}
                            {incRes && (
                              <div
                                className={`text-[10px] font-medium leading-tight flex items-center gap-1 ${
                                  incRes.success
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                                title={incRes.message}
                              >
                                {incRes.success ? (
                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate max-w-[200px]">{incRes.message}</span>
                              </div>
                            )}
                            {isClientMounted && lastSyncedTimes[incKey] && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-purple-500 shrink-0" />
                                <span>Synced:</span>
                                <FormattedDateTime date={lastSyncedTimes[incKey]} relative className="font-medium text-foreground" />
                                <LocalTimezoneBadge />
                              </div>
                            )}
                          </td>

                          {/* Expense Tab Field & Status */}
                          <td className="px-3 py-2.5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={mapItem.expenseTab}
                                placeholder="e.g. Pinnacle Expenses"
                                onChange={(e) => handleTabNameChange(p.id, 'expenseTab', e.target.value)}
                                className="h-8 w-44 rounded border border-input bg-background px-2.5 text-xs font-mono"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="h-8 text-[11px] px-2 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 font-semibold"
                                disabled={(isPreviewLoading && previewLoadingKey === expKey) || !mapItem.expenseTab.trim()}
                                onClick={() => handleOpenPreview(p.id, p.name, mapItem.expenseTab, 'expense')}
                              >
                                <Eye className={`mr-1 h-3 w-3 ${isPreviewLoading && previewLoadingKey === expKey ? 'animate-spin' : ''}`} />
                                {isPreviewLoading && previewLoadingKey === expKey ? 'Scanning...' : 'Preview'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                                disabled={isExpSyncing || !mapItem.expenseTab.trim()}
                                onClick={() =>
                                  handleSyncSingleTab(p.id, p.name, mapItem.expenseTab, 'expense')
                                }
                              >
                                <RefreshCw className={`mr-1 h-3 w-3 ${isExpSyncing ? 'animate-spin' : ''}`} />
                                Direct Sync
                              </Button>
                            </div>
                            {/* Expense Status Badge & Last Sync Time */}
                            {expRes && (
                              <div
                                className={`text-[10px] font-medium leading-tight flex items-center gap-1 ${
                                  expRes.success
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                                title={expRes.message}
                              >
                                {expRes.success ? (
                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate max-w-[200px]">{expRes.message}</span>
                              </div>
                            )}
                            {isClientMounted && lastSyncedTimes[expKey] && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-purple-500 shrink-0" />
                                <span>Synced:</span>
                                <FormattedDateTime date={lastSyncedTimes[expKey]} relative className="font-medium text-foreground" />
                                <LocalTimezoneBadge />
                              </div>
                            )}
                          </td>

                          {/* Quick Both Sync Button */}
                          <td className="px-3 py-2.5 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="h-7 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                              onClick={async () => {
                                if (mapItem.incomeTab.trim()) {
                                  await handleSyncSingleTab(p.id, p.name, mapItem.incomeTab, 'income');
                                }
                                if (mapItem.expenseTab.trim()) {
                                  await handleSyncSingleTab(p.id, p.name, mapItem.expenseTab, 'expense');
                                }
                              }}
                            >
                              Sync Both Tabs
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer / Sync All Actions */}
            <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>
                  Tip: Assign tab names corresponding to your Google Sheet pages before clicking Sync All.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>

                <Button
                  type="button"
                  variant="blue-accent"
                  size="sm"
                  className="text-xs font-bold px-4"
                  disabled={isSyncingAll}
                  onClick={handleSyncAll}
                >
                  {isSyncingAll ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Syncing All Property Ledgers...
                    </>
                  ) : (
                    <>
                      ⚡ Sync All Property Ledgers <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Pre-scan Preview Modal for Google Sheet Tab */}
      {activePreview && activePreview.analysis && activePreview.parsedRows && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-5xl max-h-[92vh] bg-card border border-border/80 shadow-2xl rounded-2xl p-6 overflow-y-auto space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    <Sparkles className="h-3.5 w-3.5" /> Google Sheet Pre-Import Inspector
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                    Tab: &quot;{activePreview.tabName}&quot;
                  </span>
                </div>
                <h2 className="mt-1.5 text-2xl font-bold text-foreground flex items-center gap-2">
                  Preview & Reconcile Data: {activePreview.propertyName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Fetched live from Google Sheet. Review categorized new reservations vs database duplicates before importing.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setActivePreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 3 KPI Summary Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* KPI Card 1: New Data */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 🟢 New Data to Add
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {activePreview.analysis.newCount}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  New reservations ready to create in database
                </p>
              </div>

              {/* KPI Card 2: Duplicate Data */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> 🟡 Duplicates (Skipped)
                  </span>
                  <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                    {activePreview.analysis.duplicateCount}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Already existing in DB or repeated in Google Sheet
                </p>
              </div>

              {/* KPI Card 3: Invalid Rows */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-500" /> 🔴 Invalid Rows
                  </span>
                  <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-400">
                    {activePreview.analysis.invalidCount}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Rows with formatting or date parsing errors
                </p>
              </div>
            </div>

            {/* Filter Tabs & Subtitle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">Filter View:</span>
                <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40 text-xs font-medium">
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      previewStatusFilter === 'all'
                        ? 'bg-card text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setPreviewStatusFilter('all')}
                  >
                    All Rows ({activePreview.parsedRows.length})
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      previewStatusFilter === 'new'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setPreviewStatusFilter('new')}
                  >
                    🟢 New Data ({activePreview.analysis.newCount})
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      previewStatusFilter === 'duplicate'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setPreviewStatusFilter('duplicate')}
                  >
                    🟡 Duplicates ({activePreview.analysis.duplicateCount})
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      previewStatusFilter === 'invalid'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setPreviewStatusFilter('invalid')}
                  >
                    🔴 Invalid ({activePreview.analysis.invalidCount})
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-muted-foreground">
                Property: <strong className="text-foreground">{activePreview.propertyName}</strong>
              </div>
            </div>

            {/* Reconciliation Table */}
            <div className="overflow-x-auto max-h-80 rounded-xl border bg-card shadow-inner">
              <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-xs border-b font-semibold text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 border-r text-center w-8">#</th>
                    <th className="px-3 py-2 border-r">Guest Name</th>
                    <th className="px-3 py-2 border-r">Check-In</th>
                    <th className="px-3 py-2 border-r">Room</th>
                    <th className="px-3 py-2 border-r">Channel</th>
                    <th className="px-3 py-2 border-r text-right">Guest Charge</th>
                    <th className="px-3 py-2 border-r text-right">Host Payout</th>
                    <th className="px-3 py-2 border-r">Bank Credited</th>
                    <th className="px-3 py-2 text-center">Import Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(() => {
                    const analysisMap = new Map<number, ImportRowAnalysis>();
                    activePreview.analysis.analyzedRows.forEach((ar) => analysisMap.set(ar.rawLineIndex, ar));

                    const filtered = activePreview.parsedRows.filter((r) => {
                      if (previewStatusFilter === 'all') return true;
                      const analysis = analysisMap.get(r.rawLineIndex);
                      if (!analysis) return true;
                      return analysis.status === previewStatusFilter;
                    });

                    return filtered.map((r, idx) => {
                      const analysis = analysisMap.get(r.rawLineIndex);
                      const isDuplicate = analysis?.status === 'duplicate';
                      const isInvalid = !r.isValid || analysis?.status === 'invalid';

                      return (
                        <tr
                          key={idx}
                          className={
                            isInvalid
                              ? 'bg-rose-500/5'
                              : isDuplicate
                              ? 'bg-amber-500/10 hover:bg-amber-500/15'
                              : 'hover:bg-muted/30'
                          }
                        >
                          <td className="px-3 py-2 border-r text-muted-foreground text-center font-mono">{r.rawLineIndex}</td>
                          <td className="px-3 py-2 border-r">
                            <span className="font-semibold text-foreground">{r.guestName}</span>
                            {r.reconciliationNote && (
                              <span className="block text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                ⚡ {r.reconciliationNote}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 border-r font-mono text-muted-foreground">{r.checkInDate}</td>
                          <td className="px-3 py-2 border-r">
                            <span className="font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              {r.roomLabel || 'Whole Villa'}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r">{r.source}</td>
                          <td className="px-3 py-2 border-r text-right font-mono font-medium">{money(r.guestTotal, 'INR')}</td>
                          <td className="px-3 py-2 border-r text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">{money(r.hostTotal, 'INR')}</td>
                          <td className="px-3 py-2 border-r text-muted-foreground">{r.amountCreditedBank || '—'}</td>
                          <td className="px-3 py-2 text-center min-w-[170px]">
                            {isInvalid ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-500/30">
                                  <AlertCircle className="h-3 w-3" /> INVALID
                                </span>
                                <span className="text-[9px] text-rose-500 max-w-[140px] truncate mt-0.5" title={analysis?.reason || 'Format error'}>
                                  {analysis?.reason || 'Format error'}
                                </span>
                              </div>
                            ) : isDuplicate ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <AlertCircle className="h-3 w-3" /> DUPLICATE (SKIPPED)
                                </span>
                                <span className="text-[9px] text-amber-700 dark:text-amber-300 max-w-[160px] truncate mt-0.5" title={analysis?.reason}>
                                  {analysis?.reason}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" /> 🟢 NEW DATA
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="border-t pt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setActivePreview(null)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="blue-accent"
                size="sm"
                className="text-xs font-bold px-4"
                disabled={activePreview.analysis.newCount === 0 || isExecutingPreviewImport}
                onClick={handleImportFromPreview}
              >
                {isExecutingPreviewImport ? (
                  'Importing & Saving Records...'
                ) : (
                  <>
                    Import {activePreview.analysis.newCount} New Booking{activePreview.analysis.newCount === 1 ? '' : 's'}
                    {activePreview.analysis.duplicateCount > 0
                      ? ` (Skipping ${activePreview.analysis.duplicateCount} Duplicate${activePreview.analysis.duplicateCount === 1 ? '' : 's'})`
                      : ''}{' '}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Percentage & ETA Sync Progress Overlay */}
      {syncProgress?.active && (
        <SyncProgressOverlay
          state={syncProgress}
          onDismiss={() => setSyncProgress(null)}
        />
      )}
    </>
  );
}
