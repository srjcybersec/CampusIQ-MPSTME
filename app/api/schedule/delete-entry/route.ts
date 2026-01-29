import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entryId = searchParams.get("entryId");
    const userId = searchParams.get("userId");

    if (!entryId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: entryId and userId" },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    const { db: adminDb } = await initializeAdmin();

    // Verify the entry belongs to the user
    const entryRef = adminDb.collection("schedules").doc(entryId);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    const entryData = entryDoc.data();
    if (entryData?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: Entry does not belong to user" },
        { status: 403 }
      );
    }

    // Delete the entry
    await entryRef.delete();

    // Also delete associated comment if exists
    try {
      const commentRef = adminDb
        .collection("users")
        .doc(userId)
        .collection("scheduleComments")
        .doc(entryId);
      await commentRef.delete();
    } catch (error) {
      // Comment might not exist, ignore error
      console.log("No comment found for entry, skipping deletion");
    }

    return NextResponse.json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting entry:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to delete entry",
      },
      { status: 500 }
    );
  }
}
