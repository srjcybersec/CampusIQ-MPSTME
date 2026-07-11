/**
 * OTP primitives + email-verification helpers.
 *
 * Codes are 6 digits, stored only as a salted SHA-256 hash, short-lived, and
 * rate-limited. The low-level primitives (hash/throttle/generate) are reused by
 * the pending-registration flow; createOtp/verifyOtp operate on the
 * emailVerifications collection (used as a safety net for already-created
 * unverified accounts).
 */
import crypto from "crypto";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

export const OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
export const MAX_ATTEMPTS = 5; // wrong guesses before a new code is required
export const RESEND_COOLDOWN_MS = 60 * 1000; // min gap between sends
export const SEND_WINDOW_MS = 60 * 60 * 1000; // rolling window for the send cap
export const MAX_SENDS_PER_WINDOW = 6; // max codes emailed per window

export function hashOtp(id: string, code: string): string {
  const pepper = process.env.OTP_SECRET || "";
  return crypto.createHash("sha256").update(`${id}:${code}:${pepper}`).digest("hex");
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export type SendThrottle =
  | { blocked: false; windowStart: number; sendCount: number }
  | { blocked: true; reason: "cooldown" | "rate-limited"; retryAfter: number };

/** Enforces the resend cooldown and per-window send cap from an existing doc. */
export function evaluateSendThrottle(
  data: FirebaseFirestore.DocumentData | undefined,
  now: number
): SendThrottle {
  if (!data) return { blocked: false, windowStart: now, sendCount: 0 };

  const lastSentAt: number = data.lastSentAt?.toMillis?.() ?? 0;
  if (now - lastSentAt < RESEND_COOLDOWN_MS) {
    return {
      blocked: true,
      reason: "cooldown",
      retryAfter: Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000),
    };
  }

  let windowStart: number = data.windowStart?.toMillis?.() ?? now;
  let sendCount: number = data.sendCount ?? 0;

  if (now - windowStart >= SEND_WINDOW_MS) {
    windowStart = now;
    sendCount = 0;
  } else if (sendCount >= MAX_SENDS_PER_WINDOW) {
    return {
      blocked: true,
      reason: "rate-limited",
      retryAfter: Math.ceil((windowStart + SEND_WINDOW_MS - now) / 1000),
    };
  }

  return { blocked: false, windowStart, sendCount };
}

// ---------------------------------------------------------------------------
// emailVerifications flow (safety net for already-created unverified accounts)
// ---------------------------------------------------------------------------

const EV_COLLECTION = "emailVerifications";

export type CreateOtpResult =
  | { ok: true; code: string }
  | { ok: false; reason: "cooldown" | "rate-limited"; retryAfter: number };

export async function createOtp(db: Firestore, uid: string): Promise<CreateOtpResult> {
  const ref = db.collection(EV_COLLECTION).doc(uid);
  const snap = await ref.get();
  const now = Date.now();

  const throttle = evaluateSendThrottle(snap.exists ? snap.data() : undefined, now);
  if (throttle.blocked) {
    return { ok: false, reason: throttle.reason, retryAfter: throttle.retryAfter };
  }

  const code = generateOtpCode();
  await ref.set(
    {
      codeHash: hashOtp(uid, code),
      expiresAt: Timestamp.fromMillis(now + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: FieldValue.serverTimestamp(),
      windowStart: Timestamp.fromMillis(throttle.windowStart),
      sendCount: throttle.sendCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, code };
}

export type VerifyOtpResult =
  | "success"
  | "no-code"
  | "expired"
  | "invalid"
  | "too-many-attempts";

export async function verifyOtp(db: Firestore, uid: string, code: string): Promise<VerifyOtpResult> {
  const ref = db.collection(EV_COLLECTION).doc(uid);

  return db.runTransaction<VerifyOtpResult>(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return "no-code";

    const data = snap.data() || {};
    const now = Date.now();
    const attempts: number = data.attempts ?? 0;

    if (attempts >= MAX_ATTEMPTS) return "too-many-attempts";
    if (now > (data.expiresAt?.toMillis?.() ?? 0)) return "expired";

    const matches = typeof data.codeHash === "string" && safeEqualHex(data.codeHash, hashOtp(uid, code));
    if (!matches) {
      tx.update(ref, { attempts: attempts + 1 });
      return "invalid";
    }

    tx.delete(ref);
    return "success";
  });
}
