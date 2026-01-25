import { db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { Confession, ConfessionCategory, ConfessionLike, ConfessionReport } from "@/lib/types/confession";

const CONFESSIONS_COLLECTION = "confessions";
const LIKES_COLLECTION = "confessionLikes";
const REPORTS_COLLECTION = "confessionReports";

/**
 * Create a new confession
 */
export async function createConfession(
  content: string,
  category: ConfessionCategory,
  authorId: string
): Promise<string> {
  try {
    const confessionRef = doc(collection(db, CONFESSIONS_COLLECTION));
    const confessionData: Omit<Confession, "id"> = {
      content,
      category,
      authorId,
      likes: 0,
      reports: 0,
      isModerated: false,
      isApproved: true, // Auto-approve for now, can be changed to false for manual moderation
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(confessionRef, confessionData);
    return confessionRef.id;
  } catch (error) {
    console.error("Error creating confession:", error);
    throw error;
  }
}

/**
 * Get all confessions (approved only)
 * Note: When filtering by category, we fetch all and filter client-side to avoid composite index requirement
 */
export async function getConfessions(
  category?: ConfessionCategory,
  maxResults: number = 50
): Promise<Confession[]> {
  try {
    // Build query - only use orderBy without category filter to avoid composite index
    let q = query(
      collection(db, CONFESSIONS_COLLECTION),
      where("isApproved", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxResults * 2) // Fetch more to account for client-side filtering
    );

    const querySnapshot = await getDocs(q);
    let confessions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Confession[];

    // Filter by category on client-side if specified
    if (category) {
      confessions = confessions.filter((c) => c.category === category);
    }

    // Limit results after filtering
    return confessions.slice(0, maxResults);
  } catch (error) {
    console.error("Error getting confessions:", error);
    // If orderBy fails (no index), try without it
    try {
      let q = query(
        collection(db, CONFESSIONS_COLLECTION),
        where("isApproved", "==", true),
        limit(maxResults * 2)
      );

      const querySnapshot = await getDocs(q);
      let confessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Confession[];

      // Sort by createdAt on client-side
      confessions.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime; // Descending
      });

      // Filter by category if specified
      if (category) {
        confessions = confessions.filter((c) => c.category === category);
      }

      return confessions.slice(0, maxResults);
    } catch (fallbackError) {
      console.error("Error in fallback query:", fallbackError);
      throw error; // Throw original error
    }
  }
}

/**
 * Like a confession
 */
export async function likeConfession(
  confessionId: string,
  userId: string
): Promise<void> {
  try {
    // Verify confession exists first
    const confessionRef = doc(db, CONFESSIONS_COLLECTION, confessionId);
    const confessionDoc = await getDoc(confessionRef);
    
    if (!confessionDoc.exists()) {
      throw new Error("Confession not found");
    }

    const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${confessionId}`);
    const likeDoc = await getDoc(likeRef);

    const batch = writeBatch(db);

    if (likeDoc.exists()) {
      // Unlike - remove like and decrement count
      batch.delete(likeRef);
      batch.update(confessionRef, {
        likes: increment(-1),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Like - add like and increment count
      batch.set(likeRef, {
        userId,
        confessionId,
        createdAt: Timestamp.now(),
      });
      batch.update(confessionRef, {
        likes: increment(1),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
  } catch (error: any) {
    console.error("Error liking confession:", error);
    // Provide more helpful error message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error("You don't have permission to like this confession. Please make sure you're logged in.");
    }
    throw error;
  }
}

/**
 * Check if user has liked a confession
 */
export async function hasUserLiked(
  confessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${confessionId}`);
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
  } catch (error) {
    console.error("Error checking like:", error);
    return false;
  }
}

/**
 * Report a confession
 */
export async function reportConfession(
  confessionId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    // Verify confession exists first
    const confessionRef = doc(db, CONFESSIONS_COLLECTION, confessionId);
    const confessionDoc = await getDoc(confessionRef);
    
    if (!confessionDoc.exists()) {
      throw new Error("Confession not found");
    }

    const reportRef = doc(db, REPORTS_COLLECTION, `${userId}_${confessionId}`);
    const reportDoc = await getDoc(reportRef);

    if (reportDoc.exists()) {
      throw new Error("You have already reported this confession");
    }

    const batch = writeBatch(db);

    // Create report
    batch.set(reportRef, {
      userId,
      confessionId,
      reason,
      createdAt: Timestamp.now(),
    });

    // Increment report count
    batch.update(confessionRef, {
      reports: increment(1),
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  } catch (error: any) {
    console.error("Error reporting confession:", error);
    // Provide more helpful error message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error("You don't have permission to report this confession. Please make sure you're logged in.");
    }
    throw error;
  }
}

/**
 * Get confession by ID
 */
export async function getConfessionById(confessionId: string): Promise<Confession | null> {
  try {
    const confessionRef = doc(db, CONFESSIONS_COLLECTION, confessionId);
    const confessionDoc = await getDoc(confessionRef);

    if (confessionDoc.exists()) {
      return {
        id: confessionDoc.id,
        ...confessionDoc.data(),
      } as Confession;
    }

    return null;
  } catch (error) {
    console.error("Error getting confession:", error);
    throw error;
  }
}

/**
 * Delete a confession (only by the author)
 */
export async function deleteConfession(
  confessionId: string,
  userId: string
): Promise<void> {
  try {
    // Verify confession exists and user is the author
    const confessionRef = doc(db, CONFESSIONS_COLLECTION, confessionId);
    const confessionDoc = await getDoc(confessionRef);
    
    if (!confessionDoc.exists()) {
      throw new Error("Confession not found");
    }

    const confessionData = confessionDoc.data() as Confession;
    
    if (confessionData.authorId !== userId) {
      throw new Error("You can only delete your own confessions");
    }

    // Delete all related likes
    const likesQuery = query(
      collection(db, LIKES_COLLECTION),
      where("confessionId", "==", confessionId)
    );
    const likesSnapshot = await getDocs(likesQuery);
    
    const batch = writeBatch(db);
    
    // Delete all likes for this confession
    likesSnapshot.docs.forEach((likeDoc) => {
      batch.delete(likeDoc.ref);
    });
    
    // Delete the confession
    batch.delete(confessionRef);
    
    await batch.commit();
  } catch (error: any) {
    console.error("Error deleting confession:", error);
    // Provide more helpful error message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error("You don't have permission to delete this confession.");
    }
    throw error;
  }
}
