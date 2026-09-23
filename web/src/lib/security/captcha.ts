/**
 * Server-side CAPTCHA / Cloudflare Turnstile Verification Utility
 * Fails closed in production environments or when TURNSTILE_SECRET_KEY is configured.
 */

export type TurnstileVerifyOptions = {
  action?: string;
  expectedHostname?: string;
  request?: Request;
};

type TurnstileSiteVerifyResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
  challenge_ts?: string;
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

  if (!token || typeof token !== "string" || !token.trim() || token.length > 2048) {
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

    const outcome = (await res.json()) as TurnstileSiteVerifyResponse;

    if (!outcome.success) {
      return false;
    }

    // Strict action validation: if expected action is configured, missing or mismatched action must fail
    if (options.action) {
      if (!outcome.action || outcome.action !== options.action) {
        return false;
      }
    }

    // Hostname validation
    if (options.expectedHostname) {
      if (!outcome.hostname || outcome.hostname.toLowerCase() !== options.expectedHostname.toLowerCase()) {
        return false;
      }
    }

    return true;
  } catch {
    // Fail closed without leaking internals, tokens, or PII
    return false;
  }
}
