import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar/client";
import { TimetableEntry } from "@/lib/data/timetable";
import { format, addDays, startOfWeek } from "date-fns";
import { initializeAdmin } from "@/lib/firebase/admin";


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
    const accessToken = body.accessToken;
    const refreshToken = body.refreshToken;
    const userId = body.userId;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required. Please connect your Google Calendar first." },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin and fetch user's schedule
    const { db: adminDb } = await initializeAdmin();

    const scheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    if (scheduleSnapshot.empty) {
      return NextResponse.json(
        { error: "No schedule found. Please upload your timetable first." },
        { status: 404 }
      );
    }

    const userTimetable: TimetableEntry[] = scheduleSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        day: data.day,
        time: data.time,
        startTime: data.startTime,
        endTime: data.endTime,
        subject: data.subject,
        subjectCode: data.subjectCode || "",
        faculty: data.faculty || "",
        facultyInitials: data.facultyInitials || "",
        room: data.room || "",
        batch: data.batch,
        type: data.type || "lecture",
      } as TimetableEntry;
    });

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
