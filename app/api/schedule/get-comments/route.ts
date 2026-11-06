import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

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

    // Fetch schedule entries with comments for this user
    const scheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    const comments: Record<string, string> = {};
    scheduleSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.comment) {
        comments[doc.id] = data.comment;
      }
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}
