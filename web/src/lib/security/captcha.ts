/**
 * Server-side CAPTCHA / Cloudflare Turnstile Verification Utility
 * Fails closed in production environments or when TURNSTILE_SECRET_KEY is configured.
 */

export type TurnstileVerifyOptions = {
  action?: string;
  request?: Request;
};

export async function verifyCaptchaToken(
  token?: string | null,
  options: TurnstileVerifyOptions = {}
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  // In test environment without explicit turnstile key, allow for unit test runners
  if (process.env.NODE_ENV === "test" && !secretKey) {
    return true;
  }

  // Fail closed in production or whenever secret key is present
  if (!secretKey) {
    if (isProduction) {
      console.error("CAPTCHA verification failed: TURNSTILE_SECRET_KEY missing in Production.");
      return false;
    }
    return true; // Local dev fallback when Turnstile is unconfigured
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());

    if (options.request) {
      const xff = options.request.headers.get("x-forwarded-for");
      if (xff) {
        const remoteIp = xff.split(",")[0].trim();
        formData.append("remoteip", remoteIp);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const outcome = (await res.json()) as {
      success: boolean;
      hostname?: string;
      action?: string;
      "error-codes"?: string[];
    };

    if (!outcome.success) return false;

    // Validate action if requested
    if (options.action && outcome.action && outcome.action !== options.action) {
      console.warn(`Turnstile action mismatch: expected ${options.action}, got ${outcome.action}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Turnstile verification error:", err instanceof Error ? err.message : "Fetch error");
    return false;
  }
}
