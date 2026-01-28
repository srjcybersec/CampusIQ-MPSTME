import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

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
        let formattedPrivateKey = privateKey;
        
        try {
          const parsed = JSON.parse(privateKey);
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

/**
 * POST /api/pyqs/solve
 * Solve questions from PYQ papers - user types questions manually
 */
export async function POST(request: NextRequest) {
  try {
    const { pyqId, question, conversationHistory } = await request.json();

    if (!pyqId) {
      return NextResponse.json(
        { error: "PYQ ID is required" },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      throw new Error("Firebase Admin not initialized");
    }

    // Fetch PYQ document for metadata
    const pyqDoc = await db.collection("pyqs").doc(pyqId).get();
    if (!pyqDoc.exists) {
      return NextResponse.json(
        { error: "PYQ not found" },
        { status: 404 }
      );
    }

    const pyqData = pyqDoc.data();
    const storagePath = pyqData?.storagePath;
    const fileUrl = pyqData?.fileUrl;

    if (!storagePath && !fileUrl) {
      return NextResponse.json(
        { error: "PYQ PDF file path or URL not found" },
        { status: 404 }
      );
    }

    // Download PDF from Firebase Storage
    let pdfBuffer: Buffer;
    try {
      console.log(`[PYQ Solve] Downloading PDF from: ${storagePath}`);
      
      // Initialize Firebase Admin Storage
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
      }

      const storage = getStorage();
      
      // Get bucket name from environment variable
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      if (!storageBucket) {
        throw new Error("Firebase Storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in environment variables.");
      }
      
      // Remove gs:// prefix if present
      const bucketName = storageBucket.replace(/^gs:\/\//, "");
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(storagePath);
      
      const [buffer] = await file.download();
      pdfBuffer = Buffer.from(buffer);
      console.log(`[PYQ Solve] Downloaded PDF: ${pdfBuffer.length} bytes`);
    } catch (error: any) {
      console.error("[PYQ Solve] Error downloading PDF:", error);
      return NextResponse.json(
        { error: `Failed to download PDF: ${error.message}` },
        { status: 500 }
      );
    }

    // Convert PDF to base64 for Gemini Vision API
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfMimeType = "application/pdf";

    // Build prompt with PDF context
    let prompt = `You are an AI tutor helping a student solve questions from a Previous Year Question (PYQ) paper.

PYQ Document Information:
- File Name: ${pyqData?.fileName || "Unknown"}
- Branch: ${pyqData?.branch || "Unknown"}
- Semester: ${pyqData?.semester || "Unknown"}
- Subject: ${pyqData?.subject || "Unknown"}

The student is viewing this PYQ paper PDF and has typed a question from it. You have access to the FULL PDF content. Read the PDF carefully and use the actual questions and content from it to provide accurate answers.`;

    // Include conversation history for context
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.map((msg: any) => 
        `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`
      ).join("\n")}\n\n`;
    }

    prompt += `\nSTUDENT'S QUESTION: ${question}

INSTRUCTIONS:
1. The student is asking about a question from the PYQ paper PDF provided below.
2. Find the EXACT question the student is asking about in the PDF (e.g., "Q1 a", "Question 1(a)", "solve Q1 a" refers to the first sub-question of Question 1).
3. Provide a clear, detailed solution to THAT SPECIFIC question from the PDF.
4. Use the actual question text and any relevant context from the PDF.
5. Explain the concepts involved and show step-by-step reasoning.
6. If it's a follow-up question or out-of-context question, use the conversation history to maintain context and answer appropriately.
7. Be educational and help the student understand, not just give the answer.
8. Format your response clearly with proper explanations and examples where relevant.
9. IMPORTANT: Answer based on the ACTUAL content from the PDF, not generic knowledge. If you cannot find the specific question in the PDF, say so clearly.

Please provide a helpful solution based on the PDF content:`;

    // Get answer from Gemini
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please check your .env file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use vision-capable models that support PDF input
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ];

    let lastError: any = null;
    let answer = "";

    // Prepare PDF as file part for Gemini Vision API
    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: pdfMimeType,
      },
    };

    for (const modelName of modelsToTry) {
      try {
        console.log(`[PYQ Solve] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Send both prompt and PDF to Gemini Vision API
        const result = await model.generateContent([prompt, pdfPart]);
        const response = await result.response;
        answer = response.text();
        
        if (!answer || answer.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        console.log(`[PYQ Solve] Successfully got answer from ${modelName}`);
        break; // Success, exit loop
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    if (!answer) {
      throw new Error(`Failed to get answer: ${lastError?.message || "All models failed"}`);
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    console.error("Error solving PYQ question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to solve question" },
      { status: 500 }
    );
  }
}
