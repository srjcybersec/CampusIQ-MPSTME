import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin for server-side operations
let adminStorage: any = null;
let adminDb: any = null;

try {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Handle private key formatting - Vercel environment variables may have different escaping
      let formattedPrivateKey = privateKey;
      
      // Try to parse as JSON first (in case it's stored as a JSON string in Vercel)
      try {
        const parsed = JSON.parse(privateKey);
        if (typeof parsed === "string") {
          formattedPrivateKey = parsed;
        }
      } catch {
        // Not JSON, use as-is
      }
      
      // Replace escaped newlines (handle both \\n and \n patterns)
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
      // Handle double-escaped newlines
      formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");
      // Handle literal \n strings
      if (formattedPrivateKey.includes("\\n") && !formattedPrivateKey.includes("\n")) {
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
      }
      
      // Ensure proper key format
      if (!formattedPrivateKey.includes("BEGIN PRIVATE KEY") && !formattedPrivateKey.includes("BEGIN RSA PRIVATE KEY")) {
        console.error("Invalid private key format detected - key does not contain BEGIN marker");
        throw new Error("Invalid private key format");
      }
      
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      adminStorage = getStorage();
      adminDb = getFirestore();
    } else {
      console.warn("Firebase Admin credentials not found. File deletion will be disabled.");
      console.warn("Missing:", { 
        projectId: !!projectId, 
        clientEmail: !!clientEmail, 
        privateKey: !!privateKey 
      });
    }
  } else {
    try {
      adminStorage = getStorage();
      adminDb = getFirestore();
    } catch (error) {
      console.warn("Firebase Admin already initialized but getStorage/getFirestore failed:", error);
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export async function POST(request: NextRequest) {
  try {
    if (!adminStorage || !adminDb) {
      return NextResponse.json(
        { error: "Storage service not configured. Please check Firebase Admin credentials." },
        { status: 500 }
      );
    }

    const { noteId, userId, fileUrl } = await request.json();

    if (!noteId || !userId) {
      return NextResponse.json(
        { error: "Note ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify the note exists and user is the uploader
    const noteRef = adminDb.collection("notes").doc(noteId);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    const noteData = noteDoc.data();
    if (noteData.uploaderId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: Only the uploader can delete this note" },
        { status: 403 }
      );
    }

    // Delete file from Firebase Storage if fileUrl is provided
    if (fileUrl) {
      try {
        // Extract the file path from the URL
        // URL format: https://storage.googleapis.com/{bucket}/{path}
        // Example: https://storage.googleapis.com/gdg-hackathon-99c49.firebasestorage.app/notes/userId/filename.pdf
        const urlMatch = fileUrl.match(/https?:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
        
        if (urlMatch && urlMatch[1]) {
          const filePath = urlMatch[1];
          
          // Get bucket reference
          const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
          if (storageBucket) {
            const bucketName = storageBucket.replace(/^gs:\/\//, '');
            const bucket = adminStorage.bucket(bucketName);
            const fileRef = bucket.file(filePath);

            // Check if file exists and delete it
            const [exists] = await fileRef.exists();
            if (exists) {
              await fileRef.delete();
              console.log(`Deleted file from Storage: ${filePath}`);
            } else {
              console.warn(`File not found in Storage: ${filePath}`);
            }
          } else {
            console.warn("Storage bucket not configured");
          }
        } else {
          console.warn(`Could not extract file path from URL: ${fileUrl}`);
        }
      } catch (storageError: any) {
        console.error("Error deleting file from Storage:", storageError);
        // Continue with Firestore deletion even if Storage deletion fails
        // This ensures the note is removed from the database
      }
    }

    // Delete note from Firestore
    await noteRef.delete();
    console.log(`Deleted note from Firestore: ${noteId}`);

    return NextResponse.json({
      success: true,
      message: "Note and file deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
