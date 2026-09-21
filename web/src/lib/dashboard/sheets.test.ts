import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchSheetData } from "./sheets";

describe("Hardened Google Sheet Fetch Path", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("1. rejects request with timeout error when fetch exceeds 10 seconds", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          const err = new Error("The operation was aborted.");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const promise = fetchSheetData("Pinnacle Income", "mock-sheet-id");
    vi.advanceTimersByTime(10001);
    await expect(promise).rejects.toThrow("Google Sheet request timed out after 10 seconds.");
  });

  it("2. rejects response with Content-Length header > 5 MB", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-length": String(6 * 1024 * 1024) }),
      text: async () => "",
    });

    await expect(fetchSheetData("Pinnacle Income", "mock-sheet-id")).rejects.toThrow(
      "Google Sheet response size exceeded maximum allowed limit of 5MB."
    );
  });

  it("3. rejects streaming chunked response when total bytes exceed 5 MB", async () => {
    const hugeChunk = new Uint8Array(2 * 1024 * 1024); // 2 MB
    let chunkCount = 0;

    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        chunkCount++;
        if (chunkCount <= 4) {
          return { done: false, value: hugeChunk }; // Total 8 MB
        }
        return { done: true, value: undefined };
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      body: { getReader: () => mockReader },
      text: async () => "",
    });

    await expect(fetchSheetData("Pinnacle Income", "mock-sheet-id")).rejects.toThrow(
      "Google Sheet response size exceeded maximum allowed limit of 5MB."
    );
    expect(mockReader.cancel).toHaveBeenCalled();
  });

  it("4. rejects malformed payload structure with sanitized error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: async () => "NOT_JSON_OR_GVIZ_FORMAT",
    });

    await expect(fetchSheetData("Pinnacle Income", "mock-sheet-id")).rejects.toThrow(
      "Failed to parse Google Sheet data payload structure."
    );
  });

  it("5. successfully parses valid Google Sheet JSON response", async () => {
    const mockJson = `/*O_o*/\ngoog.visualization.Query.setResponse({"status":"ok","table":{"cols":[{"id":"A","label":"Guest Name"},{"id":"B","label":"Amount"}],"rows":[{"c":[{"v":"John Doe"},{"v":1500}]}]}});`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: async () => mockJson,
    });

    const rows = await fetchSheetData("Pinnacle Income", "mock-sheet-id");
    expect(rows.length).toBe(1);
    expect(rows[0]["Guest Name"]).toBe("John Doe");
    expect(rows[0]["Amount"]).toBe(1500);
  });
});
