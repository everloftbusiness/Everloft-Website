export function isTrustedHttpsUrl(input: string, allowedHosts: ReadonlySet<string>): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase()) &&
      !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

/** Fetch only HTTPS URLs on an explicit host allowlist, including redirect hops. */
export async function fetchTrustedUrl(
  input: string,
  allowedHosts: ReadonlySet<string>,
  init: RequestInit = {},
  maxRedirects = 4
): Promise<{ response: Response; url: string }> {
  let url = new URL(input);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    if (!isTrustedHttpsUrl(url.toString(), allowedHosts)) {
      throw new Error("Untrusted external URL.");
    }

    const response = await fetch(url.toString(), { ...init, redirect: "manual" });
    if (response.status < 300 || response.status >= 400) {
      return { response, url: url.toString() };
    }

    const location = response.headers.get("location");
    if (!location) throw new Error("External redirect has no location.");
    url = new URL(location, url);
  }

  throw new Error("Too many external redirects.");
}
