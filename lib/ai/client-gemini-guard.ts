import { formatAiBusyMessage } from "./gemini-rate-limit";

const WINDOW_MS = 60 * 1000;
const MAX_PER_USER = 2;

interface GuardEntry {
  count: number;
  resetTime: number;
}

const clientStore = new Map<string, GuardEntry>();

export type ClientGeminiGuardResult =
  | { ok: true }
  | { ok: false; message: string; retryAfter: number };

/**
 * Client-side per-user throttle for browser-direct Gemini calls
 * (timetable extraction). Server routes have their own limits.
 */
export function guardClientGeminiUse(userId?: string): ClientGeminiGuardResult {
  const id = userId ? `user:${userId}` : "anonymous";
  const now = Date.now();
  const entry = clientStore.get(id);

  if (!entry || entry.resetTime < now) {
    clientStore.set(id, { count: 1, resetTime: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= MAX_PER_USER) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return { ok: false, message: formatAiBusyMessage(retryAfter), retryAfter };
  }

  entry.count++;
  clientStore.set(id, entry);
  return { ok: true };
}

export function isGeminiQuotaErrorMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("overloaded") ||
    msg.includes("ai_busy") ||
    msg.includes("ai is busy")
  );
}

/** Turn API / Gemini errors into a user-friendly chat message. */
export function getFriendlyAiError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (typeof error === "object" && error !== null) {
    const obj = error as { message?: string; error?: string; retryAfter?: number };
    if (obj.error === "ai_busy" || obj.message?.includes("AI is busy")) {
      return obj.message || formatAiBusyMessage(obj.retryAfter);
    }
    if (obj.message && isGeminiQuotaErrorMessage(obj.message)) {
      return formatAiBusyMessage(obj.retryAfter ?? 60);
    }
    if (obj.message) return obj.message;
    if (obj.error) return obj.error;
  }
  if (error instanceof Error) {
    if (isGeminiQuotaErrorMessage(error.message)) {
      return formatAiBusyMessage(60);
    }
    return error.message;
  }
  return fallback;
}

/** Parse a failed fetch response from an AI API route. */
export async function parseAiApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (response.status === 429) {
      return data.message || formatAiBusyMessage(data.retryAfter);
    }
    return getFriendlyAiError(data);
  } catch {
    if (response.status === 429) {
      return formatAiBusyMessage(30);
    }
    return `Request failed (${response.status}). Please try again.`;
  }
}
