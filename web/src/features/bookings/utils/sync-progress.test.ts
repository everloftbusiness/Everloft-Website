import { describe, it, expect } from 'vitest';
import { calculateProgressAndEta, chunkArray } from './sync-progress';

describe('Real-Time Sync Progress & ETA Estimator', () => {
  it('correctly calculates percentage, elapsed time, and ETA during active sync', () => {
    const startMs = 1000000;
    // 5 seconds elapsed, 50 out of 200 items completed (speed = 10 items/sec)
    const nowMs = startMs + 5000;
    const progress = calculateProgressAndEta(startMs, 50, 200, nowMs);

    expect(progress.percent).toBe(25);
    expect(progress.elapsedSeconds).toBe(5);
    expect(progress.speedUnitsPerSec).toBe(10);
    // 150 items remaining / 10 items/sec = 15 seconds ETA
    expect(progress.estimatedRemainingSeconds).toBe(15);
  });

  it('handles completion state (100% and 0s ETA)', () => {
    const startMs = 1000000;
    const nowMs = startMs + 8000;
    const progress = calculateProgressAndEta(startMs, 200, 200, nowMs);

    expect(progress.percent).toBe(100);
    expect(progress.estimatedRemainingSeconds).toBe(0);
    expect(progress.speedUnitsPerSec).toBe(25);
  });

  it('handles initial state before any items complete', () => {
    const startMs = 1000000;
    const progress = calculateProgressAndEta(startMs, 0, 100, startMs + 200);

    expect(progress.percent).toBe(0);
    expect(progress.estimatedRemainingSeconds).toBeNull();
  });

  it('correctly chunks arrays into batches', () => {
    const items = Array.from({ length: 95 }, (_, i) => i + 1);
    const chunks = chunkArray(items, 30);

    expect(chunks.length).toBe(4);
    expect(chunks[0].length).toBe(30);
    expect(chunks[1].length).toBe(30);
    expect(chunks[2].length).toBe(30);
    expect(chunks[3].length).toBe(5);
  });
});
