import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import { TimetableEntry } from "@/lib/data/timetable";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Use the verified token uid so a user can only read their own schedule.
    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, searchParams.get("userId"));
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    // Initialize Firebase Admin
    const { db: adminDb } = await initializeAdmin();

    // Fetch schedule entries for this user
    const scheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    const entries: TimetableEntry[] = scheduleSnapshot.docs.map((doc) => {
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

    // Sort entries by day, then by startTime
    entries.sort((a, b) => {
      // First sort by day
      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      
      // Then sort by startTime
      return a.startTime.localeCompare(b.startTime);
    });

    // Load batch preference / available batches
    let batch: string | null = null;
    let availableBatches: string[] = [];
    try {
      const metaDoc = await adminDb.collection("scheduleMeta").doc(userId).get();
      if (metaDoc.exists) {
        const meta = metaDoc.data() || {};
        batch = meta.batch ?? null;
        availableBatches = Array.isArray(meta.availableBatches) ? meta.availableBatches : [];
      }
    } catch (metaError) {
      console.warn("Could not load schedule meta:", metaError);
    }

    // Fallback: derive available batches from the entries if meta is missing
    if (availableBatches.length === 0) {
      availableBatches = Array.from(
        new Set(entries.map((e) => e.batch).filter((b): b is string => !!b))
      ).sort();
    }

    return NextResponse.json({
      success: true,
      entries,
      batch,
      availableBatches,
    });
  } catch (error: any) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch schedule",
      },
      { status: 500 }
    );
  }
}
