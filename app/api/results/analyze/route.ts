import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { applyGeminiRateLimits, geminiApiErrorResponse } from "@/lib/ai/gemini-rate-limit";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

let adminDb: ReturnType<typeof getFirestore> | null = null;

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
          if (typeof parsed === "string") formattedPrivateKey = parsed;
        } catch {}
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
        formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");

        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey: formattedPrivateKey }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }
    }
    adminDb = getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

async function downloadResultPdf(storagePath: string): Promise<Buffer> {
  const storage = getStorage();
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/^gs:\/\//, "") || "";
  if (!bucketName) throw new Error("Firebase Storage bucket not configured");

  const [buffer] = await storage.bucket(bucketName).file(storagePath).download();
  return Buffer.from(buffer);
}

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
];

function buildPrompt(
  resultData: { semester?: string; fileName?: string },
  question: string,
  conversationHistory?: Array<{ role: string; content: string }>,
  pdfText?: string
): string {
  let prompt = `You are an AI assistant helping a student analyze their academic results/marksheet.

STUDENT'S RESULT INFORMATION:
- Semester: ${resultData.semester || "Unknown"}
- File Name: ${resultData.fileName || "Unknown"}`;

  if (pdfText) {
    const maxLen = 150000;
    prompt += `\n\nRESULT PDF TEXT (${pdfText.length} characters):\n${pdfText.substring(0, maxLen)}${pdfText.length > maxLen ? "\n\n[Content truncated...]" : ""}`;
  } else {
    prompt += `\n\nThe student's marksheet PDF is attached. Read it carefully to answer questions.`;
  }

  if (conversationHistory?.length) {
    prompt += `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.map((msg) =>
      `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`
    ).join("\n")}`;
  }

  prompt += `\n\nSTUDENT'S QUESTION: ${question}

INSTRUCTIONS:
1. Answer based on the marksheet content (text or attached PDF).
2. For CGPA questions, calculate from actual grades and credits shown.
3. Be specific with actionable insights.
4. Use conversation history for follow-up context.
5. Do NOT use markdown formatting. Plain text only.

Please provide a helpful answer:`;

  return prompt;
}

async function askGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      if (answer?.trim()) return answer;
      throw new Error("Empty response from Gemini API");
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${modelName} failed:`, error.message);
    }
  }

  throw new Error(`Failed to get answer: ${lastError?.message || "All models failed"}`);
}

async function askGeminiVision(prompt: string, pdfBuffer: Buffer): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const pdfPart = {
    inlineData: {
      data: pdfBuffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };

  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, pdfPart]);
      const answer = result.response.text();
      if (answer?.trim()) return answer;
      throw new Error("Empty response from Gemini API");
    } catch (error: any) {
      lastError = error;
      console.warn(`Vision model ${modelName} failed:`, error.message);
    }
  }

  throw new Error(`Failed to get answer: ${lastError?.message || "All models failed"}`);
}

export async function POST(request: NextRequest) {
  try {
    const { resultId, question, conversationHistory, userId: bodyUserId } = await request.json();

    if (!resultId || !question) {
      return NextResponse.json(
        { error: "Result ID and question are required" },
        { status: 400 }
      );
    }

    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, bodyUserId);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    const rateLimitResponse = applyGeminiRateLimits(request, userId);
    if (rateLimitResponse) return rateLimitResponse;

    initializeAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const resultDoc = await adminDb.collection("results").doc(resultId).get();
    if (!resultDoc.exists) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const resultData = resultDoc.data()!;

    // Only the owner can analyze their marksheet.
    if (resultData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const extractedText = (resultData.extractedText as string) || "";

    let answer: string;

    // Prefer cached text when available (fast path, works locally and on Vercel).
    if (extractedText.trim().length > 100) {
      const prompt = buildPrompt(resultData, question, conversationHistory, extractedText);
      answer = await askGeminiText(prompt);
    } else {
      // Vercel-safe fallback: send the PDF directly to Gemini Vision.
      // Local pdf-parse / canvas / tesseract do not work reliably on serverless.
      if (!resultData.storagePath) {
        return NextResponse.json(
          { error: "Result PDF path not found. Please re-upload your marksheet." },
          { status: 404 }
        );
      }

      const pdfBuffer = await downloadResultPdf(resultData.storagePath as string);
      const prompt = buildPrompt(resultData, question, conversationHistory);
      answer = await askGeminiVision(prompt, pdfBuffer);
    }

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error("Error analyzing result:", error);
    return geminiApiErrorResponse(error);
  }
}
