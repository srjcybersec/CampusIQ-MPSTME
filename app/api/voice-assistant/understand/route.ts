import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
}

// Lazy initialization of Firebase Admin
let adminDb: Firestore | null = null;

function getAdminDb(): Firestore | null {
  if (adminDb) {
    return adminDb;
  }

  try {
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        let formattedPrivateKey = privateKey;
        try {
          const parsed = JSON.parse(privateKey);
          if (typeof parsed === "string") {
            formattedPrivateKey = parsed;
          }
        } catch {
          // Not JSON, use as-is
        }
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
        formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });
        adminDb = getFirestore();
        return adminDb;
      } else {
        console.warn("Firebase Admin credentials not found.");
        return null;
      }
    } else {
      adminDb = getFirestore();
      return adminDb;
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

interface VoiceCommand {
  intent: string;
  action: string;
  parameters?: Record<string, any>;
  response?: string;
}

// Available actions and their mappings
const ACTION_MAPPINGS: Record<string, { action: string; path?: string; response: string }> = {
  // Navigation
  schedule: { action: "navigate", path: "/schedule", response: "Opening your schedule" },
  timetable: { action: "navigate", path: "/schedule", response: "Opening your timetable" },
  academics: { action: "navigate", path: "/academics", response: "Opening academics section" },
  resources: { action: "navigate", path: "/resources", response: "Opening resources" },
  campus: { action: "navigate", path: "/campus", response: "Opening campus section" },
  community: { action: "navigate", path: "/community", response: "Opening community" },
  services: { action: "navigate", path: "/services", response: "Opening services" },
  extras: { action: "navigate", path: "/extras", response: "Opening extras" },
  home: { action: "navigate", path: "/", response: "Going to home" },
  dashboard: { action: "navigate", path: "/", response: "Going to dashboard" },

  // Attendance
  attendance: { action: "check_attendance", response: "Checking your attendance" },
  "attendance status": { action: "check_attendance", response: "Opening attendance tracker" },

  // Schedule queries
  "today's schedule": { action: "check_schedule", response: "Showing today's schedule" },
  "my schedule": { action: "check_schedule", response: "Opening your schedule" },
  "class schedule": { action: "check_schedule", response: "Showing your class schedule" },

  // Results
  results: { action: "check_results", response: "Opening your results" },
  grades: { action: "check_results", response: "Showing your grades" },
  "my results": { action: "check_results", response: "Opening results viewer" },

  // PYQs
  pyqs: { action: "open_pyqs", response: "Opening previous year question papers" },
  "previous year questions": { action: "open_pyqs", response: "Opening PYQ repository" },
  "question papers": { action: "open_pyqs", response: "Opening question papers" },

  // Notes
  notes: { action: "open_notes", response: "Opening your notes" },
  "my notes": { action: "open_notes", response: "Showing your notes" },

  // Assignments
  assignments: { action: "open_assignments", response: "Opening assignments" },
  "my assignments": { action: "open_assignments", response: "Showing your assignments" },

  // Student Resource Book
  srb: { action: "open_srb", response: "Opening Student Resource Book" },
  "resource book": { action: "open_srb", response: "Opening Student Resource Book" },
  "student resource book": { action: "open_srb", response: "Opening Student Resource Book" },

  // Examination Policy
  policy: { action: "open_policy", response: "Opening examination policy" },
  "examination policy": { action: "open_policy", response: "Opening examination policy" },
  rules: { action: "open_policy", response: "Opening examination rules" },
  
  // Query actions (Phase 3)
  "ask srb": { action: "query_srb", response: "Let me check the Student Resource Book for you" },
  "srb question": { action: "query_srb", response: "Searching the Student Resource Book" },
  "ask policy": { action: "query_policy", response: "Let me check the Examination Policy for you" },
  "policy question": { action: "query_policy", response: "Searching the Examination Policy" },
  
  // Proactive assistance (Phase 4)
  "check alerts": { action: "check_alerts", response: "Checking for alerts and reminders" },
  "show alerts": { action: "check_alerts", response: "Showing your alerts" },
  "what are my alerts": { action: "check_alerts", response: "Checking your alerts" },
  "any reminders": { action: "check_alerts", response: "Checking for reminders" },
};

export async function POST(request: NextRequest) {
  try {
    const { command, userId, currentPath, conversationHistory } = await request.json();

    if (!command || !command.trim()) {
      return NextResponse.json(
        { error: "No command provided" },
        { status: 400 }
      );
    }

    // Normalize command - handle common abbreviations and variations
    // Also fix common speech recognition errors
    let normalizedCommand = command.toLowerCase()
      // Fix common speech recognition errors
      .replace(/\bask me\b/g, "srb") // "ask me" → "srb" (common misrecognition)
      .replace(/\bas me\b/g, "srb") // "as me" → "srb"
      .replace(/\bask srb\b/g, "ask srb") // Keep "ask srb" as is
      .replace(/\bs r b\b/g, "srb") // "s r b" → "srb"
      .replace(/\bes are be\b/g, "srb") // "es are be" → "srb"
      .replace(/\bes r b\b/g, "srb") // "es r b" → "srb"
      // PYQ variations
      .replace(/\bpy\b/g, "pyq") // "py" → "pyq"
      .replace(/\bpy q\b/g, "pyq") // "py q" → "pyq"
      .replace(/\bprevious year\b/g, "pyq") // "previous year" → "pyq"
      .replace(/\bquestion paper\b/g, "pyq") // "question paper" → "pyq"
      .trim();

    // Try pattern matching first for queries and downloads (faster and more reliable)
    
    // Check for SRB queries - handle various forms including "ask me" misrecognition
    // Pattern: "ask srb", "srb", "ask me" (misrecognition), "student resource book", etc.
    const srbQueryPattern = /(?:ask\s+(?:srb|me)|srb\s+question|what\s+does\s+the\s+student\s+resource\s+book\s+say|student\s+resource\s+book|^srb\s+about|^ask\s+me\s+about).*?(?:about|:|\?|$)(.+)/i;
    const srbMatch = normalizedCommand.match(srbQueryPattern) || command.match(srbQueryPattern);
    
    // Also check if command starts with "srb" or "ask me" (common misrecognition)
    if (!srbMatch && (normalizedCommand.startsWith("srb") || normalizedCommand.startsWith("ask me"))) {
      // Extract question after "srb" or "ask me"
      const question = normalizedCommand.replace(/^(?:srb|ask\s+me)\s+(?:about|:)?\s*/i, "").trim();
      if (question) {
        return NextResponse.json({
          success: true,
          command: {
            intent: "query SRB",
            action: "query_srb",
            parameters: {
              question: question,
            },
            response: "Let me check the Student Resource Book for you",
          },
          response: "Let me check the Student Resource Book for you",
        });
      } else {
        // Just "srb" or "ask me" - open SRB section
        return NextResponse.json({
          success: true,
          command: {
            intent: "open SRB",
            action: "open_srb",
            parameters: {},
            response: "Opening Student Resource Book",
          },
          response: "Opening Student Resource Book",
        });
      }
    }
    
    if (srbMatch) {
      const question = srbMatch[1]?.trim() || command.replace(/(?:ask\s+srb|srb\s+question|what\s+does\s+the\s+student\s+resource\s+book\s+say|student\s+resource\s+book)/i, "").trim();
      if (question) {
        return NextResponse.json({
          success: true,
          command: {
            intent: "query SRB",
            action: "query_srb",
            parameters: {
              question: question,
            },
            response: "Let me check the Student Resource Book for you",
          },
          response: "Let me check the Student Resource Book for you",
        });
      }
    }
    
    // Check for Policy queries
    const policyQueryPattern = /(?:ask\s+policy|policy\s+question|what\s+does\s+the\s+examination\s+policy\s+say|examination\s+policy).*?(?:about|:|\?|$)(.+)/i;
    const policyMatch = normalizedCommand.match(policyQueryPattern) || command.match(policyQueryPattern);
    
    if (policyMatch) {
      const question = policyMatch[1]?.trim() || command.replace(/(?:ask\s+policy|policy\s+question|what\s+does\s+the\s+examination\s+policy\s+say|examination\s+policy)/i, "").trim();
      if (question) {
        return NextResponse.json({
          success: true,
          command: {
            intent: "query policy",
            action: "query_policy",
            parameters: {
              question: question,
            },
            response: "Let me check the Examination Policy for you",
          },
          response: "Let me check the Examination Policy for you",
        });
      }
    }
    
    // Check for PYQ downloads
    const pyqDownloadPattern = /download\s+(?:py|pyq|previous\s+year).*?(?:for|of)\s+(.+?)(?:\s+semester|\s+sem|\s+sem\.)\s*(\d+)/i;
    const pyqMatch = normalizedCommand.match(pyqDownloadPattern) || command.match(pyqDownloadPattern);
    
    if (pyqMatch) {
      const subject = pyqMatch[1].trim();
      const semester = pyqMatch[2].trim();
      
      // Normalize subject name
      let normalizedSubject = subject;
      if (subject.toLowerCase().includes("artificial intelligence") || subject.toLowerCase() === "ai" || subject.toLowerCase().includes("artificial")) {
        normalizedSubject = "Artificial Intelligence";
      }
      
      // Try to find the PYQ
      try {
        const db = getAdminDb();
        if (db) {
          let query: any = db.collection("pyqs");
          
          // Try exact match first
          query = query.where("subject", "==", normalizedSubject);
          query = query.where("semester", "==", semester);
          
          let snapshot = await query.limit(1).get();
          
          // If not found, try case-insensitive search
          if (snapshot.empty) {
            query = db.collection("pyqs");
            query = query.where("semester", "==", semester);
            snapshot = await query.limit(10).get();
            
            // Filter by subject name (case-insensitive)
            const matchingDocs = snapshot.docs.filter((doc: any) => {
              const docSubject = doc.data().subject?.toLowerCase() || "";
              return docSubject.includes(normalizedSubject.toLowerCase()) || 
                     normalizedSubject.toLowerCase().includes(docSubject);
            });
            
            if (matchingDocs.length > 0) {
              const pyqDoc = matchingDocs[0];
              return NextResponse.json({
                success: true,
                command: {
                  intent: "download PYQ",
                  action: "download_pyq",
                  parameters: {
                    subject: normalizedSubject,
                    semester: semester,
                    pyqId: pyqDoc.id,
                  },
                  response: `Found PYQ for ${normalizedSubject} semester ${semester}. Opening download.`,
                },
                response: `Found PYQ for ${normalizedSubject} semester ${semester}. Opening download.`,
              });
            }
          } else {
            const pyqDoc = snapshot.docs[0];
            return NextResponse.json({
              success: true,
              command: {
                intent: "download PYQ",
                action: "download_pyq",
                parameters: {
                  subject: normalizedSubject,
                  semester: semester,
                  pyqId: pyqDoc.id,
                },
                response: `Found PYQ for ${normalizedSubject} semester ${semester}. Opening download.`,
              },
              response: `Found PYQ for ${normalizedSubject} semester ${semester}. Opening download.`,
            });
          }
        }
      } catch (error) {
        console.error("Error finding PYQ:", error);
      }
      
      // If PYQ not found, still return the command but without pyqId
      return NextResponse.json({
        success: true,
        command: {
          intent: "download PYQ",
          action: "download_pyq",
          parameters: {
            subject: normalizedSubject,
            semester: semester,
          },
          response: `Searching for PYQ for ${normalizedSubject} semester ${semester}. Please check the PYQ repository.`,
        },
        response: `Searching for PYQ for ${normalizedSubject} semester ${semester}. Please check the PYQ repository.`,
      });
    }

    // Use Gemini to understand the intent for other commands
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Additional normalization for Gemini prompt (reuse normalizedCommand from above)
    const normalizedCommandForGemini = normalizedCommand
      .replace(/\bartificial intelligence\b/g, "Artificial Intelligence") // Normalize subject names
      .replace(/\bai\b/g, "Artificial Intelligence"); // "AI" → "Artificial Intelligence"

    const prompt = `You are SNEHA, a voice assistant for a college portal app called CampusIQ. 

The user said: "${command}"
Normalized command: "${normalizedCommandForGemini}"

Available actions and their keywords:
${Object.entries(ACTION_MAPPINGS)
  .map(([keyword, data]) => `- "${keyword}" → action: ${data.action}${data.path ? `, path: ${data.path}` : ""}`)
  .join("\n")}

Other available features:
- Download PYQ papers (keywords: "download pyq", "download py", "get pyq", "download previous year")
  Format examples:
  * "download pyq for [subject] semester [number]"
  * "download py for [subject] sem [number]"
  * "get pyq for [branch] [semester] [subject]"
  * "download pyq for Artificial Intelligence semester 5"
  * "download py for AI sem 5"
- Navigate to pages (keywords: "go to", "open", "show", "navigate to")
- Check information (keywords: "check my", "show my", "what's my", "tell me about")
- Ask questions about Student Resource Book (keywords: "ask srb", "srb question", "student resource book", "what does the srb say about")
  Format examples:
  * "ask srb about [topic]"
  * "what does the student resource book say about [topic]"
  * "srb question: [question]"
- Ask questions about Examination Policy (keywords: "ask policy", "examination policy", "what does the policy say", "policy question")
  Format examples:
  * "ask policy about [topic]"
  * "what does the examination policy say about [topic]"
  * "policy question: [question]"

Current page: ${currentPath}

IMPORTANT: 
- "py" or "py q" means "PYQ" (Previous Year Question papers)
- "AI" means "Artificial Intelligence"
- "ask me" or "as me" might be a misrecognition of "SRB" (Student Resource Book)
- "srb" means "Student Resource Book"
- Extract subject names, semester numbers, and branch names from the command
- Be flexible with variations and abbreviations
- Handle common speech recognition errors gracefully

Analyze the user's command and determine:
1. The intent (what they want to do)
2. The action (from available actions)
3. Any parameters needed (like subject, semester, branch for PYQ downloads)

Return ONLY a valid JSON object in this exact format:
{
  "intent": "brief description of what user wants",
  "action": "action_name",
  "parameters": { "key": "value" } // if needed, otherwise {}
}

Examples:
- "go to schedule" → {"intent": "navigate to schedule", "action": "navigate", "parameters": {"path": "/schedule"}}
- "check my attendance" → {"intent": "check attendance", "action": "check_attendance", "parameters": {}}
- "download pyq for artificial intelligence semester 5" → {"intent": "download PYQ", "action": "download_pyq", "parameters": {"subject": "Artificial Intelligence", "semester": "5"}}
- "download py for AI sem 5" → {"intent": "download PYQ", "action": "download_pyq", "parameters": {"subject": "Artificial Intelligence", "semester": "5"}}
- "download py for Artificial Intelligence semester 5" → {"intent": "download PYQ", "action": "download_pyq", "parameters": {"subject": "Artificial Intelligence", "semester": "5"}}
- "what's my schedule today" → {"intent": "view today's schedule", "action": "check_schedule", "parameters": {}}
- "ask srb about attendance requirements" → {"intent": "query SRB", "action": "query_srb", "parameters": {"question": "attendance requirements"}}
- "what does the student resource book say about grading" → {"intent": "query SRB", "action": "query_srb", "parameters": {"question": "grading"}}
- "ask policy about UFM" → {"intent": "query policy", "action": "query_policy", "parameters": {"question": "UFM"}}
- "what does the examination policy say about unfair means" → {"intent": "query policy", "action": "query_policy", "parameters": {"question": "unfair means"}}

Return ONLY the JSON, no explanations:`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean JSON response (remove markdown if present)
      if (text.startsWith("```json")) {
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (text.startsWith("```")) {
        text = text.replace(/```\n?/g, "");
      }

      const commandData: VoiceCommand = JSON.parse(text);

      // Handle PYQ download - find the actual PYQ ID
      if (commandData.action === "download_pyq" && (commandData.parameters?.subject || commandData.parameters?.semester || commandData.parameters?.branch)) {
        try {
          const db = getAdminDb();
          if (db) {
            let query: any = db.collection("pyqs");
            
            // Apply filters
            if (commandData.parameters.branch) {
              query = query.where("branch", "==", commandData.parameters.branch);
            }
            if (commandData.parameters.semester) {
              query = query.where("semester", "==", commandData.parameters.semester);
            }
            if (commandData.parameters.subject) {
              query = query.where("subject", "==", commandData.parameters.subject);
            }
            
            const snapshot = await query.limit(1).get();
            if (!snapshot.empty) {
              const pyqDoc = snapshot.docs[0];
              commandData.parameters = {
                ...commandData.parameters,
                pyqId: pyqDoc.id,
              };
            }
          }
        } catch (error) {
          console.error("Error finding PYQ:", error);
        }
      }

      // Get response message
      let responseMessage = "";
      const actionKey = Object.keys(ACTION_MAPPINGS).find(
        (key) => command.toLowerCase().includes(key.toLowerCase())
      );

      if (actionKey && ACTION_MAPPINGS[actionKey]) {
        responseMessage = ACTION_MAPPINGS[actionKey].response;
      } else {
        // Generate contextual response based on action
        switch (commandData.action) {
          case "navigate":
            responseMessage = `Navigating to ${commandData.parameters?.path || "the requested page"}`;
            break;
          case "check_attendance":
            responseMessage = "Opening your attendance tracker";
            break;
          case "check_schedule":
            responseMessage = "Showing your schedule";
            break;
          case "check_results":
            responseMessage = "Opening your results";
            break;
          case "download_pyq":
            if (commandData.parameters?.pyqId) {
              responseMessage = `Downloading PYQ paper${commandData.parameters?.subject ? ` for ${commandData.parameters.subject}` : ""}`;
            } else {
              responseMessage = `Opening PYQ repository${commandData.parameters?.subject ? ` for ${commandData.parameters.subject}` : ""}`;
            }
            break;
          case "query_srb":
            responseMessage = "Let me check the Student Resource Book for you";
            break;
          case "query_policy":
            responseMessage = "Let me check the Examination Policy for you";
            break;
          default:
            responseMessage = "Done!";
        }
      }

      return NextResponse.json({
        success: true,
        command: {
          ...commandData,
          response: responseMessage,
        },
        response: responseMessage,
      });
    } catch (parseError: any) {
      console.error("Error parsing Gemini response:", parseError);
      
      // Fallback: Try to match command with keywords (including normalized version)
      const lowerCommand = normalizedCommand.toLowerCase();
      
      // Check for PYQ download patterns
      const pyqDownloadMatch = lowerCommand.match(/download\s+(?:py|pyq|previous\s+year).*?(?:for|of)\s+(.+?)(?:\s+semester|\s+sem|\s+sem\.)\s*(\d+)/i);
      if (pyqDownloadMatch) {
        const subject = pyqDownloadMatch[1].trim();
        const semester = pyqDownloadMatch[2].trim();
        
        // Normalize subject name
        let normalizedSubject = subject;
        if (subject.toLowerCase().includes("artificial intelligence") || subject.toLowerCase() === "ai") {
          normalizedSubject = "Artificial Intelligence";
        }
        
        return NextResponse.json({
          success: true,
          command: {
            intent: "download PYQ",
            action: "download_pyq",
            parameters: {
              subject: normalizedSubject,
              semester: semester,
            },
            response: `Opening PYQ repository for ${normalizedSubject} semester ${semester}`,
          },
          response: `Opening PYQ repository for ${normalizedSubject} semester ${semester}`,
        });
      }
      
      const matchedKey = Object.keys(ACTION_MAPPINGS).find((key) =>
        lowerCommand.includes(key.toLowerCase())
      );

      if (matchedKey) {
        const mapping = ACTION_MAPPINGS[matchedKey];
        return NextResponse.json({
          success: true,
          command: {
            intent: matchedKey,
            action: mapping.action,
            parameters: mapping.path ? { path: mapping.path } : {},
            response: mapping.response,
          },
          response: mapping.response,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "I didn't understand that command. Try saying 'go to schedule' or 'check my attendance'.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error understanding voice command:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sorry, I encountered an error. Please try again.",
      },
      { status: 500 }
    );
  }
}
