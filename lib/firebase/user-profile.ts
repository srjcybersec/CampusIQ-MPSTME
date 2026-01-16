import { db } from "./config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  role: "student" | "faculty";
  createdAt: any;
  updatedAt: any;
}

/**
 * Create or update user profile in Firestore
 */
export async function createOrUpdateUserProfile(
  uid: string,
  email: string,
  role: "student" | "faculty"
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new profile
      await setDoc(userRef, {
        email,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing profile (only if role changed)
      const currentData = userSnap.data();
      if (currentData.role !== role) {
        await setDoc(
          userRef,
          {
            role,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        uid,
        ...userSnap.data(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}
