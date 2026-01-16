import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar/client";
import { TIMETABLE_DATA } from "@/lib/data/timetable";
import { format, addDays, startOfWeek } from "date-fns";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin for server-side operations
let adminDb: any = null;
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
    } else {
      console.warn("Firebase Admin credentials not found. Event ID storage will be skipped.");
    }
  } else {
    try {
      adminDb = getFirestore();
    } catch (error) {
      console.warn("Firebase Admin already initialized but getFirestore failed:", error);
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // Continue without admin - event ID storage will be skipped
}

/**
 * POST /api/calendar/sync
 * Syncs timetable to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    const batch = body.batch || "K1"; // Default to K1 batch
    const accessToken = body.accessToken;
    const refreshToken = body.refreshToken;
    const userId = body.userId;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required. Please connect your Google Calendar first." },
        { status: 401 }
      );
    }

    // Filter timetable for user's batch
    const userTimetable = TIMETABLE_DATA.filter(
      (entry) => !entry.batch || entry.batch === batch
    );

    // Get current week's Monday
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });

    // Create events for this week
    const eventsCreated = [];
    const errors = [];

    for (const entry of userTimetable) {
      if (entry.type === "break") continue;

      try {
        // Calculate the date for this entry
        const dayOffset = {
          Monday: 0,
          Tuesday: 1,
          Wednesday: 2,
          Thursday: 3,
          Friday: 4,
          Saturday: 5,
          Sunday: 6,
        }[entry.day] || 0;

        const eventDate = addDays(weekStart, dayOffset);
        const startDateTime = `${format(eventDate, "yyyy-MM-dd")}T${entry.startTime}:00`;
        const endDateTime = `${format(eventDate, "yyyy-MM-dd")}T${entry.endTime}:00`;

        // Create event
        const event = {
          summary: entry.subject,
          description: `Subject: ${entry.subject}\nCode: ${entry.subjectCode}\nFaculty: ${entry.faculty || "TBA"}\nBatch: ${entry.batch || "All"}`,
          start: {
            dateTime: startDateTime,
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: endDateTime,
            timeZone: "Asia/Kolkata",
          },
          location: entry.room || "",
          recurrence: ["RRULE:FREQ=WEEKLY;COUNT=16"], // 16 weeks for a semester
        };

        const createdEvent = await createCalendarEvent(
          accessToken,
          refreshToken,
          event
        );

        eventsCreated.push({
          id: createdEvent.id,
          subject: entry.subject,
          day: entry.day,
          time: entry.time,
        });
      } catch (error: any) {
        errors.push({
          subject: entry.subject,
          error: error.message,
        });
      }
    }

    // Store event IDs in Firestore for later deletion
    if (userId && eventsCreated.length > 0 && adminDb) {
      try {
        const eventIds = eventsCreated.map((e) => e.id);
        const tokensRef = adminDb.collection("googleCalendarTokens").doc(userId);
        await tokensRef.set(
          {
            eventIds: eventIds,
            lastSyncedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error storing event IDs:", error);
        // Don't fail the sync if we can't store IDs
      }
    } else if (userId && eventsCreated.length > 0 && !adminDb) {
      console.warn("Firebase Admin not initialized. Event IDs will not be stored for deletion.");
    }

    return NextResponse.json({
      success: true,
      eventsCreated: eventsCreated.length,
      events: eventsCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error syncing to Google Calendar:", error);
    // Always return JSON, never HTML
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to sync to Google Calendar",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
