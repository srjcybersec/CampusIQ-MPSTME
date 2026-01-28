import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const { db: adminDb } = await initializeAdmin();

    // Delete all schedule entries for this user
    const scheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    const scheduleBatch = adminDb.batch();
    scheduleSnapshot.docs.forEach((doc) => {
      scheduleBatch.delete(doc.ref);
    });
    await scheduleBatch.commit();

    // Delete all schedule comments for this user
    const commentsSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("scheduleComments")
      .get();

    const commentsBatch = adminDb.batch();
    commentsSnapshot.docs.forEach((doc) => {
      commentsBatch.delete(doc.ref);
    });
    await commentsBatch.commit();

    return NextResponse.json({
      success: true,
      message: "Timetable and all associated data deleted successfully",
      deletedEntries: scheduleSnapshot.docs.length,
      deletedComments: commentsSnapshot.docs.length,
    });
  } catch (error: any) {
    console.error("Error deleting timetable:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to delete timetable",
      },
      { status: 500 }
    );
  }
}
