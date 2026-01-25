import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { extractTextFromStoragePDF } from "@/lib/utils/pdf-ocr";

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
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }
    }
    adminDb = getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// Cache for PDF text
let cachedPdfText: Record<string, { text: string; time: number }> = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getResultText(resultId: string): Promise<string> {
  initializeAdmin();
  if (!adminDb) {
    throw new Error("Database not configured");
  }

  // Check cache
  const cached = cachedPdfText[resultId];
  if (cached && Date.now() - cached.time < CACHE_DURATION) {
    return cached.text;
  }

  const resultDoc = await adminDb.collection("results").doc(resultId).get();
  if (!resultDoc.exists) {
    throw new Error("Result not found");
  }

  const resultData = resultDoc.data();
  let pdfText = "";

  // Try to use extracted text from Firestore first
  if (resultData.extractedText && resultData.extractedText.length > 100) {
    pdfText = resultData.extractedText;
    console.log(`Using cached extracted text: ${pdfText.length} characters`);
  } else {
    // Extract from PDF if not available
    try {
      pdfText = await extractTextFromStoragePDF(resultData.storagePath);
      console.log(`Extracted text from PDF: ${pdfText.length} characters`);
    } catch (error: any) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Cache the result
  cachedPdfText[resultId] = { text: pdfText, time: Date.now() };

  return pdfText;
}

export async function POST(request: NextRequest) {
  try {
    const { resultId, question, conversationHistory } = await request.json();

    if (!resultId || !question) {
      return NextResponse.json(
        { error: "Result ID and question are required" },
        { status: 400 }
      );
    }

    // Get result data and PDF text
    initializeAdmin();
    if (!adminDb) {
      throw new Error("Database not configured");
    }

    const resultDoc = await adminDb.collection("results").doc(resultId).get();
    if (!resultDoc.exists) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const resultData = resultDoc.data();
    let pdfText: string;

    try {
      pdfText = await getResultText(resultId);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to load result: ${error.message}` },
        { status: 500 }
      );
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from result PDF" },
        { status: 500 }
      );
    }

    // Build context
    const maxContextLength = 150000;
    let context = `You are an AI assistant helping a student analyze their academic results.

STUDENT'S RESULT INFORMATION:
- Semester: ${resultData.semester}
- File Name: ${resultData.fileName}

RESULT PDF CONTENT (${pdfText.length} characters extracted):
${pdfText.substring(0, maxContextLength)}${pdfText.length > maxContextLength ? "\n\n[Content truncated for length...]" : ""}`;

    // Include conversation history
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
1. Answer the question based on the result PDF content provided above.
2. For CGPA-related questions (e.g., "how much do I need to score to get CGPA 3.6"), calculate based on:
   - Current grades and credits from the PDF
   - Required CGPA target
   - Number of remaining credits
   - Provide specific grade/score requirements
3. For grade analysis, explain performance, trends, strengths, and areas for improvement.
4. Be specific and provide actionable insights.
5. Use the conversation history to maintain context for follow-up questions.
6. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only.

Please provide a helpful answer based on the result PDF:`;

    // Get answer from Gemini
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing");
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
        
        break;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    if (!answer) {
      throw new Error(`Failed to get answer: ${lastError?.message || "All models failed"}`);
    }

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error("Error analyzing result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze result" },
      { status: 500 }
    );
  }
}
