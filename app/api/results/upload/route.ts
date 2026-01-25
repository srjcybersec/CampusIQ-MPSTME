import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { extractTextFromFile } from "@/lib/utils/text-extraction";

let adminStorage: any = null;
let adminDb: any = null;

function initializeAdmin() {
  if (adminStorage && adminDb) return;

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
    adminStorage = getStorage();
    adminDb = getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeAdmin();
    if (!adminStorage || !adminDb) {
      return NextResponse.json(
        { error: "Storage service not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const semester = formData.get("semester") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    if (!semester) {
      return NextResponse.json({ error: "Semester required" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `Sem_${semester}_${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `results/${userId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucketName = storageBucket?.replace(/^gs:\/\//, "") || "";
    const bucket = adminStorage.bucket(bucketName);
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type || "application/pdf" },
    });

    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Extract text from PDF
    let extractedText = "";
    try {
      extractedText = await extractTextFromFile(file, buffer);
      // Limit to 50k characters for Firestore
      if (extractedText.length > 50000) {
        extractedText = extractedText.substring(0, 50000);
      }
    } catch (error: any) {
      console.warn("Text extraction failed:", error.message);
    }

    // Save to Firestore
    const resultData = {
      userId,
      semester,
      fileName: file.name,
      fileUrl,
      storagePath: filePath,
      fileSize: buffer.length,
      extractedText,
      uploadedAt: new Date(),
    };

    await adminDb.collection("results").add(resultData);

    return NextResponse.json({
      success: true,
      message: "Result uploaded successfully",
    });
  } catch (error: any) {
    console.error("Error uploading result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload result" },
      { status: 500 }
    );
  }
}
