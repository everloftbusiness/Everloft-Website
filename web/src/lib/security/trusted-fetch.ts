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
    // Keep this validation immediately adjacent to the network sink. Besides
    // making every redirect hop independently fail closed, the explicit URL
    // component checks allow security scanners to verify that caller input
    // cannot control the scheme or authority used by fetch().
    const hostname = url.hostname.toLowerCase();
    const trustedHostname = Array.from(allowedHosts).find(
      (candidate) => candidate.toLowerCase() === hostname
    );
    if (
      url.protocol !== "https:" ||
      !trustedHostname ||
      Boolean(url.username) ||
      Boolean(url.password) ||
      Boolean(url.port)
    ) {
      throw new Error("Untrusted external URL.");
    }

    // Rebuild the request URL with the server-owned allow-list value. The
    // caller may choose a path/query on an approved service, but it can never
    // supply the authority sent over the network.
    const requestUrl = new URL(`https://${trustedHostname}/`);
    requestUrl.pathname = url.pathname;
    requestUrl.search = url.search;

    const response = await fetch(requestUrl, { ...init, redirect: "manual" });
    if (response.status < 300 || response.status >= 400) {
      return { response, url: requestUrl.toString() };
    }

    const location = response.headers.get("location");
    if (!location) throw new Error("External redirect has no location.");
    url = new URL(location, requestUrl);
  }

  throw new Error("Too many external redirects.");
}
