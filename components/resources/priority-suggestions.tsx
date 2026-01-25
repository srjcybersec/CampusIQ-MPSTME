"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Assignment, PrioritySuggestion } from "@/lib/types/assignments";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import { format, differenceInHours, differenceInDays } from "date-fns";

interface PrioritySuggestionsProps {
  assignments: Assignment[];
}

export function PrioritySuggestions({ assignments }: PrioritySuggestionsProps) {
  const getSuggestions = (): PrioritySuggestion[] => {
    const suggestions: PrioritySuggestion[] = [];
    const now = new Date();

    // Find closest deadline
    const pendingAssignments = assignments.filter(
      (a) => a.status === "pending" || a.status === "overdue"
    );
    if (pendingAssignments.length > 0) {
      const closest = pendingAssignments.reduce((prev, curr) => {
        const prevDue = prev.dueDate.toDate();
        const currDue = curr.dueDate.toDate();
        return currDue < prevDue ? curr : prev;
      });

      const hoursUntilDue = differenceInHours(closest.dueDate.toDate(), now);
      if (hoursUntilDue > 0 && hoursUntilDue <= 48) {
        suggestions.push({
          type: "closest_deadline",
          assignment: closest,
          message: `${closest.title} is due in ${Math.round(hoursUntilDue)} hours`,
          priority: hoursUntilDue <= 12 ? "high" : "medium",
        });
      }
    }

    // Find long-pending assignments (more than 7 days old)
    const longPending = pendingAssignments.filter((a) => {
      const daysSinceCreated = differenceInDays(now, a.createdAt.toDate());
      return daysSinceCreated >= 7;
    });

    if (longPending.length > 0) {
      const oldest = longPending.reduce((prev, curr) => {
        return curr.createdAt.toMillis() < prev.createdAt.toMillis() ? curr : prev;
      });

      suggestions.push({
        type: "long_pending",
        assignment: oldest,
        message: `${oldest.title} has been pending for over a week`,
        priority: "medium",
      });
    }

    // Find heavy workload days (3+ assignments on same day)
    const assignmentsByDate = new Map<string, Assignment[]>();
    pendingAssignments.forEach((a) => {
      const dateKey = format(a.dueDate.toDate(), "yyyy-MM-dd");
      if (!assignmentsByDate.has(dateKey)) {
        assignmentsByDate.set(dateKey, []);
      }
      assignmentsByDate.get(dateKey)!.push(a);
    });

    const heavyDays = Array.from(assignmentsByDate.entries()).filter(
      ([_, assignments]) => assignments.length >= 3
    );

    if (heavyDays.length > 0) {
      const [dateKey, dayAssignments] = heavyDays[0];
      const date = new Date(dateKey);
      suggestions.push({
        type: "heavy_workload",
        message: `${dayAssignments.length} assignments due on ${format(date, "MMM d")}`,
        priority: "high",
      });
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "closest_deadline":
        return Clock;
      case "long_pending":
        return Calendar;
      case "heavy_workload":
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 border-red-500/50 text-red-400";
      case "medium":
        return "bg-orange-500/20 border-orange-500/50 text-orange-400";
      default:
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400";
    }
  };

  return (
    <Card variant="glass" className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertCircle className="w-5 h-5" />
          Priority Suggestions
        </CardTitle>
        <CardDescription>Important assignments that need your attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const Icon = getIcon(suggestion.type);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(
                  suggestion.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{suggestion.message}</p>
                    {suggestion.assignment && (
                      <p className="text-sm mt-1 text-[#D4D4D8]">
                        Course: {suggestion.assignment.courseName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium uppercase px-2 py-1 rounded bg-[#161616] text-white border border-[#222222]">
                    {suggestion.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
