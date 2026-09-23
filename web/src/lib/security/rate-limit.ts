import crypto from "crypto";
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
 * Returns a keyed HMAC hash of the client identifier (e.g. IP address)
 * using a server-side salt so raw IP addresses are never persisted in the database.
 */
export function hashClientIdentifier(identifier: string): string {
  const salt =
    process.env.RATE_LIMIT_SALT ||
    process.env.SUPABASE_SECRET_KEY ||
    "everloft-rate-limit-default-salt";
  return crypto.createHmac("sha256", salt).update(identifier.trim()).digest("hex");
}

/**
 * Atomic Durable Rate Limiter for Vercel Serverless environment.
 * Executes atomic check_rate_limit RPC in Supabase Postgres.
 * Fails closed in production environments if the database is unavailable.
 */
export async function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 10;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const now = Date.now();
  const resetTime = now + windowMs;

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  // Use hashed identifier for privacy preservation
  const hashedId = hashClientIdentifier(identifier);
  const compositeKey = `${namespace}:${hashedId}`;

  // 1. Try Supabase Atomic Postgres RPC if configured
  if (process.env.SUPABASE_SECRET_KEY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createAdminClient() as any;
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_key: compositeKey,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
      });

      if (error) {
        throw error;
      }

      if (data && typeof data === "object") {
        return {
          allowed: Boolean(data.allowed),
          remaining: Number(data.remaining ?? 0),
          resetTime: Number(data.reset_time ?? resetTime),
        };
      }
    } catch (err) {
      if (isProduction) {
        console.error(
          "Durable rate limiter database failure in production:",
          err instanceof Error ? err.message : "RPC Error"
        );
        // Fail closed in production to prevent serverless abuse on DB degradation
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + 60_000,
        };
      }
      // Non-production fallback to memory store
    }
  } else if (isProduction) {
    console.error("Durable rate limiter: SUPABASE_SECRET_KEY missing in production.");
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + 60_000,
    };
  }

  // 2. In-Memory Store Fallback (used in local development and unit tests)
  if (!memoryStores.has(namespace)) {
    memoryStores.set(namespace, new Map());
  }

  const store = memoryStores.get(namespace)!;
  const current = store.get(hashedId);

  if (!current || now > current.resetTime) {
    store.set(hashedId, { count: 1, resetTime });
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
