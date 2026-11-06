import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, type RateLimitConfig } from "@/lib/middleware/rate-limit";

/** Stay under Google's free-tier ~5 RPM for the whole app. */
export const GEMINI_GLOBAL_LIMIT: RateLimitConfig = {
  maxRequests: 4,
  windowMs: 60 * 1000,
};

/** Per-student cap so one user cannot burn the shared quota. */
export const GEMINI_USER_LIMIT: RateLimitConfig = {
  maxRequests: 2,
  windowMs: 60 * 1000,
};

export function formatAiBusyMessage(retryAfter = 30): string {
  return `AI is busy right now — CampusIQ is on the free beta plan (limited requests per minute). Please wait about ${retryAfter} seconds and try again.`;
}

export function aiRateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: "ai_busy",
      message: formatAiBusyMessage(retryAfter),
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

function retryAfterFromResponse(response: NextResponse): number {
  const header = response.headers.get("Retry-After");
  const parsed = header ? parseInt(header, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

/**
 * Apply shared + per-user Gemini limits before calling the API.
 * Call this at the start of every server route that uses Gemini.
 */
export function applyGeminiRateLimits(
  request: NextRequest,
  userId?: string
): NextResponse | null {
  const globalBlock = applyRateLimit(request, GEMINI_GLOBAL_LIMIT, "gemini:global");
  if (globalBlock) {
    return aiRateLimitResponse(retryAfterFromResponse(globalBlock));
  }

  if (userId) {
    const userBlock = applyRateLimit(request, GEMINI_USER_LIMIT, `gemini:user:${userId}`);
    if (userBlock) {
      return aiRateLimitResponse(retryAfterFromResponse(userBlock));
    }
  }

  return null;
}

export function isGeminiQuotaError(error: unknown): boolean {
  const msg = ((error as Error)?.message || String(error)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("overloaded")
  );
}

export function geminiApiErrorResponse(error: unknown): NextResponse {
  const retryAfter = isGeminiQuotaError(error) ? 60 : 0;
  if (isGeminiQuotaError(error)) {
    return aiRateLimitResponse(retryAfter);
  }
  return NextResponse.json(
    {
      error: (error as Error)?.message || "AI request failed",
      message: (error as Error)?.message || "AI request failed. Please try again.",
    },
    { status: 500 }
  );
}
