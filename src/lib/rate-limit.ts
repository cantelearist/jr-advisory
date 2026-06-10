/* ── Rate Limiter — in-memory sliding window ──
 *
 * Provides per-IP rate limiting for auth-sensitive routes.
 * Uses an in-memory Map, which resets on cold starts (Vercel serverless).
 * This is acceptable for MVP — catches brute-force within an instance lifetime.
 * For production hardening, swap to Redis/Upstash.
 *
 * Usage:
 *   const result = checkRateLimit(ip, 'login', { windowMs: 900_000, maxAttempts: 5 });
 *   if (!result.allowed) return NextResponse.json({ error: result.message }, { status: 429 });
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  /** Window duration in milliseconds (default: 15 minutes) */
  windowMs?: number;
  /** Max attempts within the window (default: 5) */
  maxAttempts?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  message?: string;
}

// Separate stores per route category to avoid cross-contamination
const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(category: string): Map<string, RateLimitEntry> {
  let store = stores.get(category);
  if (!store) {
    store = new Map();
    stores.set(category, store);
  }
  return store;
}

/**
 * Check if a request is within rate limits.
 *
 * @param identifier - Usually the client IP address
 * @param category   - Route category: 'login', 'forgot-password', 'reset-password', 'invite', 'messages-read'
 * @param config     - Optional overrides for window/max
 */
export function checkRateLimit(
  identifier: string,
  category: string,
  config?: RateLimitConfig,
): RateLimitResult {
  const windowMs = config?.windowMs ?? 15 * 60 * 1000; // 15 minutes
  const maxAttempts = config?.maxAttempts ?? 5;
  const now = Date.now();
  const windowStart = now - windowMs;

  const store = getStore(category);
  const entry = store.get(identifier);

  if (!entry) {
    store.set(identifier, { timestamps: [now] });
    return { allowed: true, remaining: maxAttempts - 1, resetMs: windowMs };
  }

  // Prune old entries
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= maxAttempts) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      message: `Too many attempts. Try again in ${Math.ceil(resetMs / 60_000)} minutes.`,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxAttempts - entry.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Extract client IP from a Next.js request.
 * Checks x-forwarded-for (Vercel), then x-real-ip, then falls back to 'unknown'.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

/* ── Default configs per route category ── */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 min */
  login: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },
  /** Forgot password: 3 attempts per 15 min (prevent email enumeration) */
  'forgot-password': { windowMs: 15 * 60 * 1000, maxAttempts: 3 },
  /** Reset password: 5 attempts per 15 min */
  'reset-password': { windowMs: 15 * 60 * 1000, maxAttempts: 5 },
  /** Invite: 10 invites per 15 min (admin-only, higher limit) */
  invite: { windowMs: 15 * 60 * 1000, maxAttempts: 10 },
  /** Messages read: 30 per minute (normal usage is high) */
  'messages-read': { windowMs: 60 * 1000, maxAttempts: 30 },
} as const;

/**
 * Periodic cleanup of expired entries. Call on a timer or per-request.
 * Not strictly required — entries are pruned on access — but prevents
 * memory growth if many unique IPs hit the server.
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      // Remove entries older than 30 minutes (2x the max window)
      entry.timestamps = entry.timestamps.filter((t) => t > now - 30 * 60 * 1000);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }
}
