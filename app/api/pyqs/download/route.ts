import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Lazy initialization of Firebase Admin
let adminDb: Firestore | null = null;

function getAdminDb(): Firestore | null {
  if (adminDb) {
    return adminDb;
  }

  try {
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        // Handle private key formatting
        let formattedPrivateKey = privateKey;
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(privateKey);
          if (typeof parsed === "string") {
            formattedPrivateKey = parsed;
          }
        } catch {
          // Not JSON, use as-is
        }
        
        // Replace escaped newlines
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
        formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });
        adminDb = getFirestore();
        return adminDb;
      } else {
        console.warn("Firebase Admin credentials not found.");
        return null;
      }
    } else {
      adminDb = getFirestore();
      return adminDb;
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pyqId } = await request.json();

    if (!pyqId) {
      return NextResponse.json(
        { error: "PYQ ID is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      throw new Error("Firebase Admin not initialized");
    }

    // Increment download count using Admin SDK
    const pyqRef = db.collection("pyqs").doc(pyqId);
    const pyqDoc = await pyqRef.get();

    if (!pyqDoc.exists) {
      return NextResponse.json(
        { error: "PYQ not found" },
        { status: 404 }
      );
    }

    const currentDownloads = pyqDoc.data()?.downloadCount || 0;
    await pyqRef.update({
      downloadCount: currentDownloads + 1,
    });

    return NextResponse.json({
      success: true,
      message: "Download count updated",
    });
  } catch (error: any) {
    console.error("Error updating download count:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update download count" },
      { status: 500 }
    );
  }
}
