import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  normalizeUsername,
  validateRegistration,
  type RegistrationInput,
} from "@/lib/auth/registration";
import { resolveReservation } from "@/lib/auth/reservations";
import { upsertPendingRegistration, type PendingProfile } from "@/lib/auth/pending-registration";
import { sendBrevoEmail, buildOtpEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 1 of self-registration. Validates everything, confirms the email /
 * username / SAP ID are free, stores a pending registration + OTP, and emails
 * the code. NO account is created here.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RegistrationInput>;

    const input: RegistrationInput = {
      name: (body.name || "").trim(),
      username: (body.username || "").trim(),
      email: (body.email || "").trim().toLowerCase(),
      sapId: (body.sapId || "").trim(),
      program: (body.program || "").trim(),
      branch: (body.branch || "").trim(),
      year: (body.year || "").trim(),
      phone: (body.phone || "").trim(),
      password: body.password || "",
    };

    const errors = validateRegistration(input);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", fieldErrors: errors }, { status: 400 });
    }

    const auth = await getAdminAuth();
    const db = await getAdminDb();
    const usernameKey = normalizeUsername(input.username);
    const emailKey = input.email;

    // Email must not already belong to a real account.
    try {
      await auth.getUserByEmail(input.email);
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    } catch (e: any) {
      if (e?.code !== "auth/user-not-found") throw e;
    }

    // Username availability (orphaned reservations count as free).
    const usernameSnap = await db.collection("usernames").doc(usernameKey).get();
    const usernameOwner = await resolveReservation(auth, usernameSnap);
    if (usernameOwner.state === "taken") {
      return NextResponse.json(
        { error: "That username is already taken.", fieldErrors: { username: "This username is taken." } },
        { status: 409 }
      );
    }

    // SAP ID availability.
    const sapSnap = await db.collection("sapIds").doc(input.sapId).get();
    const sapOwner = await resolveReservation(auth, sapSnap);
    if (sapOwner.state === "taken") {
      return NextResponse.json(
        { error: "An account with this SAP ID already exists.", fieldErrors: { sapId: "This SAP ID is already registered." } },
        { status: 409 }
      );
    }

    const profile: PendingProfile = {
      name: input.name,
      username: input.username,
      usernameLower: usernameKey,
      email: input.email,
      sapId: input.sapId,
      program: input.program,
      branch: input.branch,
      year: input.year,
      phone: input.phone || null,
    };

    const result = await upsertPendingRegistration(db, emailKey, profile);
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

    const { subject, htmlContent, textContent } = buildOtpEmail(result.code, input.name);
    await sendBrevoEmail({ to: input.email, toName: input.name, subject, htmlContent, textContent });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("register/start error:", error);
    return NextResponse.json(
      { error: "Could not start registration. Please try again shortly." },
      { status: 500 }
    );
  }
}
