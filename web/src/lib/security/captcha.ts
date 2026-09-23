/**
 * Server-side CAPTCHA / Cloudflare Turnstile Verification Utility
 */

export async function verifyCaptchaToken(token?: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured or in automated test environment, bypass safely
  if (!secretKey || process.env.NODE_ENV === "test") {
    return true;
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) return false;
    const outcome = (await res.json()) as { success: boolean };
    return Boolean(outcome.success);
  } catch {
    return false;
  }
}
