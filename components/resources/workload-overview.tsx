"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Assignment, WorkloadDay } from "@/lib/types/assignments";
import { Calendar, AlertTriangle } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface WorkloadOverviewProps {
  assignments: Assignment[];
}

export function WorkloadOverview({ assignments }: WorkloadOverviewProps) {
  const getWeekDays = (): WorkloadDay[] => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const days: WorkloadDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayAssignments = assignments.filter((a) => {
        const dueDate = a.dueDate.toDate();
        return isSameDay(dueDate, date) && a.status !== "submitted";
      });

      days.push({
        date,
        assignmentCount: dayAssignments.length,
        assignments: dayAssignments,
        isHeavy: dayAssignments.length >= 3,
      });
    }

    return days;
  };

  const weekDays = getWeekDays();
  const heavyDays = weekDays.filter((day) => day.isHeavy);
  const totalThisWeek = weekDays.reduce(
    (sum, day) => sum + day.assignmentCount,
    0
  );

  return (
    <Card variant="glass" className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          Workload Overview
        </CardTitle>
        <CardDescription>This week&apos;s assignment schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-[#161616] border border-[#222222] rounded-lg">
            <p className="text-3xl font-bold text-white">{totalThisWeek}</p>
            <p className="text-sm text-[#D4D4D8]">
              Assignments due this week
            </p>
          </div>

          {heavyDays.length > 0 && (
            <div className="p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium text-white">
                  Heavy workload detected on {heavyDays.length} day{heavyDays.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  day.isHeavy
                    ? "bg-orange-500/20 border-orange-500/50"
                    : "bg-[#161616] border-[#222222]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-white">
                    {format(day.date, "EEE d")}
                  </div>
                  <div className="flex-1">
                    {day.assignmentCount === 0 ? (
                      <span className="text-sm text-[#D4D4D8]">No assignments</span>
                    ) : (
                      <span className="text-sm text-white">
                        {day.assignmentCount} assignment{day.assignmentCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                {day.isHeavy && (
                  <span className="text-xs font-medium text-orange-400 bg-orange-500/20 border border-orange-500/50 px-2 py-1 rounded">
                    Heavy
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
