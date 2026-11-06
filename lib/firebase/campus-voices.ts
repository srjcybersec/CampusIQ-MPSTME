import { db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { CampusVoiceCategory, CampusVoicePost } from "@/lib/types/campus-voice";

const VOICES_COLLECTION = "campusVoices";
const LIKES_COLLECTION = "campusVoiceLikes";
const REPORTS_COLLECTION = "campusVoiceReports";

export async function createCampusVoice(
  content: string,
  category: CampusVoiceCategory,
  authorId: string
): Promise<string> {
  const ref = doc(collection(db, VOICES_COLLECTION));
  const data: Omit<CampusVoicePost, "id"> = {
    content,
    category,
    authorId,
    likes: 0,
    reports: 0,
    isModerated: false,
    isApproved: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(ref, data);
  return ref.id;
}

export async function getCampusVoicePosts(
  category?: CampusVoiceCategory,
  maxResults = 50
): Promise<CampusVoicePost[]> {
  try {
    const q = query(
      collection(db, VOICES_COLLECTION),
      where("isApproved", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxResults * 2)
    );
    const snap = await getDocs(q);
    let posts = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CampusVoicePost[];
    if (category) posts = posts.filter((p) => p.category === category);
    return posts.slice(0, maxResults);
  } catch {
    const q = query(
      collection(db, VOICES_COLLECTION),
      where("isApproved", "==", true),
      limit(maxResults * 2)
    );
    const snap = await getDocs(q);
    let posts = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CampusVoicePost[];
    posts.sort((a, b) => {
      const aT = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
      const bT = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
      return bT - aT;
    });
    if (category) posts = posts.filter((p) => p.category === category);
    return posts.slice(0, maxResults);
  }
}

export async function likeCampusVoice(voiceId: string, userId: string): Promise<void> {
  const voiceRef = doc(db, VOICES_COLLECTION, voiceId);
  const voiceDoc = await getDoc(voiceRef);
  if (!voiceDoc.exists()) throw new Error("Post not found");

  const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${voiceId}`);
  const likeDoc = await getDoc(likeRef);
  const batch = writeBatch(db);

  if (likeDoc.exists()) {
    batch.delete(likeRef);
    batch.update(voiceRef, { likes: increment(-1), updatedAt: Timestamp.now() });
  } else {
    batch.set(likeRef, { userId, campusVoiceId: voiceId, createdAt: Timestamp.now() });
    batch.update(voiceRef, { likes: increment(1), updatedAt: Timestamp.now() });
  }
  await batch.commit();
}

export async function hasUserLikedVoice(voiceId: string, userId: string): Promise<boolean> {
  const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${voiceId}`);
  const likeDoc = await getDoc(likeRef);
  return likeDoc.exists();
}

export async function reportCampusVoice(
  voiceId: string,
  userId: string,
  reason: string
): Promise<void> {
  const voiceRef = doc(db, VOICES_COLLECTION, voiceId);
  const voiceDoc = await getDoc(voiceRef);
  if (!voiceDoc.exists()) throw new Error("Post not found");

  const reportRef = doc(db, REPORTS_COLLECTION, `${userId}_${voiceId}`);
  if ((await getDoc(reportRef)).exists()) {
    throw new Error("You have already reported this post");
  }

  const batch = writeBatch(db);
  batch.set(reportRef, { userId, campusVoiceId: voiceId, reason, createdAt: Timestamp.now() });
  batch.update(voiceRef, { reports: increment(1), updatedAt: Timestamp.now() });
  await batch.commit();
}

export async function deleteCampusVoice(voiceId: string, userId: string): Promise<void> {
  const voiceRef = doc(db, VOICES_COLLECTION, voiceId);
  const voiceDoc = await getDoc(voiceRef);
  if (!voiceDoc.exists()) throw new Error("Post not found");

  const data = voiceDoc.data() as CampusVoicePost;
  if (data.authorId !== userId) throw new Error("You can only delete your own posts");

  const likesSnap = await getDocs(
    query(collection(db, LIKES_COLLECTION), where("campusVoiceId", "==", voiceId))
  );

  const batch = writeBatch(db);
  likesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(voiceRef);
  await batch.commit();
}
