import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminDb: any = null;
let adminStorage: any = null;

function initializeAdmin() {
  if (adminDb && adminStorage) return;

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
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }
    }
    adminDb = getFirestore();
    adminStorage = getStorage();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeAdmin();
    if (!adminDb || !adminStorage) {
      return NextResponse.json(
        { error: "Services not configured" },
        { status: 500 }
      );
    }

    const { resultId } = await request.json();
    if (!resultId) {
      return NextResponse.json({ error: "Result ID required" }, { status: 400 });
    }

    const resultDoc = await adminDb.collection("results").doc(resultId).get();
    if (!resultDoc.exists) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const resultData = resultDoc.data();
    const storagePath = resultData.storagePath;

    // Delete from Storage
    if (storagePath) {
      try {
        const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/^gs:\/\//, ""));
        const file = bucket.file(storagePath);
        await file.delete();
      } catch (error: any) {
        console.warn("Error deleting file from storage:", error.message);
      }
    }

    // Delete from Firestore
    await adminDb.collection("results").doc(resultId).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete result" },
      { status: 500 }
    );
  }
}
