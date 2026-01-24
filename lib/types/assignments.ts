import { Timestamp } from "firebase/firestore";

/**
 * Assignment Status
 */
export type AssignmentStatus = "pending" | "submitted" | "overdue" | "late";

/**
 * Reminder Type
 */
export type ReminderType = "24h_before" | "2h_before" | "on_deadline" | "missed_deadline";

/**
 * Reminder Channel
 */
export type ReminderChannel = "in_app" | "email" | "both";

/**
 * Course/Class from Microsoft Teams
 */
export interface Course {
  id: string;
  displayName: string;
  code?: string;
  description?: string;
  externalId?: string; // Microsoft Teams class ID
  userId: string; // Owner of this course
  syncedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Assignment from Microsoft Teams or Manual Entry
 */
export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  description?: string;
  instructions?: string;
  dueDate: Timestamp;
  status: AssignmentStatus;
  submissionDate?: Timestamp;
  submitted: boolean;
  userId: string; // Owner of this assignment
  externalId?: string; // Microsoft Teams assignment ID
  externalSubmissionId?: string; // Microsoft Teams submission ID
  isManual: boolean; // true if manually created, false if synced from Teams
  points?: number; // Total points possible
  weight?: number; // Weight in course grade
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Assignment Submission
 */
export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  submittedAt: Timestamp;
  submitted: boolean;
  grade?: number;
  feedback?: string;
  externalSubmissionId?: string; // Microsoft Teams submission ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Reminder Configuration
 */
export interface ReminderConfig {
  id: string;
  assignmentId: string;
  userId: string;
  type: ReminderType;
  scheduledFor: Timestamp;
  channels: ReminderChannel[];
  sent: boolean;
  sentAt?: Timestamp;
  createdAt: Timestamp;
}

/**
 * User Reminder Preferences
 */
export interface ReminderPreferences {
  userId: string;
  enabled: boolean;
  channels: ReminderChannel[];
  "24h_before": boolean;
  "2h_before": boolean;
  "on_deadline": boolean;
  "missed_deadline": boolean;
  email?: string; // Email for reminders
  updatedAt: Timestamp;
}

/**
 * Assignment Health Score
 */
export interface AssignmentHealthScore {
  userId: string;
  period: "weekly" | "monthly";
  startDate: Timestamp;
  endDate: Timestamp;
  totalAssignments: number;
  completedOnTime: number;
  overdue: number;
  late: number;
  score: number; // 0-100
  status: "excellent" | "good" | "needs_improvement" | "poor";
  createdAt: Timestamp;
}

/**
 * Microsoft Teams OAuth Tokens
 */
export interface MicrosoftTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
  scope: string;
  updatedAt: Timestamp;
}

/**
 * Assignment Filter
 */
export interface AssignmentFilter {
  status?: AssignmentStatus[];
  courseId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

/**
 * Workload Day
 */
export interface WorkloadDay {
  date: Date;
  assignmentCount: number;
  assignments: Assignment[];
  isHeavy: boolean; // true if >= 3 assignments
}

/**
 * Priority Suggestion
 */
export interface PrioritySuggestion {
  type: "closest_deadline" | "long_pending" | "heavy_workload";
  assignment?: Assignment;
  message: string;
  priority: "high" | "medium" | "low";
}
