import { NextRequest, NextResponse } from "next/server";
import { deleteCalendarEvent } from "@/lib/google-calendar/client";

/**
 * POST /api/calendar/delete-events
 * Deletes calendar events from Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, eventIds } = body;

    if (!accessToken || !eventIds || !Array.isArray(eventIds)) {
      return NextResponse.json(
        { error: "Access token and event IDs array required" },
        { status: 400 }
      );
    }

    const deleted = [];
    const errors = [];

    for (const eventId of eventIds) {
      try {
        await deleteCalendarEvent(accessToken, refreshToken, eventId);
        deleted.push(eventId);
      } catch (error: any) {
        errors.push({
          eventId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error deleting calendar events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete calendar events" },
      { status: 500 }
    );
  }
}
