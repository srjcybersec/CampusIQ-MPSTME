import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { TimetableEntry } from "@/lib/data/timetable";

export interface ProactiveAlert {
  type: "class_reminder" | "attendance_warning" | "upcoming_deadline";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  timestamp: Date;
  actionUrl?: string;
}

export function useProactiveAssistance() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Check for upcoming classes
  const checkUpcomingClasses = useCallback(async (timetable: TimetableEntry[]) => {
    if (!timetable || timetable.length === 0) return [];

    const now = new Date();
    const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const alerts: ProactiveAlert[] = [];

    // Check today's classes
    const todayClasses = timetable.filter(
      (entry) => entry.day === currentDay
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const classEntry of todayClasses) {
      const [classHour, classMin] = classEntry.startTime.split(":").map(Number);
      const classTime = classHour * 60 + classMin;
      const [currentHour, currentMin] = currentTime.split(":").map(Number);
      const currentTimeMinutes = currentHour * 60 + currentMin;

      const minutesUntilClass = classTime - currentTimeMinutes;

      // Remind 15 minutes before class
      if (minutesUntilClass > 0 && minutesUntilClass <= 15) {
        alerts.push({
          type: "class_reminder",
          title: `Class starting soon: ${classEntry.subject}`,
          message: `${classEntry.subject} starts in ${minutesUntilClass} minutes at ${classEntry.startTime} in ${classEntry.room || "TBA"}`,
          priority: minutesUntilClass <= 5 ? "high" : "medium",
          timestamp: new Date(),
          actionUrl: "/schedule",
        });
      }
    }

    return alerts;
  }, []);

  // Check attendance warnings
  const checkAttendanceWarnings = useCallback(async () => {
    if (!user?.uid) return [];

    try {
      // Fetch attendance data
      const response = await fetch(`/api/schedule/get?userId=${user.uid}`);
      const data = await response.json();
      
      if (!data.success || !data.entries || data.entries.length === 0) {
        return [];
      }

      // Fetch attendance results (if available)
      // For now, we'll create a generic reminder
      const alerts: ProactiveAlert[] = [];

      // Check if user hasn't checked attendance recently
      const lastCheck = localStorage.getItem(`attendance_last_check_${user.uid}`);
      const daysSinceCheck = lastCheck 
        ? Math.floor((Date.now() - parseInt(lastCheck)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceCheck >= 7) {
        alerts.push({
          type: "attendance_warning",
          title: "Time to check your attendance",
          message: "It's been a while since you last checked your attendance. Make sure you're on track!",
          priority: "medium",
          timestamp: new Date(),
          actionUrl: "/academics?section=attendance",
        });
      }

      return alerts;
    } catch (error) {
      console.error("Error checking attendance warnings:", error);
      return [];
    }
  }, [user?.uid]);

  // Check for all proactive alerts
  const checkAlerts = useCallback(async () => {
    if (!user?.uid || isChecking) return;

    setIsChecking(true);
    try {
      // Fetch timetable
      const scheduleResponse = await fetch(`/api/schedule/get?userId=${user.uid}`);
      const scheduleData = await scheduleResponse.json();

      const allAlerts: ProactiveAlert[] = [];

      // Check upcoming classes
      if (scheduleData.success && scheduleData.entries) {
        const classAlerts = await checkUpcomingClasses(scheduleData.entries);
        allAlerts.push(...classAlerts);
      }

      // Check attendance warnings
      const attendanceAlerts = await checkAttendanceWarnings();
      allAlerts.push(...attendanceAlerts);

      // Sort by priority and timestamp
      allAlerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      setAlerts(allAlerts);

      // Show browser notifications for high priority alerts
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        allAlerts
          .filter((alert) => alert.priority === "high")
          .forEach((alert) => {
            new Notification(alert.title, {
              body: alert.message,
              icon: "/campusiq-logo.png",
              tag: alert.type,
            });
          });
      }

      return allAlerts;
    } catch (error) {
      console.error("Error checking proactive alerts:", error);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [user?.uid, isChecking, checkUpcomingClasses, checkAttendanceWarnings]);

  // Check alerts periodically
  useEffect(() => {
    if (!user?.uid) return;

    // Check immediately
    checkAlerts();

    // Check every 5 minutes
    const interval = setInterval(() => {
      checkAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only depend on user.uid to avoid infinite loop

  return {
    alerts,
    isChecking,
    checkAlerts,
  };
}
