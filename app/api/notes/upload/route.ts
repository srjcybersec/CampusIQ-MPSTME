import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { extractTextFromFile } from "@/lib/utils/text-extraction";

// Initialize Firebase Admin for server-side operations
let adminStorage: any = null;
try {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      adminStorage = getStorage();
    } else {
      console.warn("Firebase Admin credentials not found. File upload will be disabled.");
    }
  } else {
    try {
      adminStorage = getStorage();
    } catch (error) {
      console.warn("Firebase Admin already initialized but getStorage failed:", error);
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export async function POST(request: NextRequest) {
  try {
    if (!adminStorage) {
      return NextResponse.json(
        { error: "Storage service not configured. Please check Firebase Admin credentials." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `notes/${userId}/${fileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get bucket reference - explicitly specify bucket name
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error("Storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env");
    }
    
    // Remove any gs:// prefix if present
    const bucketName = storageBucket.replace(/^gs:\/\//, '');
    const bucket = adminStorage.bucket(bucketName);
    const fileRef = bucket.file(filePath);

    // Upload file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    // Make file publicly accessible (or use signed URLs)
    await fileRef.makePublic();

    // Get public URL
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Extract text from the file for AI processing
    let extractedText = "";
    try {
      console.log(`Attempting to extract text from file: ${file.name}, type: ${file.type}`);
      extractedText = await extractTextFromFile(file, buffer);
      console.log(`Extracted ${extractedText.length} characters from file`);
      
      // Limit extracted text to 50k characters for Firestore (1MB limit per document)
      // We'll store a truncated version, but use full text for initial summarization
      if (extractedText.length > 50000) {
        extractedText = extractedText.substring(0, 50000);
        console.log(`Truncated to 50k characters for storage`);
      }
      
      if (extractedText.length === 0) {
        console.warn("No text extracted from file - may be unsupported format or empty file");
      }
    } catch (extractError) {
      console.error("Failed to extract text from file:", extractError);
      // Continue without extracted text - AI will use title/description
    }

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: filePath,
      extractedText, // Include extracted text for AI processing
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    console.error("Storage bucket:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    let errorMessage = error.message || "Failed to upload file";
    if (error.code === 404 || error.message?.includes("does not exist")) {
      errorMessage = `Storage bucket not found. Please check that NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set correctly in your .env file. Current value: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "not set"}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.code || "unknown",
        bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "not set"
      },
      { status: 500 }
    );
  }
}
