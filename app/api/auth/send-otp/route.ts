import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { createOtp } from "@/lib/auth/otp";
import { sendBrevoEmail, buildOtpEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends (or re-sends) a 6-digit email verification code to the signed-in user.
 * Auth: Firebase ID token in the `Authorization: Bearer <token>` header.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(token).catch(() => null);
    if (!decoded) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    if (decoded.email_verified) {
      return NextResponse.json({ alreadyVerified: true }, { status: 200 });
    }

    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ error: "No email on this account." }, { status: 400 });
    }

    const db = await getAdminDb();
    const result = await createOtp(db, decoded.uid);

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "cooldown"
              ? `Please wait ${result.retryAfter}s before requesting another code.`
              : "Too many codes requested. Please try again later.",
          reason: result.reason,
          retryAfter: result.retryAfter,
        },
        { status: 429 }
      );
    }

    const name = (decoded.name as string | undefined) || undefined;
    const { subject, htmlContent, textContent } = buildOtpEmail(result.code, name);

    await sendBrevoEmail({ to: email, toName: name, subject, htmlContent, textContent });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again shortly." },
      { status: 500 }
    );
  }
}
