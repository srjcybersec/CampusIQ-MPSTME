"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ScheduleDayView } from "@/components/schedule/schedule-day-view";
import { ScheduleChat } from "@/components/schedule/schedule-chat";
import { GoogleCalendarSync } from "@/components/schedule/google-calendar-sync";
import { TIMETABLE_DATA, TimetableEntry } from "@/lib/data/timetable";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

function SchedulePageContent() {
  const [selectedDay, setSelectedDay] = useState<string>("today");
  const [comments, setComments] = useState<Record<string, string>>({});
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = dayNames[today.getDay()];

  // Get today's schedule
  const todaySchedule = TIMETABLE_DATA.filter(
    (entry) => entry.day === todayDayName
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Get this week's schedule (Monday to Friday)
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 4) }); // Mon-Fri

  const getDaySchedule = (dayName: string) => {
    return TIMETABLE_DATA.filter(
      (entry) => entry.day === dayName
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleCommentChange = (entryId: string, comment: string) => {
    setComments((prev) => ({
      ...prev,
      [entryId]: comment,
    }));
    // TODO: Save to Firestore
  };

  // Load comments from localStorage (temporary - should use Firestore)
  useEffect(() => {
    const savedComments = localStorage.getItem("schedule-comments");
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, []);

  // Save comments to localStorage (temporary - should use Firestore)
  useEffect(() => {
    localStorage.setItem("schedule-comments", JSON.stringify(comments));
  }, [comments]);

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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      <MainNav />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-3">
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
              data-cursor-hover
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
                  data-cursor-hover
                >
                  {dayName} {isToday && "(Today)"}
                </Button>
              );
            })}
          </motion.div>

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
              <ScheduleChat timetable={TIMETABLE_DATA} />
            </motion.div>
          </div>
        </div>
      </main>
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
