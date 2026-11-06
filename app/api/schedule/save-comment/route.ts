import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    const { userId: bodyUserId, entryId, comment } = await request.json();

    if (!entryId) {
      return NextResponse.json(
        { error: "Missing required fields: entryId" },
        { status: 400 }
      );
    }

    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, bodyUserId);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    // Initialize Firebase Admin
    const { db: adminDb } = await initializeAdmin();

    // Only let a user comment on their OWN schedule entry.
    const scheduleRef = adminDb.collection("schedules").doc(entryId);
    const entryDoc = await scheduleRef.get();
    if (!entryDoc.exists) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    if (entryDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { FieldValue } = await import("firebase-admin/firestore");
    await scheduleRef.update({
      comment: typeof comment === "string" ? comment : "",
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
