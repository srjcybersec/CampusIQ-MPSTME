/**
 * Shared helpers for username / SAP ID reservation docs.
 *
 * Deleting a user in the Firebase Auth console does NOT remove these Firestore
 * docs, so a reservation may be "orphaned" (owner no longer exists). Those are
 * reclaimable; reservations owned by a live user are genuinely taken.
 */
import type { Auth } from "firebase-admin/auth";
import type { DocumentSnapshot } from "firebase-admin/firestore";

export type ReservationResult =
  | { state: "free"; uid: null }
  | { state: "stale"; uid: string | undefined }
  | { state: "taken"; uid: string };

export async function resolveReservation(
  auth: Auth,
  snap: DocumentSnapshot
): Promise<ReservationResult> {
  if (!snap.exists) return { state: "free", uid: null };

  const owner = snap.data()?.uid as string | undefined;
  // Malformed / uid-less reservation → safe to reclaim.
  if (!owner) return { state: "stale", uid: undefined };

  try {
    await auth.getUser(owner);
    return { state: "taken", uid: owner };
  } catch (e: any) {
    if (e?.code === "auth/user-not-found") {
      return { state: "stale", uid: owner };
    }
    throw e;
  }
}
