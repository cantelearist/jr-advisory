/* ── Shared API Error Helpers — P5: Error Handling & Logging ──
 *
 * Centralises 500-response generation so that:
 *  1. Internal error details (Supabase messages, Stripe details, storage paths)
 *     are NEVER returned to the client.
 *  2. Every error is logged server-side with a short correlation ID that
 *     the client can quote when reporting an issue.
 *  3. X-Request-ID headers are consistently set on responses.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Generate a short 8-char correlation ID for log/response pairing.
 */
function makeRequestId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

/**
 * Return a sanitised 500 response.
 *
 * - Logs the real error to stderr with a correlation ID (visible in Vercel logs).
 * - Returns only a generic message + the correlation ID to the client.
 *
 * Usage:
 *   } catch (e: unknown) {
 *     return internalError(e, 'documents/upload');
 *   }
 */
export function internalError(e: unknown, context: string): NextResponse {
  const requestId = makeRequestId();
  // Log full error server-side — never sent to client
  console.error(`[${requestId}] ${context}:`, e instanceof Error ? e.stack ?? e.message : String(e));
  return NextResponse.json(
    { error: 'Internal server error', requestId },
    {
      status: 500,
      headers: { 'X-Request-ID': requestId },
    },
  );
}

/**
 * Return a sanitised error for a known Supabase/library operation failure
 * that should be 500 rather than 400.
 * Same semantics as internalError but accepts a named operation for logging.
 */
export function operationError(
  error: { message: string } | null | undefined,
  context: string,
): NextResponse {
  return internalError(error ?? new Error('Unknown operation error'), context);
}
