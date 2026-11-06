import { NextRequest, NextResponse } from "next/server";
import { academicEngine } from "@/lib/gemini/client";
import { applyGeminiRateLimits, geminiApiErrorResponse } from "@/lib/ai/gemini-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { results, subjects, userId } = await request.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Attendance results are required" }, { status: 400 });
    }

    const rateLimitResponse = applyGeminiRateLimits(request, userId);
    if (rateLimitResponse) return rateLimitResponse;

    const summary = await academicEngine.generateAttendanceSummary(results, subjects || []);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[Attendance Summary] Error:", error);
    return geminiApiErrorResponse(error);
  }
}
