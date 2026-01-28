import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";

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
