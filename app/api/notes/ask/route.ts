import { NextRequest, NextResponse } from "next/server";
import { academicEngine } from "@/lib/gemini/client";

export async function POST(request: NextRequest) {
  try {
    const { question, fileContent, fileName, title, summary, keyTopics, conversationHistory } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Build context for the question
    let context = "";

    if (summary) {
      context += `Summary: ${summary}\n\n`;
    }

    if (keyTopics && Array.isArray(keyTopics) && keyTopics.length > 0) {
      context += `Key Topics: ${keyTopics.join(", ")}\n\n`;
    }

    if (title) {
      context += `Title: ${title}\n\n`;
    }

    if (fileName) {
      context += `File: ${fileName}\n\n`;
    }

    if (fileContent && fileContent.trim().length > 0) {
      // Include relevant portion of content (first 50000 chars for better context)
      context += `DOCUMENT CONTENT:\n${fileContent.substring(0, 50000)}`;
      console.log(`Using extracted text for Q&A: ${fileContent.length} characters`);
    } else {
      console.warn("No fileContent provided for Q&A - will use summary/title only");
    }

    // Include conversation history for context
    let historyContext = "";
    if (conversationHistory) {
      historyContext = `\n\nPrevious Conversation:\n${conversationHistory}\n\n`;
    }

    const prompt = `You are an AI assistant helping a student understand their study materials.

${context}${historyContext}STUDENT QUESTION: ${question}

INSTRUCTIONS:
1. Answer the question based on the ACTUAL DOCUMENT CONTENT provided above
2. If document content is provided, prioritize it over summary and key topics
3. If there's conversation history, use it to provide context-aware follow-up answers
4. Be clear, concise, and helpful
5. If the question cannot be answered from the provided document content, say so
6. IMPORTANT: Do NOT use markdown formatting (no asterisks, underscores, or markdown symbols). Use plain text only.

Provide your answer:`;

    const answer = await academicEngine.explainRule("Passing", prompt);

    return NextResponse.json({
      answer,
    });
  } catch (error: any) {
    console.error("Error answering question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to answer question" },
      { status: 500 }
    );
  }
}
