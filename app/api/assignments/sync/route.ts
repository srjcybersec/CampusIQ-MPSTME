import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftTokens, saveMicrosoftTokens } from "@/lib/firebase/assignments";
import {
  getUserClasses,
  getAllAssignments,
  getMySubmission,
  refreshAccessToken,
  isTokenExpired,
} from "@/lib/microsoft-graph/client";
import { saveCourse, saveAssignment, updateAssignmentStatus } from "@/lib/firebase/assignments";
import { Timestamp } from "firebase/firestore";
import { AssignmentStatus } from "@/lib/types/assignments";

/**
 * POST /api/assignments/sync
 * Syncs assignments from Microsoft Teams
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get stored tokens
    let tokens = await getMicrosoftTokens(userId);
    if (!tokens) {
      return NextResponse.json(
        { error: "Microsoft account not connected. Please connect your Microsoft account first." },
        { status: 401 }
      );
    }

    // Check if token is expired and refresh if needed
    if (isTokenExpired(tokens.expiresAt.toMillis())) {
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken);
        await saveMicrosoftTokens(userId, {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokens.refreshToken,
          expiresAt: newTokens.expires_at,
          scope: tokens.scope,
        });
        tokens = await getMicrosoftTokens(userId);
        if (!tokens) {
          throw new Error("Failed to refresh token");
        }
      } catch (refreshError: any) {
        return NextResponse.json(
          { error: "Token refresh failed. Please reconnect your Microsoft account.", details: refreshError.message },
          { status: 401 }
        );
      }
    }

    const accessToken = tokens.accessToken;

    // Fetch classes
    let classes: any[] = [];
    try {
      classes = await getUserClasses(accessToken);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      // Continue with manual assignments if API access is restricted
    }

    // Save courses
    const savedCourses: string[] = [];
    for (const classData of classes) {
      try {
        const courseId = await saveCourse({
          displayName: classData.displayName || classData.name || "Unknown Course",
          code: classData.classCode || classData.code,
          description: classData.description,
          externalId: classData.id,
          userId,
        });
        savedCourses.push(courseId);
      } catch (error) {
        console.error(`Error saving course ${classData.id}:`, error);
      }
    }

    // Fetch all assignments
    let assignments: any[] = [];
    try {
      assignments = await getAllAssignments(accessToken);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      // If Education API is not available, return empty assignments
      return NextResponse.json({
        success: true,
        synced: false,
        message: "Microsoft Teams Education API access is restricted by your institution. You can still create assignments manually.",
        courses: savedCourses.length,
        assignments: 0,
      });
    }

    // Save assignments
    const savedAssignments: string[] = [];
    for (const assignmentData of assignments) {
      try {
        // Determine status
        let status: AssignmentStatus = "pending";
        const dueDate = assignmentData.dueDateTime
          ? new Date(assignmentData.dueDateTime.dateTime)
          : null;
        const now = new Date();

        if (!dueDate) {
          continue; // Skip assignments without due dates
        }

        // Get submission status
        let submitted = false;
        let submissionDate: Date | undefined;
        if (assignmentData.classId && assignmentData.id) {
          try {
            const submission = await getMySubmission(
              accessToken,
              assignmentData.classId,
              assignmentData.id
            );
            if (submission) {
              submitted = submission.status === "submitted" || submission.status === "turnedIn";
              if (submission.submittedDateTime) {
                submissionDate = new Date(submission.submittedDateTime);
              }
            }
          } catch (subError) {
            console.error(`Error fetching submission for assignment ${assignmentData.id}:`, subError);
          }
        }

        if (submitted && submissionDate) {
          status = submissionDate <= dueDate ? "submitted" : "late";
        } else if (dueDate < now) {
          status = "overdue";
        }

        const assignmentId = await saveAssignment({
          title: assignmentData.displayName || "Untitled Assignment",
          courseId: assignmentData.classId || "",
          courseName:
            classes.find((c) => c.id === assignmentData.classId)?.displayName ||
            "Unknown Course",
          description: assignmentData.description,
          instructions: assignmentData.instructions?.content,
          dueDate: Timestamp.fromDate(dueDate),
          status,
          submissionDate: submissionDate
            ? Timestamp.fromDate(submissionDate)
            : undefined,
          submitted,
          userId,
          externalId: assignmentData.id,
          externalSubmissionId: assignmentData.submissionId,
          isManual: false,
          points: assignmentData.grading?.maxPoints,
          weight: assignmentData.grading?.weight,
        });

        savedAssignments.push(assignmentId);
      } catch (error) {
        console.error(
          `Error saving assignment ${assignmentData.id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      synced: true,
      message: `Successfully synced ${savedAssignments.length} assignments from ${savedCourses.length} courses.`,
      courses: savedCourses.length,
      assignments: savedAssignments.length,
    });
  } catch (error: any) {
    console.error("Error syncing assignments:", error);
    return NextResponse.json(
      {
        error: "Failed to sync assignments",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
