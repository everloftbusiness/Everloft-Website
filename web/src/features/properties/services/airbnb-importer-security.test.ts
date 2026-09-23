import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseAirbnbListing } from "./airbnb-importer.service";

afterEach(() => vi.unstubAllGlobals());

describe("Airbnb listing URL validation", () => {
  it("rejects an unrelated host without issuing a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(parseAirbnbListing("https://example.test/rooms/123456")).rejects.toThrow("Airbnb listing link");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an insecure Airbnb URL without issuing a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(parseAirbnbListing("http://www.airbnb.com/rooms/123456")).rejects.toThrow("HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not follow a short-link redirect to a private address", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 302,
      headers: new Headers({ location: "http://127.0.0.1/private" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(parseAirbnbListing("https://abnb.me/example")).rejects.toThrow("Invalid Airbnb listing URL");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
