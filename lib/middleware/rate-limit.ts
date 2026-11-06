import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, use Redis-based solution (e.g., @upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

/**
 * Default rate limits for different endpoint types
 */
export const RATE_LIMITS = {
  // Gemini API calls — see lib/ai/gemini-rate-limit.ts for shared AI limits
  GEMINI: { maxRequests: 4, windowMs: 60 * 1000 },
  
  // File uploads
  UPLOAD: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 uploads per minute
  
  // Payment endpoints
  PAYMENT: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  
  // Authentication endpoints
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  
  // General API endpoints
  DEFAULT: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  
  // Read-only endpoints (more lenient)
  READ: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
} as const;

/**
 * Rate limit middleware
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @param identifier - Unique identifier for rate limiting (defaults to IP address)
 * @returns Response with rate limit headers if exceeded, null if allowed
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): NextResponse | null {
  // Get identifier (IP address or custom)
  const id = identifier || getClientIdentifier(request);
  
  // Clean up expired entries periodically (every 100 requests)
  if (rateLimitStore.size > 1000) {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  const now = Date.now();
  const entry = rateLimitStore.get(id);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    rateLimitStore.set(id, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null; // Allowed
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again in ${retryAfter} second(s).`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      }
    );
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(id, entry);
  
  return null; // Allowed
}

/**
 * Get client identifier from request
 * Uses IP address, or user ID if available
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
  
  return ip;
}

/**
 * Rate limit middleware with user ID
 * More accurate for authenticated requests
 */
export function rateLimitByUser(
  request: NextRequest,
  config: RateLimitConfig,
  userId: string
): NextResponse | null {
  return rateLimit(request, config, `user:${userId}`);
}

/**
 * Helper to apply rate limiting in API routes
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.GEMINI);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // Continue with request...
 * }
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): NextResponse | null {
  if (userId) {
    return rateLimitByUser(request, config, userId);
  }
  return rateLimit(request, config);
}
