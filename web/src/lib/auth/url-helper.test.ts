import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCanonicalSiteUrl, sanitizeRedirectPath, buildAuthRedirectUrl } from "./url-helper";

describe("URL Helper & Redirect Sanitizer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getCanonicalSiteUrl", () => {
    it("returns http://localhost:3000 in development mode", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });
      expect(getCanonicalSiteUrl()).toBe("http://localhost:3000");
    });

    it("returns NEXT_PUBLIC_SITE_URL if defined in non-dev environments", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });
      process.env.NEXT_PUBLIC_SITE_URL = "https://www.everloft.co.in";
      expect(getCanonicalSiteUrl()).toBe("https://www.everloft.co.in");
    });

    it("constructs https URL from VERCEL_URL if NEXT_PUBLIC_SITE_URL is missing", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_URL = "everloft-website-preview.vercel.app";
      expect(getCanonicalSiteUrl()).toBe("https://everloft-website-preview.vercel.app");
    });

    it("falls back to production origin if no environment overrides exist", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_URL;
      expect(getCanonicalSiteUrl()).toBe("https://www.everloft.co.in");
    });
  });

  describe("sanitizeRedirectPath", () => {
    it("allows valid relative paths", () => {
      expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
      expect(sanitizeRedirectPath("/properties/villa-zephyr")).toBe("/properties/villa-zephyr");
      expect(sanitizeRedirectPath("/reset-password?token=abc")).toBe("/reset-password?token=abc");
    });

    it("rejects open-redirect protocol relative URLs starting with //", () => {
      expect(sanitizeRedirectPath("//evil.com")).toBe("/dashboard");
      expect(sanitizeRedirectPath("//evil.com/phishing")).toBe("/dashboard");
    });

    it("rejects backslash open-redirect attempts", () => {
      expect(sanitizeRedirectPath("/\\evil.com")).toBe("/dashboard");
    });

    it("rejects absolute URIs with protocols", () => {
      expect(sanitizeRedirectPath("https://evil.com")).toBe("/dashboard");
      expect(sanitizeRedirectPath("http://evil.com/login")).toBe("/dashboard");
      expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
    });

    it("uses specified fallback path when raw path is invalid", () => {
      expect(sanitizeRedirectPath(null, "/custom-fallback")).toBe("/custom-fallback");
      expect(sanitizeRedirectPath("//attacker.com", "/custom-fallback")).toBe("/custom-fallback");
    });
  });

  describe("buildAuthRedirectUrl", () => {
    it("combines canonical origin and sanitized path", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });
      expect(buildAuthRedirectUrl("/reset-password")).toBe("http://localhost:3000/reset-password");
    });

    it("sanitizes malicious paths during construction", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });
      expect(buildAuthRedirectUrl("//attacker.com")).toBe("http://localhost:3000/dashboard");
    });
  });
});
