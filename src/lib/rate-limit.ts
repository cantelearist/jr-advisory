/* ── Simple in-memory rate limiter for API routes ── */
/* Not shared across Vercel instances — best-effort protection. */
/* For production: consider Upstash Redis rate limiting. */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/* Clean up expired entries periodically */
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // cleanup at most once/minute
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc).
 * Returns { allowed, remaining, resetAt }.
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { max: 60, windowSeconds: 60 }
): RateLimitResult {
  cleanup();
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  entry.count++;
  if (entry.count > config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers (Vercel / Cloudflare / fallback).
 */
export function getClientIP(req: Request): string {
  const headers = req.headers;
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
