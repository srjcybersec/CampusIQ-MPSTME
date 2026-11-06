export type CampusVoiceCategory =
  | "unsent-messages"
  | "campus-truths"
  | "things-unsaid"
  | "guilty-pleasures"
  | "gratitude-notes";

/** Live post stored in Firestore */
export interface CampusVoicePost {
  id: string;
  content: string;
  category: CampusVoiceCategory;
  authorId: string;
  likes: number;
  reports: number;
  isModerated: boolean;
  isApproved: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CampusVoiceLike {
  userId: string;
  campusVoiceId: string;
  createdAt: any;
}

export interface CampusVoiceReport {
  userId: string;
  campusVoiceId: string;
  reason: string;
  createdAt: any;
}

/** Unified item for the feed (curated seed + live posts) */
export interface CampusVoiceItem {
  id: string;
  content: string;
  category: CampusVoiceCategory;
  likes: number;
  createdAt: string;
  isCurated: boolean;
  authorId?: string;
}

export const CAMPUS_VOICE_CATEGORIES: Record<
  CampusVoiceCategory,
  { label: string; emoji: string; description: string }
> = {
  "unsent-messages": {
    label: "Unsent Messages",
    emoji: "💌",
    description: "Thoughts you wanted to share but never did",
  },
  "campus-truths": {
    label: "Campus Truths",
    emoji: "🎓",
    description: "Honest reflections about campus life",
  },
  "things-unsaid": {
    label: "Things Unsaid",
    emoji: "💭",
    description: "What you wished you had said out loud",
  },
  "guilty-pleasures": {
    label: "Guilty Pleasures",
    emoji: "🍕",
    description: "Little joys we all secretly enjoy",
  },
  "gratitude-notes": {
    label: "Gratitude Notes",
    emoji: "🙏",
    description: "Moments and people you're thankful for",
  },
};

export const REPORT_REASONS = [
  "Inappropriate content",
  "Hate speech or targeting",
  "Contains real names",
  "Spam or irrelevant",
  "Other",
] as const;

export function postToItem(post: CampusVoicePost): CampusVoiceItem {
  const ts = post.createdAt?.toDate?.() ?? new Date(post.createdAt?.seconds * 1000 || Date.now());
  return {
    id: post.id,
    content: post.content,
    category: post.category,
    likes: post.likes,
    createdAt: ts.toISOString(),
    isCurated: false,
    authorId: post.authorId,
  };
}
