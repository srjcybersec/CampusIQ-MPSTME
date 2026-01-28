import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, entryId, comment } = await request.json();

    if (!userId || !entryId) {
      return NextResponse.json(
        { error: "Missing required fields: userId and entryId" },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    const { db: adminDb } = await initializeAdmin();

    // Save comment to schedule entry
    const scheduleRef = adminDb.collection("schedules").doc(entryId);
    const { FieldValue } = await import("firebase-admin/firestore");
    await scheduleRef.update({
      comment: comment || "",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error saving comment:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to save comment",
      },
      { status: 500 }
    );
  }
}
