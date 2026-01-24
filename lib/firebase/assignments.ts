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
  writeBatch,
  QueryConstraint,
} from "firebase/firestore";
import {
  Assignment,
  Course,
  AssignmentSubmission,
  ReminderConfig,
  ReminderPreferences,
  AssignmentHealthScore,
  MicrosoftTokens,
  AssignmentFilter,
  AssignmentStatus,
} from "@/lib/types/assignments";

const ASSIGNMENTS_COLLECTION = "assignments";
const COURSES_COLLECTION = "courses";
const SUBMISSIONS_COLLECTION = "assignmentSubmissions";
const REMINDERS_COLLECTION = "assignmentReminders";
const REMINDER_PREFERENCES_COLLECTION = "reminderPreferences";
const HEALTH_SCORES_COLLECTION = "assignmentHealthScores";
const MICROSOFT_TOKENS_COLLECTION = "microsoftTokens";

/**
 * Save or update Microsoft OAuth tokens
 */
export async function saveMicrosoftTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scope: string;
  }
): Promise<void> {
  try {
    const tokenRef = doc(db, MICROSOFT_TOKENS_COLLECTION, userId);
    await setDoc(
      tokenRef,
      {
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Timestamp.fromMillis(tokens.expiresAt),
        scope: tokens.scope,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving Microsoft tokens:", error);
    throw error;
  }
}

/**
 * Get Microsoft OAuth tokens for a user
 */
export async function getMicrosoftTokens(
  userId: string
): Promise<MicrosoftTokens | null> {
  try {
    const tokenRef = doc(db, MICROSOFT_TOKENS_COLLECTION, userId);
    const tokenDoc = await getDoc(tokenRef);
    if (!tokenDoc.exists()) {
      return null;
    }
    const data = tokenDoc.data();
    return {
      userId: data.userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      scope: data.scope,
      updatedAt: data.updatedAt,
    } as MicrosoftTokens;
  } catch (error) {
    console.error("Error getting Microsoft tokens:", error);
    return null;
  }
}

/**
 * Save or update a course
 */
export async function saveCourse(
  courseData: Omit<Course, "id" | "createdAt" | "updatedAt" | "syncedAt">
): Promise<string> {
  try {
    // Check if course already exists by externalId
    let courseRef;
    if (courseData.externalId) {
      const existingQuery = query(
        collection(db, COURSES_COLLECTION),
        where("externalId", "==", courseData.externalId),
        where("userId", "==", courseData.userId)
      );
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        courseRef = doc(db, COURSES_COLLECTION, existingDocs.docs[0].id);
        await updateDoc(courseRef, {
          ...courseData,
          updatedAt: Timestamp.now(),
          syncedAt: Timestamp.now(),
        });
        return courseRef.id;
      }
    }

    // Create new course
    courseRef = doc(collection(db, COURSES_COLLECTION));
    await setDoc(courseRef, {
      ...courseData,
      syncedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return courseRef.id;
  } catch (error) {
    console.error("Error saving course:", error);
    throw error;
  }
}

/**
 * Get all courses for a user
 */
export async function getUserCourses(userId: string): Promise<Course[]> {
  try {
    // Get all courses for the user
    const coursesQuery = query(
      collection(db, COURSES_COLLECTION),
      where("userId", "==", userId)
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    const allCourses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
    
    // Get all assignments for the user to filter courses
    const assignmentsQuery = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("userId", "==", userId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignmentCourseIds = new Set(
      assignmentsSnapshot.docs
        .map((doc) => doc.data().courseId)
        .filter((id) => id != null)
    );
    
    // Only return courses that have at least one assignment
    const coursesWithAssignments = allCourses.filter(
      (course) => assignmentCourseIds.has(course.id)
    );
    
    // Sort client-side to avoid index requirement
    coursesWithAssignments.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
    return coursesWithAssignments;
  } catch (error) {
    console.error("Error getting courses:", error);
    return [];
  }
}

/**
 * Save or update an assignment
 */
export async function saveAssignment(
  assignmentData: Omit<
    Assignment,
    "id" | "createdAt" | "updatedAt"
  >
): Promise<string> {
  try {
    // Check if assignment already exists by externalId
    let assignmentRef;
    let isNew = false;
    if (assignmentData.externalId) {
      const existingQuery = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("externalId", "==", assignmentData.externalId),
        where("userId", "==", assignmentData.userId)
      );
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, existingDocs.docs[0].id);
        await updateDoc(assignmentRef, {
          ...assignmentData,
          updatedAt: Timestamp.now(),
        });
        return assignmentRef.id;
      }
    }

    // Create new assignment
    isNew = true;
    assignmentRef = doc(collection(db, ASSIGNMENTS_COLLECTION));
    await setDoc(assignmentRef, {
      ...assignmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create reminders for new assignments
    if (isNew) {
      try {
        const preferences = await getReminderPreferences(assignmentData.userId);
        if (preferences && preferences.enabled) {
          const dueDate = assignmentData.dueDate.toDate();
          await createAssignmentReminders(
            assignmentRef.id,
            assignmentData.userId,
            dueDate,
            preferences
          );
        }
      } catch (reminderError) {
        // Don't fail assignment creation if reminder creation fails
        console.error("Error creating reminders:", reminderError);
      }
    }

    return assignmentRef.id;
  } catch (error) {
    console.error("Error saving assignment:", error);
    throw error;
  }
}

/**
 * Get assignments for a user with optional filters
 */
export async function getUserAssignments(
  userId: string,
  filters?: AssignmentFilter
): Promise<Assignment[]> {
  try {
    if (!userId) {
      console.warn("getUserAssignments called without userId");
      return [];
    }

    const constraints: QueryConstraint[] = [where("userId", "==", userId)];

    if (filters?.status && filters.status.length > 0) {
      constraints.push(where("status", "in", filters.status));
    }

    if (filters?.courseId) {
      constraints.push(where("courseId", "==", filters.courseId));
    }

    // Note: orderBy requires a composite index. We'll sort client-side instead
    // constraints.push(orderBy("dueDate", "asc"));

    const assignmentsQuery = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      ...constraints
    );
    const snapshot = await getDocs(assignmentsQuery);
    console.log(`Found ${snapshot.docs.length} assignments for user ${userId}`);
    let assignments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Assignment[];

    // Apply client-side filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      assignments = assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.courseName.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.dateRange) {
      assignments = assignments.filter((a) => {
        const dueDate = a.dueDate.toDate();
        return (
          dueDate >= filters.dateRange!.start &&
          dueDate <= filters.dateRange!.end
        );
      });
    }

    // Sort by nearest deadline (client-side)
    assignments.sort((a, b) => {
      return a.dueDate.toMillis() - b.dueDate.toMillis();
    });

    return assignments;
  } catch (error) {
    console.error("Error getting assignments:", error);
    return [];
  }
}

/**
 * Get a single assignment by ID
 */
export async function getAssignment(
  assignmentId: string
): Promise<Assignment | null> {
  try {
    const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    if (!assignmentDoc.exists()) {
      return null;
    }
    return { id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment;
  } catch (error) {
    console.error("Error getting assignment:", error);
    return null;
  }
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  submissionDate?: Date
): Promise<void> {
  try {
    const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    
    // Get the assignment to check due date
    const assignmentDoc = await getDoc(assignmentRef);
    if (!assignmentDoc.exists()) {
      throw new Error("Assignment not found");
    }
    
    const assignment = assignmentDoc.data() as Assignment;
    let finalStatus = status;
    
    // If marking as submitted, check if it's late
    if (status === "submitted" && submissionDate && assignment.dueDate) {
      const dueDate = assignment.dueDate.toDate();
      if (submissionDate > dueDate) {
        finalStatus = "late";
      }
    }
    
    const updateData: any = {
      status: finalStatus,
      submitted: finalStatus === "submitted" || finalStatus === "late",
      updatedAt: Timestamp.now(),
    };
    if (submissionDate) {
      updateData.submissionDate = Timestamp.fromDate(submissionDate);
    }
    await updateDoc(assignmentRef, updateData);
  } catch (error) {
    console.error("Error updating assignment status:", error);
    throw error;
  }
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  try {
    const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
    
    // Get the assignment to check its courseId before deleting
    const assignmentDoc = await getDoc(assignmentRef);
    if (!assignmentDoc.exists()) {
      throw new Error("Assignment not found");
    }
    
    const assignment = assignmentDoc.data() as Assignment;
    const courseId = assignment.courseId;
    
    // Delete the assignment
    await deleteDoc(assignmentRef);
    
    // Check if there are any remaining assignments for this course
    if (courseId) {
      const remainingAssignmentsQuery = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("courseId", "==", courseId),
        where("userId", "==", assignment.userId)
      );
      const remainingAssignments = await getDocs(remainingAssignmentsQuery);
      
      // If no assignments remain for this course, delete the course
      if (remainingAssignments.empty) {
        const courseRef = doc(db, COURSES_COLLECTION, courseId);
        try {
          await deleteDoc(courseRef);
        } catch (courseError) {
          // Don't fail if course deletion fails (course might not exist)
          console.warn("Error deleting orphaned course:", courseError);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw error;
  }
}

/**
 * Save or update a submission
 */
export async function saveSubmission(
  submissionData: Omit<
    AssignmentSubmission,
    "id" | "createdAt" | "updatedAt"
  >
): Promise<string> {
  try {
    const submissionRef = doc(collection(db, SUBMISSIONS_COLLECTION));
    await setDoc(submissionRef, {
      ...submissionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return submissionRef.id;
  } catch (error) {
    console.error("Error saving submission:", error);
    throw error;
  }
}

/**
 * Get user's reminder preferences
 */
export async function getReminderPreferences(
  userId: string
): Promise<ReminderPreferences | null> {
  try {
    const prefRef = doc(db, REMINDER_PREFERENCES_COLLECTION, userId);
    const prefDoc = await getDoc(prefRef);
    if (!prefDoc.exists()) {
      return null;
    }
    return { userId, ...prefDoc.data() } as ReminderPreferences;
  } catch (error) {
    console.error("Error getting reminder preferences:", error);
    return null;
  }
}

/**
 * Save or update reminder preferences
 */
export async function saveReminderPreferences(
  preferences: Omit<ReminderPreferences, "updatedAt">
): Promise<void> {
  try {
    const prefRef = doc(
      db,
      REMINDER_PREFERENCES_COLLECTION,
      preferences.userId
    );
    await setDoc(
      prefRef,
      {
        ...preferences,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving reminder preferences:", error);
    throw error;
  }
}

/**
 * Create reminder configurations for an assignment
 */
export async function createAssignmentReminders(
  assignmentId: string,
  userId: string,
  dueDate: Date,
  preferences: ReminderPreferences
): Promise<string[]> {
  try {
    const reminderIds: string[] = [];
    const batch = writeBatch(db);
    const dueTimestamp = Timestamp.fromDate(dueDate);
    const now = new Date();

    // 24 hours before
    if (preferences["24h_before"]) {
      const reminder24h = new Date(dueDate);
      reminder24h.setHours(reminder24h.getHours() - 24);
      if (reminder24h > now) {
        const reminderRef = doc(collection(db, REMINDERS_COLLECTION));
        batch.set(reminderRef, {
          assignmentId,
          userId,
          type: "24h_before",
          scheduledFor: Timestamp.fromDate(reminder24h),
          channels: preferences.channels,
          sent: false,
          createdAt: Timestamp.now(),
        });
        reminderIds.push(reminderRef.id);
      }
    }

    // 2 hours before
    if (preferences["2h_before"]) {
      const reminder2h = new Date(dueDate);
      reminder2h.setHours(reminder2h.getHours() - 2);
      if (reminder2h > now) {
        const reminderRef = doc(collection(db, REMINDERS_COLLECTION));
        batch.set(reminderRef, {
          assignmentId,
          userId,
          type: "2h_before",
          scheduledFor: Timestamp.fromDate(reminder2h),
          channels: preferences.channels,
          sent: false,
          createdAt: Timestamp.now(),
        });
        reminderIds.push(reminderRef.id);
      }
    }

    // On deadline
    if (preferences["on_deadline"]) {
      if (dueDate > now) {
        const reminderRef = doc(collection(db, REMINDERS_COLLECTION));
        batch.set(reminderRef, {
          assignmentId,
          userId,
          type: "on_deadline",
          scheduledFor: dueTimestamp,
          channels: preferences.channels,
          sent: false,
          createdAt: Timestamp.now(),
        });
        reminderIds.push(reminderRef.id);
      }
    }

    // Missed deadline (1 hour after deadline)
    if (preferences["missed_deadline"]) {
      const reminderMissed = new Date(dueDate);
      reminderMissed.setHours(reminderMissed.getHours() + 1);
      const reminderRef = doc(collection(db, REMINDERS_COLLECTION));
      batch.set(reminderRef, {
        assignmentId,
        userId,
        type: "missed_deadline",
        scheduledFor: Timestamp.fromDate(reminderMissed),
        channels: preferences.channels,
        sent: false,
        createdAt: Timestamp.now(),
      });
      reminderIds.push(reminderRef.id);
    }

    await batch.commit();
    return reminderIds;
  } catch (error) {
    console.error("Error creating reminders:", error);
    throw error;
  }
}

/**
 * Get pending reminders
 */
export async function getPendingReminders(
  userId: string
): Promise<ReminderConfig[]> {
  try {
    const remindersQuery = query(
      collection(db, REMINDERS_COLLECTION),
      where("userId", "==", userId),
      where("sent", "==", false),
      where("scheduledFor", "<=", Timestamp.now()),
      orderBy("scheduledFor", "asc")
    );
    const snapshot = await getDocs(remindersQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReminderConfig[];
  } catch (error) {
    console.error("Error getting pending reminders:", error);
    return [];
  }
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(reminderId: string): Promise<void> {
  try {
    const reminderRef = doc(db, REMINDERS_COLLECTION, reminderId);
    await updateDoc(reminderRef, {
      sent: true,
      sentAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error marking reminder as sent:", error);
    throw error;
  }
}

/**
 * Calculate and save assignment health score
 */
export async function calculateHealthScore(
  userId: string,
  period: "weekly" | "monthly"
): Promise<AssignmentHealthScore> {
  try {
    const now = new Date();
    const startDate = new Date(now);
    if (period === "weekly") {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get ALL assignments for the user (not filtered by date range)
    // We'll filter by due date or submission date in the period
    const allAssignments = await getUserAssignments(userId);

    // Filter assignments that are relevant to this period:
    // - Assignments due in this period, OR
    // - Assignments submitted in this period
    const assignments = allAssignments.filter((a) => {
      const dueDate = a.dueDate.toDate();
      const isDueInPeriod = dueDate >= startDate && dueDate <= now;
      
      // Also include if submitted in this period
      let isSubmittedInPeriod = false;
      if (a.submissionDate) {
        const submissionDate = a.submissionDate.toDate();
        isSubmittedInPeriod = submissionDate >= startDate && submissionDate <= now;
      }
      
      // Include if due in period OR submitted in period OR past due (overdue)
      return isDueInPeriod || isSubmittedInPeriod || dueDate < now;
    });

    const totalAssignments = assignments.length;
    
    // Count completed on time: submitted before or on due date
    const completedOnTime = assignments.filter((a) => {
      // Must be submitted (either "submitted" or "late" status) and have submission date
      if ((a.status !== "submitted" && a.status !== "late") || !a.submissionDate) return false;
      const submissionDate = a.submissionDate.toDate();
      const dueDate = a.dueDate.toDate();
      // Submitted on or before due date
      return submissionDate <= dueDate;
    }).length;
    
    // Count late: submitted after due date (status is "late" or "submitted" with late submission)
    const late = assignments.filter((a) => {
      // If status is explicitly "late", it's late
      if (a.status === "late") return true;
      // If status is "submitted" but submission was after due date, it's late
      if (a.status === "submitted" && a.submissionDate) {
        const submissionDate = a.submissionDate.toDate();
        const dueDate = a.dueDate.toDate();
        return submissionDate > dueDate;
      }
      return false;
    }).length;
    
    // Count overdue: past due date and not submitted (not "submitted" or "late")
    const overdue = assignments.filter((a) => {
      const dueDate = a.dueDate.toDate();
      const isPastDue = dueDate < now;
      // Past due and not submitted (status is "pending" or "overdue")
      return isPastDue && a.status !== "submitted" && a.status !== "late";
    }).length;
    
    console.log("Health Score Calculation:", {
      totalAssignments,
      completedOnTime,
      late,
      overdue,
      assignments: assignments.map(a => ({
        title: a.title,
        status: a.status,
        dueDate: a.dueDate.toDate().toISOString(),
        submissionDate: a.submissionDate?.toDate().toISOString(),
      }))
    });

    const score =
      totalAssignments > 0
        ? Math.round((completedOnTime / totalAssignments) * 100)
        : 100;

    let status: "excellent" | "good" | "needs_improvement" | "poor";
    if (score >= 90) {
      status = "excellent";
    } else if (score >= 70) {
      status = "good";
    } else if (score >= 50) {
      status = "needs_improvement";
    } else {
      status = "poor";
    }

    const healthScore: AssignmentHealthScore = {
      userId,
      period,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(now),
      totalAssignments,
      completedOnTime,
      overdue,
      late,
      score,
      status,
      createdAt: Timestamp.now(),
    };

    // Save health score
    const scoreRef = doc(collection(db, HEALTH_SCORES_COLLECTION));
    await setDoc(scoreRef, healthScore);

    return healthScore;
  } catch (error) {
    console.error("Error calculating health score:", error);
    throw error;
  }
}

/**
 * Get latest health score for a user
 */
export async function getLatestHealthScore(
  userId: string,
  period: "weekly" | "monthly"
): Promise<AssignmentHealthScore | null> {
  try {
    // Note: orderBy requires a composite index. We'll sort client-side instead
    const scoresQuery = query(
      collection(db, HEALTH_SCORES_COLLECTION),
      where("userId", "==", userId),
      where("period", "==", period)
      // orderBy("createdAt", "desc"), limit(1) - removed to avoid index requirement
    );
    const snapshot = await getDocs(scoresQuery);
    if (snapshot.empty) {
      return null;
    }
    // Sort client-side and get the latest
    const scores = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AssignmentHealthScore[];
    scores.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return scores[0] || null;
  } catch (error) {
    console.error("Error getting health score:", error);
    return null;
  }
}
