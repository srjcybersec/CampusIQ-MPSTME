import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { normalizeUsername, validateUsername } from "@/lib/auth/registration";

/**
 * Live username availability check for the signup form.
 * GET /api/auth/check-username?username=someone
 */
export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username") || "";

    const formatError = validateUsername(username);
    if (formatError) {
      return NextResponse.json({ available: false, reason: formatError }, { status: 200 });
    }

    const db = await getAdminDb();
    const key = normalizeUsername(username);
    const snap = await db.collection("usernames").doc(key).get();

    if (!snap.exists) {
      return NextResponse.json({ available: true }, { status: 200 });
    }

    // The reservation exists, but if its owner account was deleted the
    // username is actually free (registration will reclaim it).
    const owner = snap.data()?.uid as string | undefined;
    if (!owner) {
      return NextResponse.json({ available: true }, { status: 200 });
    }

    try {
      const auth = await getAdminAuth();
      await auth.getUser(owner);
      return NextResponse.json({ available: false }, { status: 200 });
    } catch (e: any) {
      if (e?.code === "auth/user-not-found") {
        return NextResponse.json({ available: true }, { status: 200 });
      }
      throw e;
    }
  } catch (error) {
    console.error("Username check error:", error);
    // Fail open on the check itself; the registration route is the source of truth.
    return NextResponse.json({ available: true, uncertain: true }, { status: 200 });
  }
}
