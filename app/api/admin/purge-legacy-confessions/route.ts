import { NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/firebase/admin";
import type { Firestore } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEGACY_COLLECTIONS = ["confessions", "confessionLikes", "confessionReports"];

async function deleteCollection(db: Firestore, name: string) {
  const snapshot = await db.collection(name).get();
  if (snapshot.empty) return 0;

  const batchSize = 400;
  let deleted = 0;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const chunk = snapshot.docs.slice(i, i + batchSize);
    const batch = db.batch();
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

/** One-time cleanup of legacy confession Firestore data. */
export async function POST(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_PURGE_SECRET || process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await initializeAdmin();
    const results: Record<string, number> = {};

    for (const name of LEGACY_COLLECTIONS) {
      results[name] = await deleteCollection(db, name);
    }

    return NextResponse.json({
      success: true,
      deleted: results,
      message: "Legacy confession data purged.",
    });
  } catch (error: any) {
    console.error("Purge failed:", error);
    return NextResponse.json({ error: error.message || "Purge failed" }, { status: 500 });
  }
}
