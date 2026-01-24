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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Workload Overview
        </CardTitle>
        <CardDescription>This week&apos;s assignment schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <p className="text-3xl font-bold text-neutral-900">{totalThisWeek}</p>
            <p className="text-sm text-neutral-600">
              Assignments due this week
            </p>
          </div>

          {heavyDays.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Heavy workload detected on {heavyDays.length} day{heavyDays.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  day.isHeavy
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-neutral-700">
                    {format(day.date, "EEE d")}
                  </div>
                  <div className="flex-1">
                    {day.assignmentCount === 0 ? (
                      <span className="text-sm text-neutral-500">No assignments</span>
                    ) : (
                      <span className="text-sm text-neutral-700">
                        {day.assignmentCount} assignment{day.assignmentCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                {day.isHeavy && (
                  <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
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
