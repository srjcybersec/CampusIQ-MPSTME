"use client";

import { useState, useEffect, Suspense } from "react";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ScheduleDayView } from "@/components/schedule/schedule-day-view";
import { ScheduleChat } from "@/components/schedule/schedule-chat";
import { GoogleCalendarSync } from "@/components/schedule/google-calendar-sync";
import { TIMETABLE_DATA, TimetableEntry } from "@/lib/data/timetable";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-glow transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Schedule</h1>
                <p className="text-lg text-neutral-600 mt-1">Your weekly timetable and class schedule</p>
              </div>
            </div>
          </div>

          {/* Day Selector */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedDay("today")}
              variant={selectedDay === "today" ? "default" : "outline"}
              className={selectedDay === "today" ? "gradient-primary text-white" : ""}
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
                  className={selectedDay === index.toString() ? "gradient-primary text-white" : ""}
                >
                  {dayName} {isToday && "(Today)"}
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule View */}
            <div className="space-y-6">
              <ScheduleDayView
                entries={selected.entries}
                day={selected.day}
                date={selected.date}
                comments={comments}
                onCommentChange={handleCommentChange}
              />
              
              {/* Google Calendar Sync */}
              <GoogleCalendarSync />
            </div>

            {/* AI Chat */}
            <div>
              <ScheduleChat timetable={TIMETABLE_DATA} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <SchedulePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
