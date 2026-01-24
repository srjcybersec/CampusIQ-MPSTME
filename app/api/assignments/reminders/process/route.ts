import { NextRequest, NextResponse } from "next/server";
import { getPendingReminders, markReminderSent, getAssignment } from "@/lib/firebase/assignments";
import { getReminderPreferences } from "@/lib/firebase/assignments";
import { ReminderConfig } from "@/lib/types/assignments";

/**
 * POST /api/assignments/reminders/process
 * Processes pending reminders and sends notifications
 * This should be called periodically (e.g., via cron job or scheduled function)
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

    // Get pending reminders
    const pendingReminders = await getPendingReminders(userId);

    if (pendingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No pending reminders",
      });
    }

    // Get user preferences
    const preferences = await getReminderPreferences(userId);
    if (!preferences || !preferences.enabled) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "Reminders are disabled",
      });
    }

    const processed: string[] = [];
    const errors: string[] = [];

    for (const reminder of pendingReminders) {
      try {
        // Get assignment details
        const assignment = await getAssignment(reminder.assignmentId);
        if (!assignment) {
          // Assignment deleted, mark reminder as sent
          await markReminderSent(reminder.id);
          continue;
        }

        // Check if reminder type is enabled
        if (!preferences[reminder.type]) {
          // Reminder type disabled, mark as sent
          await markReminderSent(reminder.id);
          continue;
        }

        // Send notifications based on channels
        const notifications: string[] = [];

        if (reminder.channels.includes("in_app")) {
          // In-app notification (stored in Firestore, can be fetched by client)
          notifications.push("in_app");
          // In a real implementation, you might want to create a notifications collection
        }

        if (reminder.channels.includes("email") && preferences.email) {
          // Email notification
          // TODO: Implement email sending (e.g., using SendGrid, Resend, or Nodemailer)
          notifications.push("email");
          console.log(`Would send email to ${preferences.email} for assignment: ${assignment.title}`);
        }

        // Mark reminder as sent
        await markReminderSent(reminder.id);
        processed.push(reminder.id);

        console.log(
          `Processed reminder ${reminder.id} for assignment ${assignment.title} via ${notifications.join(", ")}`
        );
      } catch (error: any) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        errors.push(reminder.id);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processed.length,
      errors: errors.length,
      message: `Processed ${processed.length} reminder(s)`,
    });
  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return NextResponse.json(
      {
        error: "Failed to process reminders",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
