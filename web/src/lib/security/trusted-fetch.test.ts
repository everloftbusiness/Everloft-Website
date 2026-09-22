import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTrustedUrl, isTrustedHttpsUrl } from "./trusted-fetch";

const allowed = new Set(["maps.app.goo.gl", "www.google.com"]);

afterEach(() => vi.unstubAllGlobals());

describe("trusted external fetch", () => {
  it("rejects spoofed hosts, credentials, non-HTTPS URLs, and custom ports", () => {
    for (const url of [
      "https://maps.app.goo.gl.evil.test/path",
      "https://evil.test/maps.app.goo.gl",
      "https://maps.app.goo.gl@evil.test/path",
      "http://maps.app.goo.gl/path",
      "https://maps.app.goo.gl:8443/path",
    ]) {
      expect(isTrustedHttpsUrl(url, allowed)).toBe(false);
    }
  });

  it("does not fetch an untrusted initial URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchTrustedUrl("https://evil.test/maps.app.goo.gl", allowed)).rejects.toThrow("Untrusted");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not follow a trusted host redirect to an untrusted host", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 302,
      headers: new Headers({ location: "http://169.254.169.254/latest/meta-data/" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchTrustedUrl("https://maps.app.goo.gl/abc", allowed)).rejects.toThrow("Untrusted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].redirect).toBe("manual");
  });

  it("resolves a redirect between trusted HTTPS hosts", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ status: 302, headers: new Headers({ location: "https://www.google.com/maps/@12.9716,77.5946" }) })
      .mockResolvedValueOnce({ status: 200, headers: new Headers() });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchTrustedUrl("https://maps.app.goo.gl/abc", allowed);
    expect(result.url).toBe("https://www.google.com/maps/@12.9716,77.5946");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
