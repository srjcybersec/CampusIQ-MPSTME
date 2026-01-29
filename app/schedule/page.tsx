"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ScheduleDayView } from "@/components/schedule/schedule-day-view";
import { ScheduleChat } from "@/components/schedule/schedule-chat";
import { GoogleCalendarSync } from "@/components/schedule/google-calendar-sync";
import { TimetableUpload } from "@/components/schedule/timetable-upload";
import { TimetableEntry } from "@/lib/data/timetable";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Trash2, AlertCircle } from "lucide-react";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { useAuth } from "@/lib/auth/context";

function SchedulePageContent() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string>("today");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = dayNames[today.getDay()];

  // Load schedule from Firestore
  const loadSchedule = useCallback(async () => {
    if (!user?.uid) {
      setIsLoadingSchedule(false);
      return;
    }

    setIsLoadingSchedule(true);
    try {
      const response = await fetch(`/api/schedule/get?userId=${user.uid}`);
      const data = await response.json();
      if (data.success) {
        // Entries are already sorted by the API, but ensure they're sorted here too
        const entries = data.entries || [];
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        entries.sort((a: TimetableEntry, b: TimetableEntry) => {
          const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
          if (dayDiff !== 0) return dayDiff;
          return a.startTime.localeCompare(b.startTime);
        });
        setTimetableData(entries);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Get today's schedule
  const todaySchedule = timetableData.filter(
    (entry) => entry.day === todayDayName
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Get this week's schedule (Monday to Friday)
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 4) }); // Mon-Fri

  const getDaySchedule = (dayName: string) => {
    return timetableData.filter(
      (entry) => entry.day === dayName
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleCommentChange = async (entryId: string, comment: string) => {
    setComments((prev) => ({
      ...prev,
      [entryId]: comment,
    }));
    
    // Save to Firestore
    if (user?.uid) {
      try {
        await fetch("/api/schedule/save-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            entryId,
            comment,
          }),
        });
      } catch (error) {
        console.error("Error saving comment:", error);
      }
    }
  };

  // Load comments from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/schedule/get-comments?userId=${user.uid}`);
        const data = await response.json();
        if (data.success && data.comments) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };
    
    loadComments();
  }, [user?.uid]);

  const getSelectedDaySchedule = (): { entries: TimetableEntry[]; date: Date; day: string } => {
    if (selectedDay === "today") {
      return {
        entries: todaySchedule,
        date: today,
        day: todayDayName,
      };
    }
    const dayIndex = parseInt(selectedDay);
    const selectedDate = weekDays[dayIndex];
    const dayName = dayNames[selectedDate.getDay()];
    return {
      entries: getDaySchedule(dayName),
      date: selectedDate,
      day: dayName,
    };
  };

  const selected = getSelectedDaySchedule();

  const handleDeleteTimetable = async () => {
    if (!user?.uid) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/schedule/delete?userId=${user.uid}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Clear local state
        setTimetableData([]);
        setComments({});
        setShowDeleteConfirm(false);
        // Reload schedule to show upload component
        await loadSchedule();
      } else {
        throw new Error(data.error || "Failed to delete timetable");
      }
    } catch (error: any) {
      console.error("Error deleting timetable:", error);
      alert(`Failed to delete timetable: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEntryUpdate = async (entryId: string, updatedEntry: TimetableEntry) => {
    if (!user?.uid) return;

    try {
      const response = await fetch("/api/schedule/update-entry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          userId: user.uid,
          entryData: updatedEntry,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state and maintain sort order
        setTimetableData((prev) => {
          const updated = prev.map((entry) => (entry.id === entryId ? updatedEntry : entry));
          // Sort by day, then by startTime
          const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          return updated.sort((a, b) => {
            const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            if (dayDiff !== 0) return dayDiff;
            return a.startTime.localeCompare(b.startTime);
          });
        });
      } else {
        throw new Error(data.error || "Failed to update entry");
      }
    } catch (error: any) {
      console.error("Error updating entry:", error);
      alert(`Failed to update entry: ${error.message}`);
    }
  };

  const handleEntryDelete = async (entryId: string) => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/schedule/delete-entry?entryId=${entryId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setTimetableData((prev) => prev.filter((entry) => entry.id !== entryId));
        // Remove comment if exists
        setComments((prev) => {
          const newComments = { ...prev };
          delete newComments[entryId];
          return newComments;
        });
      } else {
        throw new Error(data.error || "Failed to delete entry");
      }
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      alert(`Failed to delete entry: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 relative z-20 max-w-full">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#22D3EE] rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-[#22D3EE] via-[#38BDF8] to-[#22D3EE] rounded-2xl flex items-center justify-center glow-blue">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold gradient-text-purple">Schedule</h1>
                  <p className="text-lg text-[#D4D4D8] mt-1">Your weekly timetable and class schedule</p>
                </div>
              </div>
              
              {/* Delete Timetable Button - Only show when timetable exists */}
              {!isLoadingSchedule && timetableData.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="text-red-400 border-red-500/50 hover:bg-red-500/20 hover:text-red-300 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Remove Timetable</span>
                  <span className="sm:hidden">Remove</span>
                </Button>
              )}
            </div>
          </motion.div>

          {/* Day Selector */}
          <motion.div
            className="mb-6 flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Button
              onClick={() => setSelectedDay("today")}
              variant={selectedDay === "today" ? "default" : "outline"}
            >
              Today ({todayDayName})
            </Button>
            {weekDays.map((date, index) => {
              const dayName = dayNames[date.getDay()];
              const isToday = isSameDay(date, today);
              return (
                <Button
                  key={index}
                  onClick={() => setSelectedDay(index.toString())}
                  variant={selectedDay === index.toString() ? "default" : "outline"}
                >
                  {dayName} {isToday && "(Today)"}
                </Button>
              );
            })}
          </motion.div>

          {isLoadingSchedule ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : timetableData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <TimetableUpload />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Schedule View */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <ScheduleDayView
                  entries={selected.entries}
                  day={selected.day}
                  date={selected.date}
                  comments={comments}
                  onCommentChange={handleCommentChange}
                  onEntryUpdate={handleEntryUpdate}
                  onEntryDelete={handleEntryDelete}
                />
                
                {/* Google Calendar Sync */}
                <GoogleCalendarSync />
              </motion.div>

              {/* AI Chat */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <ScheduleChat timetable={timetableData} />
              </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#161616] border border-red-500/50 rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Delete Timetable?</h3>
                <p className="text-sm text-[#D4D4D8]">
                  Are you sure you want to delete your timetable? This will remove all schedule entries and comments. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTimetable}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white order-1 sm:order-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
        <SchedulePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
