/**
 * Pending (unverified) registration store.
 *
 * When a student submits the signup form we do NOT create an account. Instead
 * we stash their profile fields + a hashed OTP here (pendingRegistrations/{email}).
 * The real Firebase Auth account + Firestore profile are created only after the
 * code is verified. The password is never stored — the client re-sends it on the
 * verify step.
 */
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import {
  OTP_TTL_MS,
  MAX_ATTEMPTS,
  evaluateSendThrottle,
  generateOtpCode,
  hashOtp,
  safeEqualHex,
} from "./otp";

const COLLECTION = "pendingRegistrations";

export interface PendingProfile {
  name: string;
  username: string;
  usernameLower: string;
  email: string;
  sapId: string;
  program: string;
  branch: string;
  year: string;
  phone: string | null;
}

export type StartPendingResult =
  | { ok: true; code: string }
  | { ok: false; reason: "cooldown" | "rate-limited"; retryAfter: number };

/** Creates or refreshes the pending registration and returns a fresh OTP. */
export async function upsertPendingRegistration(
  db: Firestore,
  emailKey: string,
  profile: PendingProfile
): Promise<StartPendingResult> {
  const ref = db.collection(COLLECTION).doc(emailKey);
  const snap = await ref.get();
  const now = Date.now();

  const throttle = evaluateSendThrottle(snap.exists ? snap.data() : undefined, now);
  if (throttle.blocked) {
    return { ok: false, reason: throttle.reason, retryAfter: throttle.retryAfter };
  }

  const code = generateOtpCode();
  await ref.set(
    {
      profile,
      codeHash: hashOtp(emailKey, code),
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

export type VerifyPendingResult =
  | { status: "success"; profile: PendingProfile }
  | { status: "no-code" | "expired" | "invalid" | "too-many-attempts" };

/**
 * Verifies a submitted code against the pending registration. On success the
 * profile is returned but the doc is intentionally NOT deleted here — the caller
 * deletes it only after the account is successfully created.
 */
export async function verifyPendingOtp(
  db: Firestore,
  emailKey: string,
  code: string
): Promise<VerifyPendingResult> {
  const ref = db.collection(COLLECTION).doc(emailKey);

  return db.runTransaction<VerifyPendingResult>(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { status: "no-code" };

    const data = snap.data() || {};
    const now = Date.now();
    const attempts: number = data.attempts ?? 0;

    if (attempts >= MAX_ATTEMPTS) return { status: "too-many-attempts" };
    if (now > (data.expiresAt?.toMillis?.() ?? 0)) return { status: "expired" };

    const matches = typeof data.codeHash === "string" && safeEqualHex(data.codeHash, hashOtp(emailKey, code));
    if (!matches) {
      tx.update(ref, { attempts: attempts + 1 });
      return { status: "invalid" };
    }

    return { status: "success", profile: data.profile as PendingProfile };
  });
}

export function pendingRegistrationRef(db: Firestore, emailKey: string) {
  return db.collection(COLLECTION).doc(emailKey);
}
