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
  writeBatch,
  QueryConstraint,
} from "firebase/firestore";
import {
  Note,
  NoteRating,
  ExamSurvivalKit,
  NoteFilter,
} from "@/lib/types/notes";

const NOTES_COLLECTION = "notes";
const RATINGS_COLLECTION = "noteRatings";
const SURVIVAL_KITS_COLLECTION = "examSurvivalKits";

/**
 * Upload a new note
 */
export async function uploadNote(
  noteData: Omit<
    Note,
    "id" | "averageRating" | "totalRatings" | "downloads" | "views" | "createdAt" | "updatedAt"
  >
): Promise<string> {
  try {
    // Filter out undefined values (Firestore doesn't allow undefined)
    const cleanNoteData = Object.fromEntries(
      Object.entries(noteData).filter(([_, value]) => value !== undefined)
    );

    // Limit extractedText to 50k characters to avoid Firestore 1MB field limit
    if (cleanNoteData.extractedText && typeof cleanNoteData.extractedText === 'string') {
      if (cleanNoteData.extractedText.length > 50000) {
        cleanNoteData.extractedText = cleanNoteData.extractedText.substring(0, 50000);
        console.log(`Truncated extractedText to 50k characters for Firestore`);
      }
      console.log(`Storing extractedText: ${cleanNoteData.extractedText.length} characters`);
    }

    const noteRef = doc(collection(db, NOTES_COLLECTION));
    const note: Omit<Note, "id"> = {
      ...cleanNoteData,
      averageRating: 0,
      totalRatings: 0,
      downloads: 0,
      views: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Omit<Note, "id">;

    await setDoc(noteRef, note);
    console.log(`Note saved with ID: ${noteRef.id}, has extractedText: ${!!note.extractedText}`);
    return noteRef.id;
  } catch (error) {
    console.error("Error uploading note:", error);
    throw error;
  }
}

/**
 * Get a note by ID
 */
export async function getNote(noteId: string): Promise<Note | null> {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteSnap = await getDoc(noteRef);

    if (noteSnap.exists()) {
      return {
        id: noteSnap.id,
        ...noteSnap.data(),
      } as Note;
    }
    return null;
  } catch (error) {
    console.error("Error getting note:", error);
    throw error;
  }
}

/**
 * Get all notes with optional filters
 */
export async function getNotes(
  filters?: NoteFilter,
  limitCount: number = 50
): Promise<Note[]> {
  try {
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.subject) {
      constraints.push(where("subject", "==", filters.subject));
    }
    if (filters?.semester) {
      constraints.push(where("semester", "==", filters.semester));
    }
    if (filters?.difficulty) {
      constraints.push(where("difficulty", "==", filters.difficulty));
    }
    if (filters?.examType) {
      constraints.push(where("examType", "==", filters.examType));
    }
    if (filters?.professor) {
      constraints.push(where("professor", "==", filters.professor));
    }
    if (filters?.hasTopperBadge !== undefined) {
      constraints.push(where("hasTopperBadge", "==", filters.hasTopperBadge));
    }
    if (filters?.minRating !== undefined) {
      constraints.push(where("averageRating", ">=", filters.minRating));
    }

    // Order by creation date (newest first)
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(limitCount));

    const notesRef = collection(db, NOTES_COLLECTION);
    const q = query(notesRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let notes = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Note)
    );

    // Client-side filtering for search query and other complex filters
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      notes = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.description?.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          note.subject.toLowerCase().includes(query)
      );
    }

    return notes;
  } catch (error) {
    console.error("Error getting notes:", error);
    throw error;
  }
}

/**
 * Update note views (increment)
 */
export async function incrementNoteViews(noteId: string): Promise<void> {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error("Error incrementing views:", error);
    throw error;
  }
}

/**
 * Update note downloads (increment)
 */
export async function incrementNoteDownloads(noteId: string): Promise<void> {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      downloads: increment(1),
    });
  } catch (error) {
    console.error("Error incrementing downloads:", error);
    throw error;
  }
}

/**
 * Rate a note
 */
