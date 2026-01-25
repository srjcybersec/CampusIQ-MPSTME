import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

    // Build context for the question
    let context = `You are an AI tutor helping a student solve questions from a Previous Year Question (PYQ) paper.

PYQ Document Information:
- File Name: ${pyqData?.fileName || "Unknown"}
- Branch: ${pyqData?.branch || "Unknown"}
- Semester: ${pyqData?.semester || "Unknown"}
- Subject: ${pyqData?.subject || "Unknown"}

The student is viewing this PYQ paper and has typed a question from it. Help them solve it.`;

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
1. The student is asking about a question from the PYQ paper mentioned above.
2. Provide a clear, detailed solution to the question.
3. Explain the concepts involved and show step-by-step reasoning.
4. If it's a follow-up question, use the conversation history to maintain context.
5. Be educational and help the student understand, not just give the answer.
6. Format your response clearly with proper explanations and examples where relevant.

Please provide a helpful solution:`;

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
    console.error("Error solving PYQ question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to solve question" },
      { status: 500 }
    );
  }
}
