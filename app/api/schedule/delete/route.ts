import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

export async function DELETE(request: NextRequest) {
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

    // Delete batch preference metadata
    try {
      await adminDb.collection("scheduleMeta").doc(userId).delete();
    } catch (metaError) {
      console.warn("Could not delete schedule meta:", metaError);
    }

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
