'use client';

import React from 'react';
import {
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  CheckCheck,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SyncProgressState = {
  active: boolean;
  title: string;
  currentStep: string;
  totalUnits: number;
  completedUnits: number;
  percent: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number | null;
  speedUnitsPerSec?: number;
  successCount: number;
  duplicateCount: number;
  additionalCount?: number;
  failedCount: number;
  isComplete: boolean;
  errorMessage?: string | null;
};

export function formatEtaDisplay(etaSeconds: number | null, percent: number): string {
  if (percent >= 100) return 'Complete!';
  if (etaSeconds === null || etaSeconds === undefined) return 'Estimating...';
  if (etaSeconds <= 2) return '< 3s remaining';
  if (etaSeconds < 60) return `~${etaSeconds}s remaining`;
  const mins = Math.floor(etaSeconds / 60);
  const secs = etaSeconds % 60;
  return `~${mins}m ${secs}s remaining`;
}

export function formatElapsedTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function SyncProgressOverlay({
  state,
  onDismiss,
}: {
  state: SyncProgressState;
  onDismiss?: () => void;
}) {
  if (!state.active) return null;

  const boundedPercent = Math.min(100, Math.max(0, Math.round(state.percent)));
  const etaText = formatEtaDisplay(state.estimatedRemainingSeconds, boundedPercent);
  const elapsedText = formatElapsedTimeDisplay(state.elapsedSeconds);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border border-purple-500/30 shadow-2xl rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              state.isComplete
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400 animate-pulse'
            }`}>
              {state.isComplete ? (
                <CheckCheck className="h-5 w-5" />
              ) : (
                <RotateCw className="h-5 w-5 animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {state.title || 'Synchronizing Google Sheet'}
                </h3>
                {state.isComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Done
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-md">
                {state.currentStep || 'Processing live transactions...'}
              </p>
            </div>
          </div>

          {state.isComplete && onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Live Percentage & Time Gauges */}
        <div className="flex items-baseline justify-between pt-1 relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent font-mono">
              {boundedPercent}%
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              ({state.completedUnits} / {state.totalUnits} items)
            </span>
          </div>

          {/* Time & Speed Pills */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* ETA Badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
              state.isComplete
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 animate-pulse'
            }`}>
              <Clock className="h-3 w-3" />
              <span>{etaText}</span>
            </span>

            {/* Elapsed Timer Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 border border-border/80 text-foreground font-mono">
              ⏱️ {elapsedText}
            </span>

            {/* Speed Badge */}
            {state.speedUnitsPerSec !== undefined && state.speedUnitsPerSec > 0 && !state.isComplete && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-mono">
                <Zap className="h-3 w-3 text-purple-500" />
                <span>{state.speedUnitsPerSec} /s</span>
              </span>
            )}
          </div>
        </div>

        {/* High-Fidelity Animated Progress Bar */}
        <div className="relative z-10 space-y-1.5">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/70 p-0.5 border border-purple-500/25 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out shadow-sm relative overflow-hidden ${
                state.isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400'
              }`}
              style={{ width: `${boundedPercent}%` }}
            >
              {/* Animated Glowing Shimmer Effect */}
              {!state.isComplete && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Real-time Summary Statistics Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 text-center relative z-10">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Processed
            </span>
            <span className="text-base font-extrabold text-foreground font-mono">
              {state.completedUnits}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
              New Bookings
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {state.successCount}
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
              Duplicates Skipped
            </span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {state.duplicateCount}
            </span>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 space-y-0.5 col-span-3 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
              Total Found
            </span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {state.totalUnits}
            </span>
          </div>
        </div>

        {/* Error Notification if any */}
        {state.errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 relative z-10">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{state.errorMessage}</span>
          </div>
        )}

        {/* Action Button When Complete */}
        {state.isComplete && onDismiss && (
          <div className="pt-2 flex justify-end relative z-10">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 h-9 rounded-xl shadow-md"
              onClick={onDismiss}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Done & View Bookings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
