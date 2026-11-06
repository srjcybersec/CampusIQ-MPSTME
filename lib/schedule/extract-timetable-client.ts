import { GoogleGenerativeAI } from "@google/generative-ai";
import { guardClientGeminiUse } from "@/lib/ai/client-gemini-guard";
import { ExtractedScheduleEntry, stripJsonMarkdown } from "./timetable-parser";

const EXTRACTION_PROMPT = `Extract this college timetable into a JSON array. MPSTME/NMIMS style grid.

Rules:
- Mon→Sat, read each time slot left to right. Use 24-hour times (1:00 PM = 13:00).
- Split K1/K2 cells into separate entries. Whole-division classes: omit batch field.
- Use legend for full subject/faculty names. Include Saturday, breaks, project day.

Each entry: day, time, startTime, endTime, subject, subjectCode, faculty, facultyInitials, room, batch, type.

Return ONLY a JSON array.`;

const MODELS = ["gemini-2.5-flash", "gemini-flash-latest"];

function isRetryable(error: unknown): boolean {
  const msg = (error as Error)?.message || "";
  return msg.includes("429") || msg.includes("503") || msg.includes("overloaded") || msg.includes("quota");
}

/**
 * Run Gemini vision in the browser — avoids Vercel's 10–60s serverless timeout.
 * The API key is already public (NEXT_PUBLIC_GEMINI_API_KEY).
 */
export async function extractTimetableFromImage(
  base64: string,
  mimeType: string,
  onProgress?: (message: string) => void,
  userId?: string
): Promise<ExtractedScheduleEntry[]> {
  const guard = guardClientGeminiUse(userId);
  if (!guard.ok) {
    throw new Error(guard.message);
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const filePart = { inlineData: { data: base64, mimeType } };

  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    onProgress?.(`Reading timetable with ${modelName}...`);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        });

        const result = await model.generateContent([EXTRACTION_PROMPT, filePart]);
        const text = result.response.text()?.trim();
        if (!text) throw new Error("Empty response from AI");

        const parsed = JSON.parse(stripJsonMarkdown(text));
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("AI returned an empty schedule");
        }
        return parsed as ExtractedScheduleEntry[];
      } catch (error: unknown) {
        lastError = error as Error;
        if (isRetryable(error) && attempt === 0) {
          onProgress?.("AI busy, retrying in a moment...");
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        break;
      }
    }
  }

  const reason = lastError?.message || "";
  if (reason.includes("429") || reason.toLowerCase().includes("quota")) {
    throw new Error(
      "AI is busy right now — CampusIQ is on the free beta plan (limited requests per minute). Please wait about 60 seconds and try again."
    );
  }
  throw new Error(
    lastError?.message ||
      "Could not read your timetable. Ensure the full grid and time column are visible."
  );
}
