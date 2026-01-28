import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { TimetableEntry } from "@/lib/data/timetable";

export interface ProactiveAlert {
  type: "class_reminder" | "attendance_warning" | "upcoming_deadline";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  timestamp: Date;
  actionUrl?: string;
}

/**
 * GET /api/proactive-assistance/alerts
 * Get proactive alerts for the user
 */
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

    const alerts: ProactiveAlert[] = [];

    // Initialize Firebase Admin
    const { db: adminDb } = await initializeAdmin();

    // Fetch schedule entries
    const scheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    const timetableEntries: TimetableEntry[] = scheduleSnapshot.docs.map((doc) => {
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

    // Check for upcoming classes
    if (timetableEntries.length > 0) {
      const now = new Date();
      const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      const todayClasses = timetableEntries.filter(
        (entry) => entry.day === currentDay
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (const classEntry of todayClasses) {
        const [classHour, classMin] = classEntry.startTime.split(":").map(Number);
        const classTime = classHour * 60 + classMin;
        const [currentHour, currentMin] = currentTime.split(":").map(Number);
        const currentTimeMinutes = currentHour * 60 + currentMin;

        const minutesUntilClass = classTime - currentTimeMinutes;

        // Remind 15 minutes before class
        if (minutesUntilClass > 0 && minutesUntilClass <= 15) {
          alerts.push({
            type: "class_reminder",
            title: `Class starting soon: ${classEntry.subject}`,
            message: `${classEntry.subject} starts in ${minutesUntilClass} minutes at ${classEntry.startTime} in ${classEntry.room || "TBA"}`,
            priority: minutesUntilClass <= 5 ? "high" : "medium",
            timestamp: new Date(),
            actionUrl: "/schedule",
          });
        }
      }
    }

    // Note: Attendance warnings are handled client-side to access localStorage
    // This prevents duplicate alerts from being generated

    // Sort by priority and timestamp
    alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error: any) {
    console.error("Error fetching proactive alerts:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch alerts",
      },
      { status: 500 }
    );
  }
}
