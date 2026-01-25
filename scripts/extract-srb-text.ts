/**
 * Script to pre-extract text from Student Resource Book PDF
 * and store it in Firestore for faster access
 * 
 * Usage: npx ts-node scripts/extract-srb-text.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { extractTextFromStoragePDF } from "../lib/utils/pdf-ocr";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from multiple possible locations
const envFiles = [".env.local", ".env", ".env.development.local", ".env.development"];
let envLoaded = false;

for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log(`📝 Loading environment variables from ${envFile}...`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn("⚠️  No .env file found. Trying to use environment variables from system...");
}

async function extractAndStoreSRBText() {
  try {
    // Initialize Firebase Admin
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

      // Check which variables are missing
      const missing: string[] = [];
      if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
      if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
      if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
      if (!storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

      if (missing.length > 0) {
        console.error("❌ Missing required environment variables:");
        missing.forEach(v => console.error(`   - ${v}`));
        console.error("\n💡 Please create a .env.local file with these variables, or set them in your system environment.");
        console.error("💡 You can copy these from your Vercel project settings or Firebase Console.");
        throw new Error(`Missing Firebase Admin credentials: ${missing.join(", ")}`);
      }

      console.log("✅ All required environment variables found");

      // At this point, TypeScript knows all variables are defined
      let formattedPrivateKey: string = privateKey!;
      try {
        const parsed = JSON.parse(privateKey!);
        if (typeof parsed === "string") {
          formattedPrivateKey = parsed;
        }
      } catch {
        // Not JSON, use as-is
      }
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

    const db = getFirestore();
    const { getStorage } = await import("firebase-admin/storage");
    const storage = getStorage();

    console.log("📄 Starting Student Resource Book text extraction...");
    console.log("⏳ This may take several minutes for a 124-page PDF...");

    const pdfPath = "student-resource-book/student-resource-book.pdf";
    
    // Extract text from PDF
    const startTime = Date.now();
    const extractedText = await extractTextFromStoragePDF(pdfPath, storage);
    const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Text extraction completed in ${extractionTime} seconds`);
    console.log(`📊 Extracted ${extractedText.length} characters`);

    // Store in Firestore
    const srbDoc = {
      extractedText: extractedText,
      extractedAt: new Date(),
      pdfPath: pdfPath,
      textLength: extractedText.length,
    };

    await db.collection("studentResourceBook").doc("text").set(srbDoc);

    console.log("✅ Text stored in Firestore at: studentResourceBook/text");
    console.log("🎉 Done! The SRB API will now use the pre-extracted text.");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
extractAndStoreSRBText();
