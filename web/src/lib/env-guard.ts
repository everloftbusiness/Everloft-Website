/**
 * Environment Guard Utility for Vercel Deployment Hardening & Safety Controls
 * Fails closed on unknown, malformed, or missing environment configurations.
 */

export type VercelEnvType = "production" | "preview" | "development" | "test" | "local" | "unknown";

export function getVercelEnv(): VercelEnvType {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "development") return "development";
  if (process.env.NODE_ENV === "test") return "test";
  if (process.env.NODE_ENV === "development" && !vercelEnv) return "local";
  return "unknown";
}

export function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function isPreviewEnv(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function isLocalEnv(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL_ENV;
}

export function isTestEnv(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Returns false if background execution should be blocked.
 * Precedence Rules (Fail Closed):
 * 1. DISABLE_BACKGROUND_JOBS=true or 1: ALWAYS DENY.
 * 2. VERCEL_ENV=preview: ALWAYS DENY (protects staging/preview deployments).
 * 3. VERCEL_ENV=production: ALLOW (subject to server authentication/cron secret checks).
 * 4. NODE_ENV=development or test (without VERCEL_ENV): ALLOW (for local dev and automated tests).
 * 5. NODE_ENV=production with missing/unknown VERCEL_ENV: FAIL CLOSED (DENY).
 * 6. Request parameters/headers: NEVER CAN OVERRIDE THIS DECISION.
 */
export function isBackgroundJobAllowed(jobName?: string): boolean {
  // 1. Explicit Disable Flag (highest precedence)
  const disableFlag = process.env.DISABLE_BACKGROUND_JOBS;
  if (disableFlag === "true" || disableFlag === "1") {
    if (jobName) console.warn(`[EnvGuard] ${jobName} blocked: DISABLE_BACKGROUND_JOBS is active.`);
    return false;
  }

  // 2. Vercel Preview Protection
  if (process.env.VERCEL_ENV === "preview") {
    if (jobName) console.warn(`[EnvGuard] ${jobName} blocked: Execution in Vercel Preview environment.`);
    return false;
  }

  // 3. Vercel Production Mode
  if (process.env.VERCEL_ENV === "production") {
    return true;
  }

  // 4. Local Development & Automated Test Environment
  if (!process.env.VERCEL_ENV && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")) {
    return true;
  }

  // 5. Fail Closed: Unknown VERCEL_ENV or NODE_ENV=production without explicit VERCEL_ENV
  if (jobName) {
    console.warn(`[EnvGuard] ${jobName} blocked: Unknown or unverified environment state (VERCEL_ENV=${process.env.VERCEL_ENV}, NODE_ENV=${process.env.NODE_ENV}).`);
  }
  return false;
}

export function getEnvironmentSummary() {
  return {
    vercelEnv: getVercelEnv(),
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: isProductionEnv(),
    isPreview: isPreviewEnv(),
    isLocal: isLocalEnv(),
    isTest: isTestEnv(),
    backgroundJobsAllowed: isBackgroundJobAllowed(),
  };
}
