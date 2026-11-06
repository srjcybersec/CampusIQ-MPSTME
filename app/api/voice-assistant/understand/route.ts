import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminDb } from "@/lib/firebase/admin";
import { matchLocalCommand, parseGeminiCommandJson, MatchedVoiceCommand } from "@/lib/voice-assistant/local-command-matcher";
import { applyGeminiRateLimits, geminiApiErrorResponse } from "@/lib/ai/gemini-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Full catalog of everything SNEHA can do. This doubles as documentation for the
 * Gemini prompt and as the contract the client (components/voice-assistant/sneha.tsx)
 * implements in executeAction().
 */
const ACTION_CATALOG = `
NAVIGATION (action: "navigate", parameters: { path })
- Dashboard / Home -> /
- Academics hub -> /academics
- Schedule / Timetable -> /schedule
- Resources hub -> /resources
- PYQ papers -> /resources/pyqs
- Notes -> /resources/notes
- Assignments -> /resources/assignments
- Campus hub -> /campus
- Canteen menu / order food -> /campus
- My canteen orders -> /campus/canteen/orders
- Community -> /community
- Events -> /community/events
- Campus Voices -> /community/campus-voices
- Services -> /services
- Extras -> /extras
- Matrimony -> /extras/matrimony

SECTION SHORTCUTS (these open a specific tab inside Academics)
- action: "check_attendance"  -> opens the attendance tracker
- action: "check_results"     -> opens the results viewer/analyzer
- action: "open_srb"          -> opens the Student Resource Book
- action: "open_policy"       -> opens the Examination Policy
- action: "open_pyqs"         -> opens PYQ repository
- action: "open_notes"        -> opens notes
- action: "open_assignments"  -> opens assignments

READ-BACK ACTIONS (SNEHA fetches live data and SPEAKS it out loud - preferred when the
user asks "what", "when", "do I have", "tell me", "any" etc. rather than "go to"/"open")
- action: "read_schedule"   parameters: { day?: "today" | "tomorrow" | "Monday".."Sunday" }
    Use for "what's my schedule", "what classes do I have today", "when is my next class",
    "do I have class tomorrow", "what's my first class".
- action: "read_results"    -> speaks the user's most recent uploaded result info
- action: "read_orders"     -> speaks the user's recent canteen orders and their status
- action: "check_alerts"    -> speaks pending reminders / upcoming class alerts

KNOWLEDGE / RAG ACTIONS (SNEHA answers from a specific document)
- action: "query_srb"     parameters: { question }  -> answers from the Student Resource Book
- action: "query_policy"  parameters: { question }  -> answers from the Examination Policy

PYQ DOWNLOAD (action: "download_pyq", parameters: { subject?, semester?, branch? })
- "download pyq for Artificial Intelligence semester 5"

GENERAL CONVERSATION (action: "answer", parameters: { speech })
- Use this for greetings, thanks, small talk, general study questions, motivation,
  clarifying questions, or ANY request that does not map to a concrete action above.
- Put your full spoken reply in parameters.speech. Never refuse with "I didn't understand" -
  always be helpful and answer conversationally.
`;

async function findPyqId(params: Record<string, any>): Promise<string | undefined> {
  try {
    const db = await getAdminDb();
    let query: FirebaseFirestore.Query = db.collection("pyqs");

    if (params.branch) query = query.where("branch", "==", params.branch);
    if (params.semester) query = query.where("semester", "==", String(params.semester));
    if (params.subject) query = query.where("subject", "==", params.subject);

    let snapshot = await query.limit(1).get();

    // Fall back to case-insensitive subject match within the semester
    if (snapshot.empty && params.subject) {
      let loose: FirebaseFirestore.Query = db.collection("pyqs");
      if (params.semester) loose = loose.where("semester", "==", String(params.semester));
      const looseSnap = await loose.limit(25).get();
      const wanted = String(params.subject).toLowerCase();
      const match = looseSnap.docs.find((doc) => {
        const s = (doc.data().subject || "").toLowerCase();
        return s.includes(wanted) || wanted.includes(s);
      });
      return match?.id;
    }

    return snapshot.empty ? undefined : snapshot.docs[0].id;
  } catch (error) {
    console.error("[SNEHA] Error finding PYQ:", error);
    return undefined;
  }
}

function normalizeSubject(subject?: string): string | undefined {
  if (!subject) return undefined;
  const s = subject.trim();
  if (/\b(ai|artificial intelligence|artificial)\b/i.test(s)) {
    return "Artificial Intelligence";
  }
  return s;
}

