export type ConfessionCategory = 
  | "unsent-messages"
  | "college-truths"
  | "almost-confessed"
  | "guilty-pleasures"
  | "gratitude-notes";

export interface Confession {
  id: string;
  content: string;
  category: ConfessionCategory;
  authorId: string; // Anonymous - stored but not displayed
  likes: number;
  reports: number;
  isModerated: boolean;
  isApproved: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface ConfessionLike {
  userId: string;
  confessionId: string;
  createdAt: any;
}

export interface ConfessionReport {
  userId: string;
  confessionId: string;
  reason: string;
  createdAt: any;
}

export const CONFESSION_CATEGORIES: Record<ConfessionCategory, { label: string; emoji: string; description: string }> = {
  "unsent-messages": {
    label: "Unsent Messages",
    emoji: "💌",
    description: "Things you wanted to say but never did"
  },
  "college-truths": {
    label: "College Truths",
    emoji: "🎓",
    description: "Honest thoughts about college life"
  },
  "almost-confessed": {
    label: "Almost Confessed",
    emoji: "😳",
    description: "Things you almost said out loud"
  },
  "guilty-pleasures": {
    label: "Guilty Pleasures",
    emoji: "🍕",
    description: "Things you enjoy but feel guilty about"
  },
  "gratitude-notes": {
    label: "Gratitude Notes",
    emoji: "🙏",
    description: "Things you're grateful for"
  }
};

export const REPORT_REASONS = [
  "Inappropriate content",
  "Hate speech or targeting",
  "Contains real names",
  "Spam or irrelevant",
  "Other"
] as const;
