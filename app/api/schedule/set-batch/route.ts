import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId: bodyUserId, batch } = await request.json();

    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, bodyUserId);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    const normalizedBatch =
      typeof batch === "string" && batch.trim()
        ? batch.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : null;

    const { db: adminDb } = await initializeAdmin();
    const { FieldValue } = await import("firebase-admin/firestore");

    await adminDb
      .collection("scheduleMeta")
      .doc(userId)
      .set(
        {
          userId,
          batch: normalizedBatch,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true, batch: normalizedBatch });
  } catch (error: any) {
    console.error("Error setting batch:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set batch" },
      { status: 500 }
    );
  }
}
