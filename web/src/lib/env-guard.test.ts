import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isBackgroundJobAllowed,
  isPreviewEnv,
  isProductionEnv,
  getEnvironmentSummary,
} from "./env-guard";

describe("Environment Guard (Fail Closed Controls)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows background jobs in Vercel Production", () => {
    process.env.VERCEL_ENV = "production";
    expect(isProductionEnv()).toBe(true);
    expect(isBackgroundJobAllowed("Prod Job")).toBe(true);
  });

  it("denies background jobs in Vercel Preview", () => {
    process.env.VERCEL_ENV = "preview";
    expect(isPreviewEnv()).toBe(true);
    expect(isBackgroundJobAllowed("Preview Job")).toBe(false);
  });

  it("allows background jobs in Local Development", () => {
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(isBackgroundJobAllowed("Dev Job")).toBe(true);
  });

  it("allows background jobs in Automated Test environment", () => {
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    expect(isBackgroundJobAllowed("Test Job")).toBe(true);
  });

  it("denies background jobs when DISABLE_BACKGROUND_JOBS=true", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DISABLE_BACKGROUND_JOBS = "true";
    expect(isBackgroundJobAllowed("Disabled Job")).toBe(false);
  });

  it("denies background jobs when DISABLE_BACKGROUND_JOBS=1", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DISABLE_BACKGROUND_JOBS = "1";
    expect(isBackgroundJobAllowed("Disabled Job")).toBe(false);
  });

  it("fails closed (denies) when NODE_ENV=production but VERCEL_ENV is missing", () => {
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(isBackgroundJobAllowed("Missing Vercel Env Job")).toBe(false);
  });

  it("fails closed (denies) when VERCEL_ENV is an unknown/malformed string", () => {
    process.env.VERCEL_ENV = "custom_unrecognized_env";
    expect(isBackgroundJobAllowed("Unknown Env Job")).toBe(false);
  });

  it("ensures DISABLE_BACKGROUND_JOBS overrides production and development", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DISABLE_BACKGROUND_JOBS = "true";
    expect(isBackgroundJobAllowed("Override Job 1")).toBe(false);

    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.DISABLE_BACKGROUND_JOBS = "true";
    expect(isBackgroundJobAllowed("Override Job 2")).toBe(false);
  });

  it("returns accurate environment summary", () => {
    process.env.VERCEL_ENV = "preview";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const summary = getEnvironmentSummary();
    expect(summary.vercelEnv).toBe("preview");
    expect(summary.isPreview).toBe(true);
    expect(summary.isProduction).toBe(false);
    expect(summary.backgroundJobsAllowed).toBe(false);
  });
});
