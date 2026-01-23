import { db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import {
  MatrimonyProfile,
  Match,
  ChatMessage,
  MatchReport,
  ConnectionType,
  calculateCompatibility,
  getCGPALeague,
} from "@/lib/types/matrimony";

const PROFILES_COLLECTION = "matrimonyProfiles";
const MATCHES_COLLECTION = "matrimonyMatches";
const CHAT_COLLECTION = "matrimonyChats";
const REPORTS_COLLECTION = "matrimonyReports";

/**
 * Create or update matrimony profile
 */
export async function createOrUpdateProfile(
  userId: string,
  profileData: Omit<MatrimonyProfile, "id" | "userId" | "createdAt" | "updatedAt" | "isVerified" | "reports">
): Promise<string> {
  try {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    const profileDoc = await getDoc(profileRef);

    // Filter out undefined values (Firestore doesn't allow undefined)
    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined)
    );

    const data = {
      ...cleanProfileData,
      userId,
      isActive: true,
      isVerified: false, // Can be verified later by admins
      reports: 0,
      updatedAt: Timestamp.now(),
    };

    if (profileDoc.exists()) {
      await updateDoc(profileRef, data);
    } else {
      await setDoc(profileRef, {
        ...data,
        createdAt: Timestamp.now(),
      });
    }

    return profileRef.id;
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    throw error;
  }
}

/**
 * Get user's matrimony profile
 */
export async function getProfile(userId: string): Promise<MatrimonyProfile | null> {
  try {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    const profileDoc = await getDoc(profileRef);

    if (profileDoc.exists()) {
      return {
        id: profileDoc.id,
        ...profileDoc.data(),
      } as MatrimonyProfile;
    }

    return null;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
}

/**
 * Find potential matches
 */
export async function findMatches(
  userId: string,
  maxResults: number = 10
): Promise<Match[]> {
  try {
    const userProfile = await getProfile(userId);
    if (!userProfile) {
      throw new Error("Profile not found. Please create your profile first.");
    }

    // Get all active profiles (we'll filter out current user client-side)
    const profilesQuery = query(
      collection(db, PROFILES_COLLECTION),
      where("isActive", "==", true),
      limit(50) // Fetch more to filter and score
    );

    const profilesSnapshot = await getDocs(profilesQuery);
    let profiles = profilesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MatrimonyProfile[];
    
    // Filter out current user
    profiles = profiles.filter(profile => profile.userId !== userId);

    // Calculate compatibility for each profile
    const matches: Array<{ profile: MatrimonyProfile; compatibility: { score: number; reasons: string[] } }> = [];

    for (const profile of profiles) {
      // Check if there's already a match
      const existingMatch = await getExistingMatch(userId, profile.userId);
      if (existingMatch && existingMatch.status !== "rejected") {
        continue; // Skip if already matched
      }

      // Check connection type compatibility
      const commonConnectionTypes = userProfile.connectionType.filter(ct =>
        profile.connectionType.includes(ct)
      );
      if (commonConnectionTypes.length === 0) {
        continue; // Skip if no common connection types
      }

      // Calculate compatibility
      const compatibility = calculateCompatibility(userProfile, profile);
      
      // Only include matches with score >= 40
      if (compatibility.score >= 40) {
        matches.push({ profile, compatibility });
      }
    }

    // Sort by compatibility score (descending)
    matches.sort((a, b) => b.compatibility.score - a.compatibility.score);

    // Create match documents for top matches
    const topMatches = matches.slice(0, maxResults);
    const matchPromises = topMatches.map(async ({ profile, compatibility }) => {
      const matchId = `${userId}_${profile.userId}`;
      const matchRef = doc(db, MATCHES_COLLECTION, matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        // Determine connection type (use first common type)
        const commonTypes = userProfile.connectionType.filter(ct =>
          profile.connectionType.includes(ct)
        );
        const connectionType = commonTypes[0] || "friends";

        const matchData: Omit<Match, "id"> = {
          user1Id: userId,
          user2Id: profile.userId,
          compatibilityScore: compatibility.score,
          cgpaLeague: getCGPALeague(profile.cgpa),
          matchReasons: compatibility.reasons,
          connectionType,
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await setDoc(matchRef, matchData);
      }

      return {
        id: matchId,
        ...(matchDoc.exists() ? matchDoc.data() : {
          user1Id: userId,
          user2Id: profile.userId,
          compatibilityScore: compatibility.score,
          cgpaLeague: getCGPALeague(profile.cgpa),
          matchReasons: compatibility.reasons,
          connectionType: userProfile.connectionType[0],
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }),
      } as Match;
    });

    return Promise.all(matchPromises);
  } catch (error) {
    console.error("Error finding matches:", error);
    throw error;
  }
}

/**
 * Get existing match between two users
 */
async function getExistingMatch(userId1: string, userId2: string): Promise<Match | null> {
  try {
    const matchId1 = `${userId1}_${userId2}`;
    const matchId2 = `${userId2}_${userId1}`;

    const matchRef1 = doc(db, MATCHES_COLLECTION, matchId1);
    const matchRef2 = doc(db, MATCHES_COLLECTION, matchId2);

    const [matchDoc1, matchDoc2] = await Promise.all([
      getDoc(matchRef1),
      getDoc(matchRef2),
    ]);

    if (matchDoc1.exists()) {
      return { id: matchDoc1.id, ...matchDoc1.data() } as Match;
    }

    if (matchDoc2.exists()) {
      return { id: matchDoc2.id, ...matchDoc2.data() } as Match;
    }

    return null;
  } catch (error) {
    console.error("Error getting existing match:", error);
    return null;
  }
}

/**
 * Get user's matches
 */
export async function getUserMatches(userId: string): Promise<Match[]> {
  try {
    const matchesQuery1 = query(
      collection(db, MATCHES_COLLECTION),
      where("user1Id", "==", userId),
      where("status", "==", "accepted"),
      orderBy("updatedAt", "desc")
    );

    const matchesQuery2 = query(
      collection(db, MATCHES_COLLECTION),
      where("user2Id", "==", userId),
      where("status", "==", "accepted"),
      orderBy("updatedAt", "desc")
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(matchesQuery1),
      getDocs(matchesQuery2),
    ]);

    const matches: Match[] = [];

    snapshot1.docs.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match);
    });

    snapshot2.docs.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match);
    });

    // Sort by updatedAt (client-side since we can't use orderBy with multiple queries)
    matches.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds || 0;
      return bTime - aTime; // Descending
    });

    return matches;
  } catch (error) {
    console.error("Error getting user matches:", error);
    return [];
  }
}

