import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import {
  ExtractedScheduleEntry,
  normalizeBatch,
  normalizeTimetableEntries,
} from "@/lib/schedule/timetable-parser";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { entries, userId: bodyUserId, batch: requestedBatch } = await request.json();

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: entries" },
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

    const userBatch = normalizeBatch(requestedBatch);
    const { entries: normalizedEntries, availableBatches } = normalizeTimetableEntries(
      entries as ExtractedScheduleEntry[],
      userId
    );

    const { db: adminDb } = await initializeAdmin();

    const existingScheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    const deleteBatch = adminDb.batch();
    existingScheduleSnapshot.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    const { FieldValue } = await import("firebase-admin/firestore");
    await Promise.all(
      normalizedEntries.map((entry) => {
        const docRef = adminDb.collection("schedules").doc();
        const { batch: entryBatch, ...entryRest } = entry;
        const firestoreData: Record<string, unknown> = {
          ...entryRest,
          userId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (entryBatch) firestoreData.batch = entryBatch;
        return docRef.set(firestoreData);
      })
    );

    let effectiveBatch = userBatch;
    if (effectiveBatch && availableBatches.length > 0 && !availableBatches.includes(effectiveBatch)) {
      effectiveBatch = undefined;
    }

    await adminDb
      .collection("scheduleMeta")
      .doc(userId)
      .set(
        {
          userId,
          batch: effectiveBatch || null,
          availableBatches,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({
      success: true,
      entriesCount: normalizedEntries.length,
      entries: normalizedEntries,
      availableBatches,
      batch: effectiveBatch || null,
    });
  } catch (error: any) {
    console.error("Error saving timetable:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save timetable" },
      { status: 500 }
    );
  }
}
