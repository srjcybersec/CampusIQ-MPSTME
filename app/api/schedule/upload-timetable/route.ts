import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeAdmin } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import { TimetableEntry } from "@/lib/data/timetable";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface ExtractedScheduleEntry {
  day: string;
  time: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  faculty?: string;
  facultyInitials?: string;
  room?: string;
  batch?: string;
  type?: "lecture" | "lab" | "break" | "placement" | "elective";
}

function parseTimeRange(timeStr: string): { startTime: string; endTime: string } {
  // Handle formats like "09:00-10:00", "9:00 AM - 10:00 AM", "09:00 to 10:00"
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?\s*[-to]+\s*(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?/i);
  if (timeMatch) {
    let startHour = parseInt(timeMatch[1]);
    let endHour = parseInt(timeMatch[3]);
    const startMin = timeMatch[2];
    const endMin = timeMatch[4];
    
    // Handle 12-hour format
    if (timeStr.toLowerCase().includes("pm") && startHour !== 12) {
      startHour += 12;
    }
    if (timeStr.toLowerCase().includes("pm") && endHour !== 12 && parseInt(timeMatch[3]) < 12) {
      endHour += 12;
    }
    
    return {
      startTime: `${startHour.toString().padStart(2, "0")}:${startMin}`,
      endTime: `${endHour.toString().padStart(2, "0")}:${endMin}`,
    };
  }
  
  // Handle 24-hour format "HH:MM-HH:MM"
  const simpleMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*[-to]+\s*(\d{1,2}):(\d{2})/);
  if (simpleMatch) {
    return {
      startTime: `${simpleMatch[1].padStart(2, "0")}:${simpleMatch[2]}`,
      endTime: `${simpleMatch[3].padStart(2, "0")}:${simpleMatch[4]}`,
    };
  }
  
  return { startTime: "09:00", endTime: "10:00" };
}

function normalizeDay(day: string): "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" {
  const dayLower = day.toLowerCase().trim();
  if (dayLower.startsWith("mon")) return "Monday";
  if (dayLower.startsWith("tue")) return "Tuesday";
  if (dayLower.startsWith("wed")) return "Wednesday";
  if (dayLower.startsWith("thu")) return "Thursday";
  if (dayLower.startsWith("fri")) return "Friday";
  if (dayLower.startsWith("sat")) return "Saturday";
  return "Monday"; // Default
}

