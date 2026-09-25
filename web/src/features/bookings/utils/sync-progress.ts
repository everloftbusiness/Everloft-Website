/**
 * Real-Time Sync Progress & ETA Calculation Utility
 */

export type ProgressCalculation = {
  elapsedSeconds: number;
  estimatedRemainingSeconds: number | null;
  speedUnitsPerSec: number;
  percent: number;
};

/**
 * Calculates current percentage, elapsed seconds, ETA, and throughput speed
 */
export function calculateProgressAndEta(
  startTimeMs: number,
  completedUnits: number,
  totalUnits: number,
  nowMs: number = Date.now()
): ProgressCalculation {
  if (totalUnits <= 0) {
    return {
      elapsedSeconds: 0,
      estimatedRemainingSeconds: null,
      speedUnitsPerSec: 0,
      percent: 100,
    };
  }

  const elapsedMs = Math.max(1, nowMs - startTimeMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const percent = Math.min(100, Math.max(0, Math.round((completedUnits / totalUnits) * 100)));

  if (completedUnits <= 0) {
    return {
      elapsedSeconds,
      estimatedRemainingSeconds: null,
      speedUnitsPerSec: 0,
      percent: 0,
    };
  }

  if (percent >= 100) {
    return {
      elapsedSeconds,
      estimatedRemainingSeconds: 0,
      speedUnitsPerSec: Math.round((totalUnits / (elapsedMs / 1000)) * 10) / 10,
      percent: 100,
    };
  }

  // Throughput: completed items per second
  const speed = completedUnits / (elapsedMs / 1000);
  const remainingUnits = Math.max(0, totalUnits - completedUnits);

  // ETA: remaining items / speed
  let estimatedRemainingSeconds: number | null = null;
  if (speed > 0 && elapsedSeconds >= 1) {
    estimatedRemainingSeconds = Math.max(1, Math.round(remainingUnits / speed));
  }

  return {
    elapsedSeconds,
    estimatedRemainingSeconds,
    speedUnitsPerSec: Math.round(speed * 10) / 10,
    percent,
  };
}

/**
 * Splits an array into chunks of the given size
 */
export function chunkArray<T>(items: T[], chunkSize: number = 30): T[][] {
  if (!items || items.length === 0) return [];
  const size = Math.max(1, chunkSize);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
