/**
 * Shared In-Memory Rate Limiter for Public API Endpoints & Forms
 */

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const stores = new Map<string, Map<string, RateLimitRecord>>();

export type RateLimitOptions = {
  windowMs?: number; // Time window in milliseconds (default 60,000ms = 1 min)
  maxRequests?: number; // Maximum requests allowed per window (default 10)
};

/**
 * Checks rate limit for a specific key (e.g. endpoint name) and client identifier (e.g. IP address).
 * Returns true if request is ALLOWED, false if RATE LIMITED.
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 10;
  const now = Date.now();

  if (!stores.has(namespace)) {
    stores.clear(); // Periodic cleanup of old namespaces if any
    stores.set(namespace, new Map());
  }

  const store = stores.get(namespace)!;
  const current = store.get(identifier);

  if (!current || now > current.resetTime) {
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count += 1;
  return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime };
}

/**
 * Extracts client IP from request headers safely
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}