// Normalize batch labels: uppercase, strip spaces/punctuation. "k 1" -> "K1", "(K2)" -> "K2"
function normalizeBatch(batch?: string): string | undefined {
  if (!batch) return undefined;
  const cleaned = batch.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
  return cleaned || undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, userId: bodyUserId, batch: requestedBatch } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Missing required fields: image" },
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

    // Accept images and PDFs (Gemini vision can read both)
    const isImage = mimeType?.startsWith("image/");
    const isPdf = mimeType === "application/pdf";
    if (!mimeType || (!isImage && !isPdf)) {
      return NextResponse.json(
        { error: "Only image (JPG, PNG, WebP) or PDF files are supported. Please upload your timetable." },
        { status: 400 }
      );
    }

    const userBatch = normalizeBatch(requestedBatch);

    // Initialize Gemini with fallback model strategy
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // gemini-2.0-flash is quota-limited on this key — use flash-latest / 2.5-pro as fallbacks
    const MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro"];

    const prompt = `Extract this college timetable into a JSON array. MPSTME/NMIMS style grid.

READ METHOD: Process ONE DAY AT A TIME (Mon→Sat), left-to-right through each time slot.
- Use exact time labels from the grid header (24-hour: afternoon 1:00 = 13:00).
- SPLIT CELLS: if a slot has K1/K2 halves with different subjects, output separate entries per batch.
- Whole-division classes: batch = "".
- Merged multi-hour cells = one entry spanning full time range.
- Use the legend at bottom for full subject names and faculty names.
- Include Saturday if present. Include BREAK/PROJECT DAY entries.

Each entry fields: day, time, startTime, endTime, subject, subjectCode, faculty, facultyInitials, room, batch, type (lecture|lab|break|placement|elective).

Return ONLY a JSON array, no markdown.`;

    const filePart = {
      inlineData: {
        data: image,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const isRetryable = (error: any) => {
      const msg = error?.message || "";
      return (
        msg.includes("overloaded") ||
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("quota") ||
        error?.status === 503 ||
        error?.status === 429
      );
    };

    let lastGeminiError: any = null;

    const tryGenerate = async (modelName: string, useJsonMode: boolean): Promise<string | null> => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: useJsonMode
          ? { responseMimeType: "application/json", temperature: 0.1 }
          : { temperature: 0.1 },
      });

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await model.generateContent([prompt, filePart]);
          const responseText = result.response.text()?.trim();
          if (responseText) {
            console.log(`[Timetable] Extracted using ${modelName} (json=${useJsonMode})`);
            return responseText;
          }
          console.warn(`[Timetable] ${modelName} returned empty response`);
        } catch (error: any) {
          lastGeminiError = error;
          console.warn(`[Timetable] ${modelName} attempt ${attempt + 1} failed:`, error.message);
          if (isRetryable(error) && attempt === 0) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          return null;
        }
      }
      return null;
    };

    let text: string | null = null;

    for (const modelName of MODELS) {
      text = await tryGenerate(modelName, true);
      if (text) break;
      text = await tryGenerate(modelName, false);
      if (text) break;
    }

    if (!text) {
      const reason = lastGeminiError?.message || "";
      if (reason.includes("429") || reason.toLowerCase().includes("quota")) {
        throw new Error(
          "AI service is busy right now (rate limit). Please wait 30 seconds and try again."
        );
      }
      throw new Error(
        "Could not read your timetable. Make sure the photo is clear, well-lit, and shows the full grid including the time column and legend."
      );
    }

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const extractedEntries: ExtractedScheduleEntry[] = JSON.parse(jsonText);

    // Normalize and validate entries
    const normalizedEntries: TimetableEntry[] = extractedEntries.map((entry, index) => {
      const { startTime, endTime } = parseTimeRange(entry.time || `${entry.startTime}-${entry.endTime}`);
      
      // For breaks, ensure subject is set to "Break"
      const isBreak = entry.type === "break" || entry.subject?.toLowerCase().includes("break");
      const subject = isBreak ? "Break" : (entry.subject || "Unknown");
      
      return {
        id: `${userId}-${normalizeDay(entry.day).toLowerCase()}-${index}`,
        day: normalizeDay(entry.day),
        time: entry.time || `${startTime}-${endTime}`,
        startTime,
        endTime,
        subject: subject,
        subjectCode: entry.subjectCode || (isBreak ? "BREAK" : ""),
        faculty: entry.faculty || "",
        facultyInitials: entry.facultyInitials || "",
        room: entry.room || "",
        batch: normalizeBatch(entry.batch),
        type: (isBreak ? "break" : entry.type) || "lecture",
      };
    });

    // Collect the distinct batches found so the UI can offer a batch filter
    const availableBatches = Array.from(
      new Set(
        normalizedEntries
          .map((e) => e.batch)
          .filter((b): b is string => !!b)
      )
    ).sort();

    // Sort entries by day, then by startTime to ensure chronological order
    normalizedEntries.sort((a, b) => {
      // First sort by day
      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      
      // Then sort by startTime (chronological order)
      return a.startTime.localeCompare(b.startTime);
    });

    // Initialize Firebase Admin
    const { db: adminDb } = await initializeAdmin();

    // Delete existing schedule entries for this user
    const existingScheduleSnapshot = await adminDb
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    const batch = adminDb.batch();
    existingScheduleSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Save new schedule entries
    const { FieldValue } = await import("firebase-admin/firestore");
    const savePromises = normalizedEntries.map((entry) => {
      const docRef = adminDb.collection("schedules").doc();
      const { batch: entryBatch, ...entryRest } = entry;
      const firestoreData: Record<string, unknown> = {
        ...entryRest,
        userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (entryBatch) firestoreData.batch = entryBatch;
      return docRef.set(firestoreData);
    });

    await Promise.all(savePromises);

    // Persist the user's batch preference (only if it is one that actually exists,
    // otherwise fall back to the first detected batch or leave unset)
    let effectiveBatch = userBatch;
    if (effectiveBatch && availableBatches.length > 0 && !availableBatches.includes(effectiveBatch)) {
      effectiveBatch = undefined; // requested batch not found in this timetable
    }

    await adminDb
      .collection("scheduleMeta")
      .doc(userId)
      .set(
        {
          userId,
          batch: effectiveBatch || null,
          availableBatches,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({
      success: true,
      entriesCount: normalizedEntries.length,
      entries: normalizedEntries,
      availableBatches,
      batch: effectiveBatch || null,
    });
  } catch (error: any) {
    console.error("Error processing timetable:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process timetable",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
