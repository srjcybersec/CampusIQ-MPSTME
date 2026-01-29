import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { TimetableEntry } from "@/lib/data/timetable";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      entries,
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
