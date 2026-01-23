import { NextRequest, NextResponse } from "next/server";
import { academicEngine } from "@/lib/gemini/client";

export async function POST(request: NextRequest) {
  try {
    const { fileContent, fileName, title, description } = await request.json();

    if (!fileContent && !title && !description) {
      return NextResponse.json(
        { error: "File content, title, or description required" },
        { status: 400 }
      );
    }

    // Build prompt for summarization based on available information
    const contentToUse = fileContent && fileContent.trim().length > 0
      ? fileContent.substring(0, 100000) // Use up to 100k chars for context
      : null;
    
    console.log(`Summarization request - hasContent: ${!!contentToUse}, contentLength: ${contentToUse?.length || 0}, fileName: ${fileName}, title: ${title}`);

    const prompt = `You are an AI assistant helping students understand study materials.

${fileName ? `File Name: ${fileName}` : ""}
${title ? `Title: ${title}` : ""}
${description ? `Description: ${description}` : ""}

${contentToUse 
  ? `DOCUMENT CONTENT:\n${contentToUse}\n\nPlease analyze the ACTUAL CONTENT above and provide:` 
  : "Based on the file name, title, and description provided above, please provide:"}

Please provide:
1. A concise summary (2-3 paragraphs) of the key concepts and main topics covered in this study material
2. A list of key topics actually covered in the document (as a comma-separated list)
3. Important points students should focus on

${contentToUse 
  ? "IMPORTANT: Base your response ONLY on the actual document content provided above. Analyze the text and extract real information from it."
  : "IMPORTANT: Base your response ONLY on the file name, title, and description provided. Do not make up generic content."}

Format your response as JSON:
{
  "summary": "Your summary here",
  "keyTopics": ["topic1", "topic2", "topic3"]
}`;

    const response = await academicEngine.explainRule("Passing", prompt);

    // Try to parse JSON from response
    let summary = "";
    let keyTopics: string[] = [];

    try {
      // Extract JSON from response if it's wrapped in markdown
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || response;
        // Ensure keyTopics is always an array
        if (Array.isArray(parsed.keyTopics)) {
          keyTopics = parsed.keyTopics;
        } else if (typeof parsed.keyTopics === 'string') {
          keyTopics = parsed.keyTopics.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
        }
      } else {
        summary = response;
        // Try to extract topics from text
        const topicsMatch = response.match(/topics?[:\-]\s*([^\n]+)/i);
        if (topicsMatch) {
          keyTopics = topicsMatch[1]
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);
        }
      }
    } catch {
      summary = response;
      keyTopics = [];
    }

    // Ensure keyTopics is always an array
    if (!Array.isArray(keyTopics)) {
      keyTopics = [];
    }

    return NextResponse.json({
      summary,
      keyTopics,
    });
  } catch (error: any) {
    console.error("Error summarizing note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize note" },
      { status: 500 }
    );
  }
}
