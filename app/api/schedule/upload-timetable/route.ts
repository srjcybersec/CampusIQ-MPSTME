import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeAdmin } from "@/lib/firebase/admin";
import { TimetableEntry } from "@/lib/data/timetable";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
}

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

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, userId } = await request.json();

    if (!image || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: image and userId" },
        { status: 400 }
      );
    }

    // Validate that it's an image file
    if (!mimeType || !mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files (JPG, PNG, WebP) are supported. Please upload an image of your timetable." },
        { status: 400 }
      );
    }

    // Initialize Gemini with fallback model strategy
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Try models in order of preference (vision-capable models)
    const modelsToTry = [
      "gemini-2.5-flash",      // Primary - fastest, supports vision
      "gemini-2.5-pro",        // Fallback - more capable
      "gemini-2.0-flash",      // Fallback
      "gemini-1.5-pro",        // Fallback
      "gemini-1.5-flash",      // Fallback
    ];

    let model;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        // Test if model is accessible by checking if it exists
        // We'll catch errors during actual generation
        break;
      } catch (error: any) {
        console.warn(`Model ${modelName} initialization failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!model) {
      throw new Error(`No available Gemini model found. Last error: ${lastError?.message || "Unknown error"}`);
    }

    // Prepare the prompt
    const prompt = `You are analyzing a college timetable image. Extract all schedule entries from this timetable and return them as a JSON array.

For each entry, extract:
- day: Day of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
- time: Time range in format "HH:MM-HH:MM" (24-hour format)
- startTime: Start time in format "HH:MM"
- endTime: End time in format "HH:MM"
- subject: Full subject name
- subjectCode: Subject code/abbreviation (if available)
- faculty: Professor/teacher name (if available)
- facultyInitials: Faculty initials (if available)
- room: Classroom/room number (if available)
- batch: Batch number like K1, K2, etc. (if applicable)
- type: Type of class - "lecture", "lab", "break", "placement", or "elective" (if identifiable)

Important:
1. Extract ALL entries from the timetable, including breaks
2. For breaks, set type to "break" and leave other fields empty
3. Ensure times are in 24-hour format (HH:MM)
4. If a subject appears multiple times on the same day, create separate entries
5. If batch information is present (like K1/K2), include it
6. Return ONLY valid JSON array, no markdown, no explanations

Example format:
[
  {
    "day": "Monday",
    "time": "09:00-10:00",
    "startTime": "09:00",
    "endTime": "10:00",
    "subject": "Digital Forensics",
    "subjectCode": "DFIR",
    "faculty": "Prof. John Doe",
    "facultyInitials": "JDO",
    "room": "CR-507",
    "batch": "K1",
    "type": "lecture"
  }
]`;

    // Process image with Gemini Vision
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: mimeType || "image/jpeg",
      },
    };

    // Helper function to generate content with retry logic
    const generateWithRetry = async (modelInstance: any, modelName: string, maxRetries: number = 3): Promise<string> => {
      let lastError: any = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await modelInstance.generateContent([prompt, imagePart]);
          const response = await result.response;
          const text = response.text();
          if (text) {
            return text;
          }
        } catch (error: any) {
          lastError = error;
          const isOverloaded = error.message?.includes("overloaded") || 
                              error.message?.includes("503") ||
                              error.status === 503;
          
          if (isOverloaded && attempt < maxRetries - 1) {
            // Exponential backoff: wait 1s, 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Model ${modelName} overloaded, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If not overloaded or last retry, throw immediately
          throw error;
        }
      }
      
      throw lastError || new Error("Max retries exceeded");
    };

    // Try to generate content, with fallback to other models if needed
    let text: string = "";
    let generationError: any = null;
    
    try {
      text = await generateWithRetry(model, modelsToTry[0]);
      console.log(`✅ Successfully used primary model: ${modelsToTry[0]}`);
    } catch (error: any) {
      // If the first model fails, try fallback models
      const isOverloaded = error.message?.includes("overloaded") || 
                          error.message?.includes("503") ||
                          error.status === 503;
      
      console.warn(`Primary model failed:`, error.message);
      generationError = error;
      
      // If overloaded, wait a bit before trying fallbacks
      if (isOverloaded) {
        console.log("Primary model overloaded, waiting before trying fallbacks...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      for (const modelName of modelsToTry.slice(1)) {
        try {
          const fallbackModel = genAI.getGenerativeModel({ model: modelName });
          text = await generateWithRetry(fallbackModel, modelName, 2); // Fewer retries for fallbacks
          console.log(`✅ Successfully used fallback model: ${modelName}`);
          generationError = null; // Clear error on success
          break;
        } catch (fallbackError: any) {
          console.warn(`Fallback model ${modelName} failed:`, fallbackError.message);
          generationError = fallbackError;
          continue;
        }
      }
      
      // If all models failed, provide user-friendly error message
      if (!text && generationError) {
        const isOverloadedError = generationError.message?.includes("overloaded") || 
                                  generationError.message?.includes("503") ||
                                  generationError.status === 503;
        
        if (isOverloadedError) {
          throw new Error("The AI service is currently overloaded. Please wait a moment and try again. This usually resolves within a few seconds.");
        }
        
        throw new Error(`Failed to process timetable image. ${generationError.message || "Please try again later."}`);
      }
    }
    
    if (!text) {
      throw new Error("Failed to generate content from timetable image. Please try again.");
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
        batch: entry.batch as "K1" | "K2" | undefined,
        type: (isBreak ? "break" : entry.type) || "lecture",
      };
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
      return docRef.set({
        ...entry,
        userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await Promise.all(savePromises);

    return NextResponse.json({
      success: true,
      entriesCount: normalizedEntries.length,
      entries: normalizedEntries,
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
