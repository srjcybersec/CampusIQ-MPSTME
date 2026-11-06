import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { pyqId } = await request.json();

    if (!pyqId) {
      return NextResponse.json({ error: "PYQ ID is required" }, { status: 400 });
    }

    const db = await getAdminDb();
    const pyqRef = db.collection("pyqs").doc(pyqId);
    const pyqDoc = await pyqRef.get();

    if (!pyqDoc.exists) {
      return NextResponse.json({ error: "PYQ not found" }, { status: 404 });
    }

    const currentDownloads = pyqDoc.data()?.downloadCount || 0;
    await pyqRef.update({ downloadCount: currentDownloads + 1 });

    return NextResponse.json({ success: true, message: "Download count updated" });
  } catch (error: any) {
    console.error("Error updating download count:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update download count" },
      { status: 500 }
    );
  }
}
