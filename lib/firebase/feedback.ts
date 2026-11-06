import { db } from "./config";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { FeedbackCategory } from "@/lib/types/feedback";

const FEEDBACK_COLLECTION = "betaFeedback";

export interface SubmitBetaFeedbackInput {
  userId: string;
  email: string;
  username?: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  pagePath: string;
  userAgent?: string;
}

export async function submitBetaFeedback(input: SubmitBetaFeedbackInput): Promise<string> {
  const ref = doc(collection(db, FEEDBACK_COLLECTION));
  await setDoc(ref, {
    userId: input.userId,
    email: input.email,
    ...(input.username ? { username: input.username } : {}),
    rating: input.rating,
    category: input.category,
    message: input.message.trim(),
    pagePath: input.pagePath,
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    createdAt: Timestamp.now(),
  });
  return ref.id;
}
