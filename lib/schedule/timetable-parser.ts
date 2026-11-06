import { TimetableEntry } from "@/lib/data/timetable";

export interface ExtractedScheduleEntry {
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

export function parseTimeRange(timeStr: string): { startTime: string; endTime: string } {
  const timeMatch = timeStr.match(
    /(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?\s*[-to]+\s*(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?/i
  );
  if (timeMatch) {
    let startHour = parseInt(timeMatch[1]);
    let endHour = parseInt(timeMatch[3]);
    const startMin = timeMatch[2];
    const endMin = timeMatch[4];

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

  const simpleMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*[-to]+\s*(\d{1,2}):(\d{2})/);
  if (simpleMatch) {
    return {
      startTime: `${simpleMatch[1].padStart(2, "0")}:${simpleMatch[2]}`,
      endTime: `${simpleMatch[3].padStart(2, "0")}:${simpleMatch[4]}`,
    };
  }

  return { startTime: "09:00", endTime: "10:00" };
}

export function normalizeDay(day: string): TimetableEntry["day"] {
  const dayLower = day.toLowerCase().trim();
  if (dayLower.startsWith("mon")) return "Monday";
  if (dayLower.startsWith("tue")) return "Tuesday";
  if (dayLower.startsWith("wed")) return "Wednesday";
  if (dayLower.startsWith("thu")) return "Thursday";
  if (dayLower.startsWith("fri")) return "Friday";
  if (dayLower.startsWith("sat")) return "Saturday";
  return "Monday";
}

export function normalizeBatch(batch?: string): string | undefined {
  if (!batch) return undefined;
  const cleaned = batch.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
  return cleaned || undefined;
}

export function stripJsonMarkdown(text: string): string {
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "");
  }
  return jsonText.trim();
}

export function normalizeTimetableEntries(
  extractedEntries: ExtractedScheduleEntry[],
  userId: string
): { entries: TimetableEntry[]; availableBatches: string[] } {
  const normalizedEntries: TimetableEntry[] = extractedEntries.map((entry, index) => {
    const { startTime, endTime } = parseTimeRange(entry.time || `${entry.startTime}-${entry.endTime}`);
    const isBreak = entry.type === "break" || entry.subject?.toLowerCase().includes("break");
    const subject = isBreak ? "Break" : entry.subject || "Unknown";

    return {
      id: `${userId}-${normalizeDay(entry.day).toLowerCase()}-${index}`,
      day: normalizeDay(entry.day),
      time: entry.time || `${startTime}-${endTime}`,
      startTime,
      endTime,
      subject,
      subjectCode: entry.subjectCode || (isBreak ? "BREAK" : ""),
      faculty: entry.faculty || "",
      facultyInitials: entry.facultyInitials || "",
      room: entry.room || "",
      batch: normalizeBatch(entry.batch),
      type: (isBreak ? "break" : entry.type) || "lecture",
    };
  });

  const availableBatches = Array.from(
    new Set(normalizedEntries.map((e) => e.batch).filter((b): b is string => !!b))
  ).sort();

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  normalizedEntries.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return { entries: normalizedEntries, availableBatches };
}
