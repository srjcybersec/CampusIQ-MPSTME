import { NextRequest, NextResponse } from "next/server";
import { academicEngine } from "@/lib/gemini/client";

/**
 * POST /api/academics/examination-policy/ask
 * Answer questions about the Examination Policy
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

    // Phase 4: Enhance question with conversation history for context
    let enhancedQuestion = question;
    if (conversationHistory && conversationHistory.length > 0) {
      const historyContext = conversationHistory
        .slice(-3) // Last 3 messages
        .map((msg: any) => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
        .join("\n");
      enhancedQuestion = `Previous conversation:\n${historyContext}\n\nCurrent question: ${question}`;
    }

    // Use the academic engine to answer the question
    const answer = await academicEngine.answerExaminationPolicyQuestion(enhancedQuestion);

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    console.error("Error answering Examination Policy question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to answer question" },
      { status: 500 }
    );
  }
}
