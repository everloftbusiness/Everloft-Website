import { createAdminClient } from "@/lib/supabase/admin";

type MemoryRecord = {
  count: number;
  resetTime: number;
};

const memoryStores = new Map<string, Map<string, MemoryRecord>>();

export type RateLimitOptions = {
  windowMs?: number; // Time window in milliseconds (default 60,000ms = 1 min)
  maxRequests?: number; // Maximum requests allowed per window (default 10)
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};

/**
 * Durable Rate Limiter for Vercel Serverless environment.
 * Uses Supabase DB when available, with in-memory fallback for tests/offline runs.
 */
export async function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 10;
  const now = Date.now();
  const resetTime = now + windowMs;

  // 1. Try Supabase DB Durable Rate Limit if SUPABASE_SECRET_KEY is configured
  if (process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createAdminClient() as any;
      const compositeKey = `${namespace}:${identifier}`;

      // Query durable rate limit table
      const { data: existing } = await supabase
        .from("rate_limits")
        .select("id, count, reset_at")
        .eq("key", compositeKey)
        .maybeSingle();

      if (existing) {
        const resetAtMs = new Date(existing.reset_at).getTime();
        if (now > resetAtMs) {
          // Window expired: reset count
          await supabase
            .from("rate_limits")
            .update({ count: 1, reset_at: new Date(resetTime).toISOString() })
            .eq("id", existing.id);

          return { allowed: true, remaining: maxRequests - 1, resetTime };
        }

        if (existing.count >= maxRequests) {
          return { allowed: false, remaining: 0, resetTime: resetAtMs };
        }

        // Increment count
        await supabase
          .from("rate_limits")
          .update({ count: existing.count + 1 })
          .eq("id", existing.id);

        return { allowed: true, remaining: maxRequests - (existing.count + 1), resetTime: resetAtMs };
      } else {
        // First request: insert record
        await supabase.from("rate_limits").insert({
          key: compositeKey,
          count: 1,
          reset_at: new Date(resetTime).toISOString(),
        });

        return { allowed: true, remaining: maxRequests - 1, resetTime };
      }
    } catch {
      // Fallback to memory store if DB table doesn't exist yet or connection fails
    }
  }

  // 2. In-Memory Store Fallback (Isolated per namespace)
  if (!memoryStores.has(namespace)) {
    memoryStores.set(namespace, new Map());
  }

  const store = memoryStores.get(namespace)!;
  const current = store.get(identifier);

  if (!current || now > current.resetTime) {
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
 * Resets memory store (used in test cleanup)
 */
export function resetMemoryRateLimits(): void {
  memoryStores.clear();
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