export async function rateNote(
  noteId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<void> {
  try {
    // Check if user already rated
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(
      ratingsRef,
      where("noteId", "==", noteId),
      where("userId", "==", userId)
    );
    const existingRatings = await getDocs(q);

    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const note = await getNote(noteId);

    if (!note) {
      throw new Error("Note not found");
    }

    if (existingRatings.empty) {
      // Create new rating
      const ratingRef = doc(collection(db, RATINGS_COLLECTION));
      await setDoc(ratingRef, {
        noteId,
        userId,
        rating,
        comment: comment || null,
        createdAt: Timestamp.now(),
      });

      // Update note average rating
      const newTotalRatings = note.totalRatings + 1;
      const newAverageRating =
        (note.averageRating * note.totalRatings + rating) / newTotalRatings;

      await updateDoc(noteRef, {
        totalRatings: newTotalRatings,
        averageRating: newAverageRating,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Update existing rating
      const existingRating = existingRatings.docs[0];
      const oldRating = existingRating.data().rating;

      await updateDoc(existingRating.ref, {
        rating,
        comment: comment || null,
      });

      // Recalculate average
      const newAverageRating =
        (note.averageRating * note.totalRatings - oldRating + rating) /
        note.totalRatings;

      await updateDoc(noteRef, {
        averageRating: newAverageRating,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error rating note:", error);
    throw error;
  }
}

/**
 * Get user's rating for a note
 */
export async function getUserRating(
  noteId: string,
  userId: string
): Promise<NoteRating | null> {
  try {
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(
      ratingsRef,
      where("noteId", "==", noteId),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const ratingDoc = querySnapshot.docs[0];
      return {
        id: ratingDoc.id,
        ...ratingDoc.data(),
      } as NoteRating;
    }
    return null;
  } catch (error) {
    console.error("Error getting user rating:", error);
    return null;
  }
}

/**
 * Get all ratings for a note
 */
export async function getNoteRatings(noteId: string): Promise<NoteRating[]> {
  try {
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(ratingsRef, where("noteId", "==", noteId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as NoteRating)
    );
  } catch (error) {
    console.error("Error getting note ratings:", error);
    throw error;
  }
}

/**
 * Create an Exam Survival Kit
 */
export async function createSurvivalKit(
  kitData: Omit<ExamSurvivalKit, "id" | "downloads" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const kitRef = doc(collection(db, SURVIVAL_KITS_COLLECTION));
    const kit: Omit<ExamSurvivalKit, "id"> = {
      ...kitData,
      downloads: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(kitRef, kit);
    return kitRef.id;
  } catch (error) {
    console.error("Error creating survival kit:", error);
    throw error;
  }
}

/**
 * Get survival kit by ID
 */
export async function getSurvivalKit(kitId: string): Promise<ExamSurvivalKit | null> {
  try {
    const kitRef = doc(db, SURVIVAL_KITS_COLLECTION, kitId);
    const kitSnap = await getDoc(kitRef);

    if (kitSnap.exists()) {
      return {
        id: kitSnap.id,
        ...kitSnap.data(),
      } as ExamSurvivalKit;
    }
    return null;
  } catch (error) {
    console.error("Error getting survival kit:", error);
    throw error;
  }
}

/**
 * Get all survival kits
 */
export async function getSurvivalKits(
  subject?: string,
  semester?: string
): Promise<ExamSurvivalKit[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (subject) {
      constraints.push(where("subject", "==", subject));
    }
    if (semester) {
      constraints.push(where("semester", "==", semester));
    }

    constraints.push(orderBy("createdAt", "desc"));

    const kitsRef = collection(db, SURVIVAL_KITS_COLLECTION);
    const q = query(kitsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as ExamSurvivalKit)
    );
  } catch (error) {
    console.error("Error getting survival kits:", error);
    throw error;
  }
}

/**
 * Increment survival kit downloads
 */
export async function incrementKitDownloads(kitId: string): Promise<void> {
  try {
    const kitRef = doc(db, SURVIVAL_KITS_COLLECTION, kitId);
    await updateDoc(kitRef, {
      downloads: increment(1),
    });
  } catch (error) {
    console.error("Error incrementing kit downloads:", error);
    throw error;
  }
}

/**
 * Delete a note (only by uploader)
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  try {
    const note = await getNote(noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    if (note.uploaderId !== userId) {
      throw new Error("Unauthorized: Only the uploader can delete this note");
    }

    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
}
