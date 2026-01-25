import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminDb: any = null;

function initializeAdmin() {
  if (adminDb) return;

  try {
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        let formattedPrivateKey = privateKey;
        try {
          const parsed = JSON.parse(privateKey);
          if (typeof parsed === "string") {
            formattedPrivateKey = parsed;
          }
        } catch {}
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
        formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });
      }
    }
    adminDb = getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    initializeAdmin();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Get userId from query params or from auth header
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    // If no userId in query, try to get from auth header (for future use)
    // For now, we'll require it in query params
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Fetch results without orderBy to avoid composite index requirement
    const resultsSnapshot = await adminDb
      .collection("results")
      .where("userId", "==", userId)
      .get();

    // Sort client-side by uploadedAt descending
    const results = resultsSnapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        semester: doc.data().semester,
        fileName: doc.data().fileName,
        fileUrl: doc.data().fileUrl,
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      }))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch results" },
      { status: 500 }
    );
  }
}
