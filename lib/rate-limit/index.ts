import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash's REST-based Redis client works from the Edge runtime, unlike
 * ioredis (TCP), which is why rate limiting uses a separate client from
 * services/redis (general app caching, Node runtime only). Both point at
 * the same logical Redis instance in production if you're using Upstash
 * for everything; only the transport differs.
 */
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

function buildLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null; // local dev without Upstash configured: no-op
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}

/** Login attempts: 10 per 5 minutes per IP+email combo — generous enough
 *  for typos, tight enough to blunt credential stuffing. */
export const loginRateLimiter = buildLimiter(10, "5 m");

/** Password reset / verification email requests: 3 per 15 minutes per
 *  email, to stop mailbox-bombing. */
export const emailRequestRateLimiter = buildLimiter(3, "15 m");

/** 2FA code attempts: 5 per 5 minutes per ticket, then the ticket is
 *  invalidated regardless of expiry. */
export const twoFactorRateLimiter = buildLimiter(5, "5 m");

/** General API/mutation rate limit for authenticated write actions. */
export const mutationRateLimiter = buildLimiter(30, "1 m");

export async function checkRateLimit(limiter: Ratelimit | null, identifier: string) {
  if (!limiter) return { success: true, remaining: Infinity };
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
