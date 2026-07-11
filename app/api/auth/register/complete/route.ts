import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { validatePassword } from "@/lib/auth/registration";
import { resolveReservation } from "@/lib/auth/reservations";
import { verifyPendingOtp, pendingRegistrationRef } from "@/lib/auth/pending-registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 2 of self-registration. Verifies the OTP against the pending record and,
 * only on success, creates the (already verified) Firebase Auth account,
 * reserves the username + SAP ID, and writes the profile — atomically.
 */
export async function POST(request: NextRequest) {
  let createdUid: string | null = null;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      code?: string;
      password?: string;
    };

    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const password = body.password || "";

    if (!email) {
      return NextResponse.json({ error: "Missing email." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      return NextResponse.json({ error: pwErr, fieldErrors: { password: pwErr } }, { status: 400 });
    }

    const auth = await getAdminAuth();
    const db = await getAdminDb();
    const emailKey = email;

    // 1. Verify the code (does not consume the pending doc yet).
    const verification = await verifyPendingOtp(db, emailKey, code);
    if (verification.status !== "success") {
      const map: Record<string, { msg: string; status: number }> = {
        invalid: { msg: "Incorrect code. Please check and try again.", status: 400 },
        expired: { msg: "This code has expired. Please restart signup.", status: 400 },
        "too-many-attempts": { msg: "Too many incorrect attempts. Please restart signup.", status: 429 },
        "no-code": { msg: "No pending registration found. Please restart signup.", status: 400 },
      };
      const m = map[verification.status] || { msg: "Verification failed.", status: 400 };
      return NextResponse.json({ error: m.msg }, { status: m.status });
    }

    const profile = verification.profile;

    // 2. Ensure the email is still free.
    try {
      await auth.getUserByEmail(email);
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    } catch (e: any) {
      if (e?.code !== "auth/user-not-found") throw e;
    }

    // 3. Resolve reservations before creating the account (reclaim orphans).
    const usernameRef = db.collection("usernames").doc(profile.usernameLower);
    const sapRef = db.collection("sapIds").doc(profile.sapId);

    const [preUsernameSnap, preSapSnap] = await Promise.all([usernameRef.get(), sapRef.get()]);
    const usernameOwner = await resolveReservation(auth, preUsernameSnap);
    if (usernameOwner.state === "taken") {
      return NextResponse.json(
        { error: "That username was just taken. Please choose another.", fieldErrors: { username: "This username is taken." } },
        { status: 409 }
      );
    }
    const sapOwner = await resolveReservation(auth, preSapSnap);
    if (sapOwner.state === "taken") {
      return NextResponse.json(
        { error: "An account with this SAP ID already exists.", fieldErrors: { sapId: "This SAP ID is already registered." } },
        { status: 409 }
      );
    }
    const staleUsernameUid = usernameOwner.state === "stale" ? usernameOwner.uid : null;
    const staleSapUid = sapOwner.state === "stale" ? sapOwner.uid : null;

    // 4. Create the verified account.
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: profile.name,
      emailVerified: true,
    });
    createdUid = userRecord.uid;

    const userRef = db.collection("users").doc(createdUid);
    const pendingRef = pendingRegistrationRef(db, emailKey);

    // 5. Atomically reserve + write profile + consume the pending doc.
    await db.runTransaction(async (tx) => {
      const [usernameSnap, sapSnap] = await Promise.all([tx.get(usernameRef), tx.get(sapRef)]);

      if (usernameSnap.exists && usernameSnap.data()?.uid !== staleUsernameUid) {
        const err: any = new Error("username-taken");
        err.appCode = "username-taken";
        throw err;
      }
      if (sapSnap.exists && sapSnap.data()?.uid !== staleSapUid) {
        const err: any = new Error("sap-taken");
        err.appCode = "sap-taken";
        throw err;
      }

      for (const staleUid of new Set([staleUsernameUid, staleSapUid].filter(Boolean) as string[])) {
        if (staleUid !== createdUid) {
          tx.delete(db.collection("users").doc(staleUid));
        }
      }

      tx.set(usernameRef, { uid: createdUid, createdAt: FieldValue.serverTimestamp() });
      tx.set(sapRef, { uid: createdUid, createdAt: FieldValue.serverTimestamp() });
      tx.set(userRef, {
        email: profile.email,
        username: profile.username,
        usernameLower: profile.usernameLower,
        sapId: profile.sapId,
        name: profile.name,
        program: profile.program,
        branch: profile.branch,
        year: profile.year,
        phone: profile.phone,
        role: "student",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.delete(pendingRef);
    });

    return NextResponse.json({ success: true, uid: createdUid }, { status: 201 });
  } catch (error: any) {
    if (createdUid) {
      try {
        const auth = await getAdminAuth();
        await auth.deleteUser(createdUid);
      } catch {
        // best-effort cleanup
      }
    }

    if (error?.appCode === "username-taken") {
      return NextResponse.json(
        { error: "That username was just taken. Please choose another.", fieldErrors: { username: "This username is taken." } },
        { status: 409 }
      );
    }
    if (error?.appCode === "sap-taken") {
      return NextResponse.json(
        { error: "An account with this SAP ID already exists.", fieldErrors: { sapId: "This SAP ID is already registered." } },
        { status: 409 }
      );
    }

    console.error("register/complete error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again later." }, { status: 500 });
  }
}
