import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { TimetableEntry } from "@/lib/data/timetable";

export async function PUT(request: NextRequest) {
  try {
    const { entryId, userId, entryData } = await request.json();

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

    const entryData_check = entryDoc.data();
    if (entryData_check?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: Entry does not belong to user" },
        { status: 403 }
      );
    }

    // Update the entry
    const { FieldValue } = await import("firebase-admin/firestore");
    const updateData: Partial<TimetableEntry> = {
      ...entryData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await entryRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Entry updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating entry:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to update entry",
      },
      { status: 500 }
    );
  }
}
