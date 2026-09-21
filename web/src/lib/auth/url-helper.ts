/**
 * Trusted URL & Redirect Helper for Everloft Authentication Flows
 *
 * Enforces production, preview, and local development origin rules,
 * prevents open-redirect vulnerabilities, and rejects unsafe host headers.
 *
 * SUPABASE PREVIEW LIMITATION DOCUMENTATION:
 * Supabase Auth Redirect Allowlist does not support wildcard subdomains for arbitrary Vercel preview URLs
 * (`https://everloft-website-git-*.vercel.app/**`). For Vercel Preview environments, email reset and login
 * callback links fall back to canonical `https://www.everloft.co.in` or the primary static preview domain
 * (`https://everloft-website.vercel.app`) configured in the Supabase Redirect Allowlist.
 */

const PRODUCTION_ORIGIN = "https://www.everloft.co.in";
const LOCAL_DEV_ORIGIN = "http://localhost:3000";

/**
 * Returns the trusted site base URL based on execution environment.
 * - Local Development (NODE_ENV === 'development'): http://localhost:3000
 * - Explicit NEXT_PUBLIC_SITE_URL if configured
 * - Vercel Preview / Production (VERCEL_URL / production fallback)
 */
export function getCanonicalSiteUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return LOCAL_DEV_ORIGIN;
  }

  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (publicSiteUrl && publicSiteUrl.trim()) {
    return publicSiteUrl.trim().replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim()) {
    const vercelHost = process.env.VERCEL_URL.trim().replace(/\/$/, "");
    return vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
  }

  return PRODUCTION_ORIGIN;
}

/**
 * Sanitizes a redirect path parameter to prevent Open Redirect vulnerabilities.
 * Permits relative internal paths starting with '/' (e.g. '/dashboard', '/reset-password').
 * Rejects double-slashes ('//evil.com'), backslashes ('/\\evil.com'), and absolute URIs ('https://...').
 */
export function sanitizeRedirectPath(rawPath: string | null | undefined, fallbackPath = "/dashboard"): string {
  if (!rawPath || typeof rawPath !== "string") {
    return fallbackPath;
  }

  const trimmed = rawPath.trim();

  // Must start with '/' but NOT '//' or '/\' and contain no protocol schemes
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("://") &&
    !trimmed.includes("\r") &&
    !trimmed.includes("\n")
  ) {
    return trimmed;
  }

  return fallbackPath;
}

/**
 * Constructs a fully qualified, sanitized redirect URL for authentication flows.
 */
export function buildAuthRedirectUrl(path: string): string {
  const baseUrl = getCanonicalSiteUrl();
  const safePath = sanitizeRedirectPath(path);
  return `${baseUrl}${safePath}`;
}