/**
 * Accept or reject a match
 */
export async function updateMatchStatus(
  matchId: string,
  status: "accepted" | "rejected" | "blocked"
): Promise<void> {
  try {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    await updateDoc(matchRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating match status:", error);
    throw error;
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(
  matchId: string,
  senderId: string,
  message: string,
  isAnonymous: boolean = true
): Promise<string> {
  try {
    const messageRef = doc(collection(db, CHAT_COLLECTION));
    await setDoc(messageRef, {
      matchId,
      senderId,
      message,
      isAnonymous,
      createdAt: Timestamp.now(),
    });

    return messageRef.id;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}

/**
 * Get chat messages for a match
 */
export async function getChatMessages(matchId: string): Promise<ChatMessage[]> {
  try {
    const messagesQuery = query(
      collection(db, CHAT_COLLECTION),
      where("matchId", "==", matchId),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
  } catch (error) {
    console.error("Error getting chat messages:", error);
    return [];
  }
}

/**
 * Report a match
 */
export async function reportMatch(
  matchId: string,
  reporterId: string,
  reason: string
): Promise<void> {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, `${matchId}_${reporterId}`);
    const reportDoc = await getDoc(reportRef);

    if (reportDoc.exists()) {
      throw new Error("You have already reported this match");
    }

    const batch = writeBatch(db);
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);

    // Create report
    batch.set(reportRef, {
      matchId,
      reporterId,
      reason,
      createdAt: Timestamp.now(),
    });

    // Update match status to blocked
    batch.update(matchRef, {
      status: "blocked",
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  } catch (error) {
    console.error("Error reporting match:", error);
    throw error;
  }
}
