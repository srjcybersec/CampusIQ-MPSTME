import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { extractTextFromStoragePDF } from "@/lib/utils/pdf-ocr";

// Lazy initialization of Firebase Admin
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

function getAdminDbAndStorage(): { db: Firestore | null; storage: Storage | null } {
  if (adminDb && adminStorage) {
    return { db: adminDb, storage: adminStorage };
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

        const app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        adminDb = getFirestore(app);
        adminStorage = getStorage(app);
        return { db: adminDb, storage: adminStorage };
      } else {
        console.warn("Firebase Admin credentials not found.");
        return { db: null, storage: null };
      }
    } else {
      const existingApp = getApps()[0];
      adminDb = getFirestore(existingApp);
      adminStorage = getStorage(existingApp);
      return { db: adminDb, storage: adminStorage };
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return { db: null, storage: null };
  }
}

// Cache for PDF text (to avoid re-extracting on every request)
let cachedPdfText: string | null = null;
let pdfTextCacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

async function getStudentResourceBookText(): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (cachedPdfText && (now - pdfTextCacheTime) < CACHE_DURATION) {
    console.log("Using cached PDF text");
    return cachedPdfText;
  }

  const { db, storage } = getAdminDbAndStorage();
  if (!db || !storage) {
    throw new Error("Firebase Admin not initialized. Please check your Firebase Admin credentials in environment variables.");
  }

  // The PDF should be stored at: student-resource-book/student-resource-book.pdf
  // You can change this path if you store it elsewhere
  const pdfPath = "student-resource-book/student-resource-book.pdf";
  
  try {
    console.log(`Extracting text from Student Resource Book PDF: ${pdfPath}`);
    
    // Check if file exists first
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/^gs:\/\//, "") || "";
    if (!bucketName) {
      throw new Error("Firebase Storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in environment variables.");
    }
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(pdfPath);
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new Error(`PDF file not found at path: ${pdfPath}. Please upload the Student Resource Book PDF to Firebase Storage. Instructions: 1) Go to Firebase Console > Storage, 2) Create folder 'student-resource-book', 3) Upload your PDF as 'student-resource-book.pdf'`);
    }
    
    const pdfText = await extractTextFromStoragePDF(pdfPath);
    console.log(`Extracted ${pdfText.length} characters from PDF`);

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error("PDF file is empty or could not extract text. Please check the PDF file.");
    }

    // Cache the result
    cachedPdfText = pdfText;
    pdfTextCacheTime = now;

    return pdfText;
  } catch (error: any) {
    console.error("Error extracting PDF text:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * POST /api/student-resource-book/ask
 * Answer questions about the Student Resource Book PDF
 */
export async function POST(request: NextRequest) {
  try {
    const { question, conversationHistory } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get PDF text
    let pdfText: string;
    try {
      pdfText = await getStudentResourceBookText();
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to load Student Resource Book: ${error.message}. Please ensure the PDF is uploaded to Firebase Storage at 'student-resource-book/student-resource-book.pdf'` },
        { status: 500 }
      );
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "Student Resource Book PDF is empty or could not be extracted. Please check the PDF file." },
        { status: 500 }
      );
    }

    // Build context for the question
    const pdfContentLength = pdfText.length;
    const maxContextLength = 150000; // Limit context to avoid token limits
    
    let context = `You are an AI assistant helping students understand the Student Resource Book.

STUDENT RESOURCE BOOK CONTENT (${pdfContentLength} characters extracted):
${pdfText.substring(0, maxContextLength)}${pdfText.length > maxContextLength ? "\n\n[Content truncated for length...]" : ""}`;

    // Include conversation history for context
    let historyContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.map((msg: any) => 
        `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`
      ).join("\n")}\n\n`;
    }

    const prompt = `${context}

${historyContext}

STUDENT'S QUESTION: ${question}

INSTRUCTIONS:
1. Answer the question based ONLY on the Student Resource Book content provided above.
2. If the question is not answered in the book, politely say that the information is not available in the Student Resource Book.
3. Provide clear, accurate, and helpful answers.
4. Use the conversation history to maintain context for follow-up questions.
5. Format your response clearly with proper explanations.
6. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only.

Please provide a helpful answer based on the Student Resource Book:`;

    // Get answer from Gemini
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please check your .env file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];

    let lastError: any = null;
    let answer = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
        
        if (!answer || answer.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
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
    console.error("Error answering Student Resource Book question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to answer question" },
      { status: 500 }
    );
  }
}
