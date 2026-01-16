import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Lazy initialization of Firebase Admin
let adminDb: Firestore | null = null;

function getAdminDb(): Firestore | null {
  if (adminDb) {
    return adminDb;
  }

  try {
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        adminDb = getFirestore();
        return adminDb;
      } else {
        console.warn("Firebase Admin credentials not found. Calendar check will use client-side Firestore.");
        return null;
      }
    } else {
      adminDb = getFirestore();
      return adminDb;
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

/**
 * GET /api/calendar/check
 * Checks if user has connected Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default-user";

    const db = getAdminDb();
    if (!db) {
      // If Firebase Admin is not available, return false (client will handle it)
      return NextResponse.json({
        connected: false,
        message: "Firebase Admin not configured. Using client-side check.",
      });
    }

    const tokensDoc = await db.collection("googleCalendarTokens").doc(userId).get();

    return NextResponse.json({
      connected: tokensDoc.exists,
    });
  } catch (error: any) {
    console.error("Error checking connection:", error);
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}
