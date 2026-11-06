export interface MatchedVoiceCommand {
  intent: string;
  action: string;
  parameters: Record<string, any>;
  response: string;
}

type Rule = {
  test: (cmd: string) => boolean;
  build: (cmd: string) => MatchedVoiceCommand;
};

function normalize(cmd: string): string {
  return cmd
    .toLowerCase()
    .replace(/\bpy\b/g, "pyq")
    .replace(/\bpy q\b/g, "pyq")
    .replace(/\bask me\b/g, "srb")
    .replace(/\bas me\b/g, "srb")
    .replace(/\bs r b\b/g, "srb")
    .replace(/\banaly[sz]er\b/g, "analyzer")
    .replace(/\bcampus voice\b/g, "campus voices")
    .replace(/\bconfession\b/g, "campus voices")
    .trim();
}

function has(cmd: string, ...words: string[]): boolean {
  return words.some((w) => cmd.includes(w));
}

function openNav(path: string, label: string): MatchedVoiceCommand {
  return {
    intent: `open ${label}`,
    action: "navigate",
    parameters: { path },
    response: `Opening ${label}.`,
  };
}

const RULES: Rule[] = [
  // ---- Read-back (information requests) ----
  {
    test: (c) =>
      /\b(what|do i have|any|tell me|when is|is there)\b/.test(c) &&
      has(c, "class", "classes", "lecture", "schedule", "timetable"),
    build: (c) => {
      let day = "today";
      if (has(c, "tomorrow")) day = "tomorrow";
      else {
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const found = days.find((d) => c.includes(d));
        if (found) day = found.charAt(0).toUpperCase() + found.slice(1);
      }
      return {
        intent: "read schedule",
        action: "read_schedule",
        parameters: { day },
        response: "Let me check your schedule.",
      };
    },
  },
  {
    test: (c) => has(c, "alert", "alerts", "reminder", "reminders") && !has(c, "open", "go to"),
    build: () => ({
      intent: "check alerts",
      action: "check_alerts",
      parameters: {},
      response: "Checking your alerts.",
    }),
  },
  {
    test: (c) =>
      /\b(what|tell me|show|my)\b/.test(c) &&
      has(c, "result", "results", "grade", "grades", "marks") &&
      !has(c, "open", "go to", "analyzer", "analyser"),
    build: () => ({
      intent: "read results",
      action: "read_results",
      parameters: {},
      response: "Let me check your results.",
    }),
  },
  {
    test: (c) =>
      /\b(what|tell me|show|my)\b/.test(c) &&
      has(c, "order", "orders", "canteen") &&
      !has(c, "open", "go to", "menu"),
    build: () => ({
      intent: "read orders",
      action: "read_orders",
      parameters: {},
      response: "Let me check your canteen orders.",
    }),
  },

  // ---- PYQ download ----
  {
    test: (c) => /\b(download|get|fetch)\b/.test(c) && has(c, "pyq", "previous year", "question paper"),
    build: (c) => {
      const semMatch = c.match(/sem(?:ester)?\.?\s*(\d+)/i);
      const semester = semMatch?.[1];
      let subject = c
        .replace(/.*\b(?:for|of)\b\s*/i, "")
        .replace(/\bsem(?:ester)?\.?\s*\d+.*/i, "")
        .replace(/\b(download|get|fetch|pyq|paper|papers)\b/gi, "")
        .trim();
      if (/\b(ai|artificial intelligence)\b/i.test(subject)) subject = "Artificial Intelligence";
      return {
        intent: "download PYQ",
        action: "download_pyq",
        parameters: { subject: subject || undefined, semester },
        response: semester
          ? `Looking for the PYQ for ${subject || "that subject"} semester ${semester}.`
          : "Opening the PYQ repository.",
      };
    },
  },

  // ---- SRB / Policy queries ----
  {
    test: (c) =>
      (has(c, "srb", "student resource book") && /\b(what|how|when|why|tell|ask|about|say)\b/.test(c)) ||
      /\bask\s+srb\b/.test(c),
    build: (c) => {
      const question = c
        .replace(/.*\b(?:about|regarding|on)\b\s*/i, "")
        .replace(/\b(srb|student resource book|ask)\b/gi, "")
        .trim();
      return {
        intent: "query SRB",
        action: "query_srb",
        parameters: { question: question || c },
        response: "Let me check the Student Resource Book.",
      };
    },
  },
  {
    test: (c) =>
      (has(c, "policy", "examination policy", "exam policy") &&
        /\b(what|how|when|why|tell|ask|about|say)\b/.test(c)) ||
      /\bask\s+policy\b/.test(c),
    build: (c) => {
      const question = c
        .replace(/.*\b(?:about|regarding|on)\b\s*/i, "")
        .replace(/\b(policy|examination policy|exam policy|ask)\b/gi, "")
        .trim();
      return {
        intent: "query policy",
        action: "query_policy",
        parameters: { question: question || c },
        response: "Let me check the Examination Policy.",
      };
    },
  },

  // ---- Academics section shortcuts ----
  {
    test: (c) => has(c, "attendance") && /\b(open|go|show|check|take me|tracker)\b/.test(c),
    build: () => ({
      intent: "open attendance",
      action: "check_attendance",
      parameters: {},
      response: "Opening the attendance tracker.",
    }),
  },
  {
    test: (c) =>
      has(c, "result", "results", "grade", "grades", "analyzer", "analyser") &&
      /\b(open|go|show|take me)\b/.test(c),
    build: () => ({
      intent: "open results analyzer",
      action: "check_results",
      parameters: {},
      response: "Opening the results analyzer.",
    }),
  },
  {
    test: (c) =>
      has(c, "student resource book", "srb") && /\b(open|go|show|take me)\b/.test(c),
    build: () => ({
      intent: "open SRB",
      action: "open_srb",
      parameters: {},
      response: "Opening the Student Resource Book.",
    }),
  },
  {
    test: (c) =>
      has(c, "examination policy", "exam policy", "policy") &&
      /\b(open|go|show|take me)\b/.test(c) &&
      !has(c, "ask", "what", "how"),
    build: () => ({
      intent: "open examination policy",
      action: "open_policy",
      parameters: {},
      response: "Opening the Examination Policy.",
    }),
  },

  // ---- Navigation pages ----
  {
    test: (c) =>
      (has(c, "campus", "voice", "voices") || has(c, "confession", "confessions")) &&
      /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/community/campus-voices", "campus voices"),
  },
  {
    test: (c) => has(c, "event", "events") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/community/events", "events"),
  },
  {
    test: (c) => has(c, "community") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/community", "community"),
  },
  {
    test: (c) => has(c, "matrimony") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/extras/matrimony", "matrimony"),
  },
  {
    test: (c) => has(c, "extras") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/extras", "extras"),
  },
  {
    test: (c) => has(c, "services") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/services", "services"),
  },
  {
    test: (c) =>
      has(c, "canteen order", "my orders", "food order") ||
      (has(c, "order", "orders") && has(c, "canteen")),
    build: () => openNav("/campus/canteen/orders", "your canteen orders"),
  },
  {
    test: (c) => has(c, "canteen", "order food", "food") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/campus", "the canteen"),
  },
  {
    test: (c) => has(c, "campus") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/campus", "campus"),
  },
  {
    test: (c) => has(c, "assignment", "assignments") && /\b(open|go|show|take me)\b/.test(c),
    build: () => ({
      intent: "open assignments",
      action: "open_assignments",
      parameters: {},
      response: "Opening assignments.",
    }),
  },
  {
    test: (c) =>
      has(c, "pyq", "previous year", "question paper") && /\b(open|go|show|take me)\b/.test(c),
    build: () => ({
      intent: "open PYQs",
      action: "open_pyqs",
      parameters: {},
      response: "Opening previous year question papers.",
    }),
  },
  {
    test: (c) => has(c, "notes", "note") && /\b(open|go|show|take me)\b/.test(c),
    build: () => ({
      intent: "open notes",
      action: "open_notes",
      parameters: {},
      response: "Opening notes.",
    }),
  },
  {
    test: (c) => has(c, "resources") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/resources", "resources"),
  },
  {
    test: (c) => has(c, "academics") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/academics", "academics"),
  },
  {
    test: (c) => has(c, "schedule", "timetable") && /\b(open|go|show|take me|check)\b/.test(c),
    build: () => ({
      intent: "open schedule",
      action: "check_schedule",
      parameters: {},
      response: "Opening your schedule.",
    }),
  },
  {
    test: (c) => has(c, "home", "dashboard") && /\b(open|go|show|take me)\b/.test(c),
    build: () => openNav("/", "home"),
  },
];

/**
 * Deterministic local matcher — runs before (and as fallback after) Gemini so common
 * navigation commands never fail due to LLM JSON parse errors.
 */
export function matchLocalCommand(rawCommand: string): MatchedVoiceCommand | null {
  const cmd = normalize(rawCommand);
  if (!cmd) return null;

  for (const rule of RULES) {
    if (rule.test(cmd)) {
      return rule.build(cmd);
    }
  }

  return null;
}

export function parseGeminiCommandJson(text: string): MatchedVoiceCommand | null {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed?.action) {
      return {
        intent: parsed.intent || "voice command",
        action: parsed.action,
        parameters: parsed.parameters || {},
        response: parsed.response || parsed.parameters?.speech || "Done!",
      };
    }
  } catch {
    // try to extract JSON object from noisy response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed?.action) {
          return {
            intent: parsed.intent || "voice command",
            action: parsed.action,
            parameters: parsed.parameters || {},
            response: parsed.response || parsed.parameters?.speech || "Done!",
          };
        }
      } catch {
        // fall through
      }
    }
  }

  return null;
}
