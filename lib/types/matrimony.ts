export type ConnectionType = "dating" | "friends" | "study-partner";

export type StudyStyle = 
  | "early-bird"
  | "night-owl"
  | "balanced"
  | "crammer"
  | "consistent";

export type PersonalityType =
  | "introverted"
  | "extroverted"
  | "ambivert"
  | "analytical"
  | "creative"
  | "practical";

export type Branch = 
  | "CSE"
  | "IT"
  | "ECE"
  | "EEE"
  | "ME"
  | "CE"
  | "Other";

export type Year = "1" | "2" | "3" | "4";

export interface MatrimonyProfile {
  id: string;
  userId: string;
  cgpa: number;
  branch: Branch;
  year: Year;
  studyStyle: StudyStyle;
  personality: PersonalityType[];
  connectionType: ConnectionType[];
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  reports: number;
  createdAt: any;
  updatedAt: any;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  compatibilityScore: number;
  cgpaLeague: string;
  matchReasons: string[];
  connectionType: ConnectionType;
  status: "pending" | "accepted" | "rejected" | "blocked";
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  message: string;
  isAnonymous: boolean;
  createdAt: any;
}

export interface MatchReport {
  id: string;
  matchId: string;
  reporterId: string;
  reason: string;
  createdAt: any;
}

export const STUDY_STYLES: Record<StudyStyle, { label: string; emoji: string; description: string }> = {
  "early-bird": {
    label: "Early Bird",
    emoji: "🌅",
    description: "Most productive in the morning"
  },
  "night-owl": {
    label: "Night Owl",
    emoji: "🦉",
    description: "Most productive at night"
  },
  "balanced": {
    label: "Balanced",
    emoji: "⚖️",
    description: "Flexible schedule"
  },
  "crammer": {
    label: "Crammer",
    emoji: "📚",
    description: "Intensive study sessions"
  },
  "consistent": {
    label: "Consistent",
    emoji: "📅",
    description: "Regular daily study routine"
  }
};

export const PERSONALITY_TYPES: Record<PersonalityType, { label: string; emoji: string }> = {
  "introverted": { label: "Introverted", emoji: "🤔" },
  "extroverted": { label: "Extroverted", emoji: "🎉" },
  "ambivert": { label: "Ambivert", emoji: "🔄" },
  "analytical": { label: "Analytical", emoji: "🔬" },
  "creative": { label: "Creative", emoji: "🎨" },
  "practical": { label: "Practical", emoji: "🛠️" }
};

export const BRANCHES: Record<Branch, { label: string; emoji: string }> = {
  "CSE": { label: "Computer Science", emoji: "💻" },
  "IT": { label: "Information Technology", emoji: "🌐" },
  "ECE": { label: "Electronics & Communication", emoji: "📡" },
  "EEE": { label: "Electrical & Electronics", emoji: "⚡" },
  "ME": { label: "Mechanical Engineering", emoji: "⚙️" },
  "CE": { label: "Civil Engineering", emoji: "🏗️" },
  "Other": { label: "Other", emoji: "📖" }
};

export const CONNECTION_TYPES: Record<ConnectionType, { label: string; emoji: string; description: string }> = {
  "dating": {
    label: "Dating",
    emoji: "💕",
    description: "Looking for a romantic connection"
  },
  "friends": {
    label: "Friends",
    emoji: "👥",
    description: "Looking for friends"
  },
  "study-partner": {
    label: "Study Partner",
    emoji: "📖",
    description: "Looking for study buddies"
  }
};

export const REPORT_REASONS_MATRIMONY = [
  "Inappropriate behavior",
  "Fake profile",
  "Harassment",
  "Spam",
  "Other"
] as const;

export function getCGPALeague(cgpa: number): string {
  // CGPA scale: 4.0 (not 10.0)
  if (cgpa >= 3.5) return "Elite (3.5-4.0)";
  if (cgpa >= 3.0) return "Excellent (3.0-3.49)";
  if (cgpa >= 2.5) return "Good (2.5-2.99)";
  if (cgpa >= 2.0) return "Average (2.0-2.49)";
  return "Below Average (<2.0)";
}

export function calculateCompatibility(
  profile1: MatrimonyProfile,
  profile2: MatrimonyProfile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // CGPA compatibility (30 points)
  const cgpaDiff = Math.abs(profile1.cgpa - profile2.cgpa);
  if (cgpaDiff <= 0.5) {
    score += 30;
    reasons.push("Similar academic performance");
  } else if (cgpaDiff <= 1.0) {
    score += 20;
    reasons.push("Close academic levels");
  } else if (cgpaDiff <= 1.5) {
    score += 10;
  }

  // Branch compatibility (20 points)
  if (profile1.branch === profile2.branch) {
    score += 20;
    reasons.push("Same branch - shared interests");
  } else {
    score += 5;
  }

  // Year compatibility (15 points)
  if (profile1.year === profile2.year) {
    score += 15;
    reasons.push("Same year - similar experiences");
  } else {
    const yearDiff = Math.abs(parseInt(profile1.year) - parseInt(profile2.year));
    if (yearDiff === 1) {
      score += 10;
      reasons.push("Adjacent years - good mentorship potential");
    }
  }

  // Study style compatibility (15 points)
  if (profile1.studyStyle === profile2.studyStyle) {
    score += 15;
    reasons.push("Matching study styles");
  } else if (
    (profile1.studyStyle === "early-bird" && profile2.studyStyle === "balanced") ||
    (profile1.studyStyle === "night-owl" && profile2.studyStyle === "balanced") ||
    (profile1.studyStyle === "balanced" && profile2.studyStyle === "early-bird") ||
    (profile1.studyStyle === "balanced" && profile2.studyStyle === "night-owl")
  ) {
    score += 10;
    reasons.push("Complementary study schedules");
  }

  // Personality compatibility (20 points)
  const commonPersonalities = profile1.personality.filter(p => 
    profile2.personality.includes(p)
  );
  if (commonPersonalities.length > 0) {
    score += Math.min(20, commonPersonalities.length * 7);
    reasons.push(`Shared traits: ${commonPersonalities.map(p => PERSONALITY_TYPES[p].label).join(", ")}`);
  }

  // Connection type match (bonus)
  const commonConnectionTypes = profile1.connectionType.filter(ct =>
    profile2.connectionType.includes(ct)
  );
  if (commonConnectionTypes.length > 0) {
    score += 10;
    reasons.push(`Both looking for: ${commonConnectionTypes.map(ct => CONNECTION_TYPES[ct].label).join(", ")}`);
  }

  return {
    score: Math.min(100, score),
    reasons: reasons.length > 0 ? reasons : ["Potential match based on campus proximity"]
  };
}
