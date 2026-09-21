import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateFileSize, BUCKETS } from "./r2";

describe("Cloudflare R2 Storage Guard & Validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("validates file sizes within allowed thresholds", () => {
    expect(() => validateFileSize(BUCKETS.propertyImages, 10 * 1024 * 1024)).not.toThrow();
  });

  it("rejects file sizes exceeding bucket limits", () => {
    expect(() => validateFileSize(BUCKETS.avatars, 10 * 1024 * 1024)).toThrow("File exceeds the 5MB limit for avatars.");
  });
});
