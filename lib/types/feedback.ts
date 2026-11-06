export type FeedbackCategory =
  | "bug"
  | "feature"
  | "confusing"
  | "general"
  | "praise";

export interface BetaFeedback {
  id: string;
  userId: string;
  email: string;
  username?: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  pagePath: string;
  userAgent?: string;
  createdAt: { seconds: number; nanoseconds: number } | Date;
}

export const FEEDBACK_CATEGORIES: {
  value: FeedbackCategory;
  label: string;
  description: string;
}[] = [
  { value: "bug", label: "Bug", description: "Something broke or didn't work" },
  { value: "feature", label: "Feature idea", description: "Something you'd like added" },
  { value: "confusing", label: "Confusing", description: "Hard to find or understand" },
  { value: "general", label: "General", description: "Other thoughts on the beta" },
  { value: "praise", label: "Compliment", description: "What you liked" },
];