async function enrichCommand(command: MatchedVoiceCommand): Promise<MatchedVoiceCommand> {
  const enriched = { ...command, parameters: { ...command.parameters } };

  if (enriched.action === "download_pyq") {
    enriched.parameters.subject = normalizeSubject(enriched.parameters.subject);
    const pyqId = await findPyqId(enriched.parameters);
    if (pyqId) enriched.parameters.pyqId = pyqId;
  }

  return enriched;
}

export async function POST(request: NextRequest) {
  try {
    const { command, currentPath, conversationHistory, userId } = await request.json();

    if (!command || !command.trim()) {
      return NextResponse.json({ error: "No command provided" }, { status: 400 });
    }

    // Fast deterministic match — avoids Gemini flakiness for common navigation
    const localMatch = matchLocalCommand(command);
    if (localMatch) {
      const enriched = await enrichCommand(localMatch);
      return NextResponse.json({
        success: true,
        command: enriched,
        response: enriched.response,
      });
    }

    const rateLimitResponse = applyGeminiRateLimits(request, userId);
    if (rateLimitResponse) return rateLimitResponse;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Voice assistant is not configured." },
        { status: 500 }
      );
    }

    const historyText = Array.isArray(conversationHistory) && conversationHistory.length > 0
      ? conversationHistory
          .slice(-6)
          .map((m: any) => `${m.role === "user" ? "User" : "SNEHA"}: ${m.content}`)
          .join("\n")
      : "(no previous conversation)";

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    });

    const prompt = `You are SNEHA (Smart Navigation & Educational Helper Assistant), the friendly, proactive AI voice assistant inside CampusIQ - a college portal for MPSTME students. You are warm, concise, and genuinely helpful. You speak in natural spoken English (this will be read aloud by text-to-speech), so keep replies short, clear, and free of markdown, bullet points, emojis, or symbols.

Your job: read the user's request and pick the SINGLE best action from the catalog below, then write a short natural spoken reply.

${ACTION_CATALOG}

CONTEXT
- Current page the user is on: ${currentPath || "unknown"}
- Recent conversation:
${historyText}

RULES
- Speech recognition is imperfect. Interpret generously: "py"/"py q" = PYQ, "AI" = Artificial Intelligence, "SRB"/"ask me"/"as me" = Student Resource Book, "sem" = semester.
- Prefer a READ-BACK action over navigation when the user is ASKING for information (what/when/do I have/any/tell me). Prefer navigation when they say go/open/take me/show me the page.
- If the request is a general question, greeting, thanks, or anything not matching a concrete action, use action "answer" and put a helpful spoken reply in parameters.speech.
- NEVER say you don't understand. Always be useful.
- The "response" field is what SNEHA says out loud BEFORE the action runs (e.g. "Sure, opening your schedule" or the actual answer for read/answer actions). Keep it under 2 sentences.

Respond with ONLY a JSON object of this exact shape:
{
  "intent": "short description",
  "action": "one action name from the catalog",
  "parameters": { },
  "response": "what SNEHA says out loud"
}

The user said: "${command}"`;

    let commandData: MatchedVoiceCommand | null = null;
    try {
      const result = await model.generateContent(prompt);
      commandData = parseGeminiCommandJson(result.response.text());
    } catch (parseError) {
      console.error("[SNEHA] Gemini error:", parseError);
    }

    if (!commandData) {
      // Second-chance local match after Gemini failure
      const fallback = matchLocalCommand(command);
      if (fallback) {
        const enriched = await enrichCommand(fallback);
        return NextResponse.json({
          success: true,
          command: enriched,
          response: enriched.response,
        });
      }

      return NextResponse.json({
        success: true,
        command: {
          intent: "conversational fallback",
          action: "answer",
          parameters: {
            speech:
              "I'm not sure what you meant. Try saying open schedule, open campus voices, or what classes do I have tomorrow.",
          },
          response:
            "I'm not sure what you meant. Try saying open schedule, open campus voices, or what classes do I have tomorrow.",
        },
        response:
          "I'm not sure what you meant. Try saying open schedule, open campus voices, or what classes do I have tomorrow.",
      });
    }

    const enriched = await enrichCommand(commandData);

    return NextResponse.json({
      success: true,
      command: enriched,
      response: enriched.response,
    });
  } catch (error: any) {
    console.error("[SNEHA] Error understanding voice command:", error);
    const quotaResp = geminiApiErrorResponse(error);
    if (quotaResp.status === 429) {
      const body = await quotaResp.json();
      return NextResponse.json({
        success: false,
        error: body.error,
        response: body.message,
        retryAfter: body.retryAfter,
      }, { status: 429 });
    }
    return NextResponse.json(
      { success: false, error: "Sorry, I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
