import { NextRequest, NextResponse } from "next/server";
import { academicEngine } from "@/lib/gemini/client";
import { applyGeminiRateLimits, geminiApiErrorResponse } from "@/lib/ai/gemini-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { question, results, subjects, userId } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const rateLimitResponse = applyGeminiRateLimits(request, userId);
    if (rateLimitResponse) return rateLimitResponse;

    const answer = await academicEngine.answerAttendanceQuestion(
      question.trim(),
      results || [],
      subjects || []
    );

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("[Attendance Ask] Error:", error);
    return geminiApiErrorResponse(error);
  }
}
