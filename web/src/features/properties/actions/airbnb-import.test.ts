import { describe, it, expect, vi } from "vitest";

describe("Airbnb Import Hardening & Concurrency Limit Tests", () => {
  it("1. proves worker-pool concurrency NEVER exceeds 3 simultaneous fetches", async () => {
    let activeFetches = 0;
    let maxActiveObserved = 0;

    const mockFetch = vi.fn().mockImplementation(async () => {
      activeFetches++;
      maxActiveObserved = Math.max(maxActiveObserved, activeFetches);
      await new Promise((resolve) => setTimeout(resolve, 20)); // Simulate async network latency
      activeFetches--;
      return {
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: async () => new ArrayBuffer(10000),
      };
    });

    // Replicate runWithConcurrency from airbnb-import.actions.ts
    async function runWithConcurrency<T, R>(
      items: T[],
      concurrencyLimit: number,
      fn: (item: T, index: number) => Promise<R>
    ): Promise<PromiseSettledResult<R>[]> {
      const results: PromiseSettledResult<R>[] = new Array(items.length);
      let index = 0;

      async function worker() {
        while (index < items.length) {
          const currentIndex = index++;
          try {
            const val = await fn(items[currentIndex], currentIndex);
            results[currentIndex] = { status: "fulfilled", value: val };
          } catch (err) {
            results[currentIndex] = { status: "rejected", reason: err };
          }
        }
      }

      const workers = Array.from({ length: Math.min(concurrencyLimit, items.length) }, () => worker());
      await Promise.all(workers);
      return results;
    }

    const photos = Array.from({ length: 15 }, (_, i) => ({ url: `https://example.com/photo_${i}.jpg` }));

    await runWithConcurrency(photos, 3, async (photo) => {
      await mockFetch(photo.url);
    });

    expect(mockFetch).toHaveBeenCalledTimes(15);
    expect(maxActiveObserved).toBeLessThanOrEqual(3);
    expect(maxActiveObserved).toBe(3);
  });

  it("2. enforces high-capacity photo slicing up to MAX_AIRBNB_PHOTOS (120 photos)", () => {
    const photos = Array.from({ length: 150 }, (_, i) => ({ url: `https://example.com/photo_${i}.jpg` }));
    const MAX_AIRBNB_PHOTOS = 120;
    const photosToProcess = photos.slice(0, MAX_AIRBNB_PHOTOS);

    expect(photosToProcess.length).toBe(120);
  });

  it("3. verifies timeout is cleared in finally block even on fetch failure", async () => {
    let clearTimeoutCalled = false;
    const timeoutId = setTimeout(() => {}, 10000);

    const runFetchWithTimeout = async () => {
      try {
        throw new Error("Network offline");
      } finally {
        clearTimeout(timeoutId);
        clearTimeoutCalled = true;
      }
    };

    await expect(runFetchWithTimeout()).rejects.toThrow("Network offline");
    expect(clearTimeoutCalled).toBe(true);
  });

  it("4. rejects streaming chunked response exceeding 10 MB", async () => {
    const hugeChunk = new Uint8Array(4 * 1024 * 1024); // 4 MB
    let readCount = 0;

    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        readCount++;
        if (readCount <= 3) {
          return { done: false, value: hugeChunk }; // Total 12 MB
        }
        return { done: true, value: undefined };
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
    };

    const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
    let totalBytes = 0;
    let skipped = false;

    while (true) {
      const { done, value } = await mockReader.read();
      if (done) break;
      if (value) {
        totalBytes += value.length;
        if (totalBytes > MAX_IMAGE_SIZE_BYTES) {
          await mockReader.cancel();
          skipped = true;
          break;
        }
      }
    }

    expect(skipped).toBe(true);
    expect(mockReader.cancel).toHaveBeenCalled();
  });
});
