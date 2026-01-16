import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/google-calendar/client";
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
        console.warn("Firebase Admin credentials not found.");
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
 * GET /api/calendar/events
 * Gets upcoming events from Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default-user";
    const maxResults = parseInt(searchParams.get("maxResults") || "10");

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase Admin not configured" },
        { status: 503 }
      );
    }

    // Get user's Google Calendar tokens
    const tokensDoc = await db.collection("googleCalendarTokens").doc(userId).get();

    if (!tokensDoc.exists) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    const tokens = tokensDoc.data() as any;
    const accessToken = tokens.accessToken;
    const refreshToken = tokens.refreshToken;

    const events = await getUpcomingEvents(accessToken, refreshToken, maxResults);

    return NextResponse.json({
      success: true,
      events: events.map((event: any) => ({
        id: event.id,
        summary: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
