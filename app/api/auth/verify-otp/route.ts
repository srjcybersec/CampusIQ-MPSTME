import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { verifyOtp } from "@/lib/auth/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verifies a 6-digit code submitted by the signed-in user. On success the
 * account's email is marked verified via the Admin SDK.
 * Auth: Firebase ID token in the `Authorization: Bearer <token>` header.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { code?: string };
    const code = (body.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }

    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(token).catch(() => null);
    if (!decoded) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    if (decoded.email_verified) {
      return NextResponse.json({ success: true, alreadyVerified: true }, { status: 200 });
    }

    const db = await getAdminDb();
    const result = await verifyOtp(db, decoded.uid, code);

    switch (result) {
      case "success":
        await auth.updateUser(decoded.uid, { emailVerified: true });
        return NextResponse.json({ success: true }, { status: 200 });
      case "invalid":
        return NextResponse.json({ error: "Incorrect code. Please check and try again." }, { status: 400 });
      case "expired":
        return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
      case "too-many-attempts":
        return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
      case "no-code":
      default:
        return NextResponse.json({ error: "No active code. Please request a new one." }, { status: 400 });
    }
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again shortly." },
      { status: 500 }
    );
  }
}
