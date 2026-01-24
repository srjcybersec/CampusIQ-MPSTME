"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Assignment, Course, AssignmentStatus } from "@/lib/types/assignments";
import { updateAssignmentStatus, deleteAssignment } from "@/lib/firebase/assignments";
import { CheckCircle2, Clock, AlertCircle, XCircle, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface AssignmentCardProps {
  assignment: Assignment;
  courses: Course[];
  onUpdate: () => void;
}

export function AssignmentCard({
  assignment,
  courses,
  onUpdate,
}: AssignmentCardProps) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getStatusBadge = (status: AssignmentStatus) => {
    const badges = {
      pending: {
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        label: "Pending",
      },
      submitted: {
        icon: CheckCircle2,
        color: "bg-green-100 text-green-800 border-green-300",
        label: "Submitted",
      },
      overdue: {
        icon: AlertCircle,
        color: "bg-red-100 text-red-800 border-red-300",
        label: "Overdue",
      },
      late: {
        icon: XCircle,
        color: "bg-orange-100 text-orange-800 border-orange-300",
        label: "Late",
      },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const handleMarkSubmitted = async () => {
    setUpdating(true);
    try {
      await updateAssignmentStatus(assignment.id, "submitted", new Date());
      onUpdate();
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("Failed to update assignment status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAssignment(assignment.id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    } finally {
      setDeleting(false);
    }
  };

  const dueDate = assignment.dueDate.toDate();
  const isPastDue = dueDate < new Date() && assignment.status !== "submitted";
  const hoursUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);

  return (
    <Card className={`${isPastDue ? "border-red-300 bg-red-50/50" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-neutral-900">
                {assignment.title}
              </h3>
              {getStatusBadge(assignment.status)}
              {assignment.isManual && (
                <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                  Manual
                </span>
              )}
            </div>

            <p className="text-sm text-neutral-600 mb-3">
              <span className="font-medium">{assignment.courseName}</span>
              {assignment.points && (
                <span className="ml-2">• {assignment.points} points</span>
              )}
            </p>

            {assignment.description && (
              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                {assignment.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  Due: {format(dueDate, "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              {hoursUntilDue > 0 && hoursUntilDue <= 48 && (
                <span className="text-orange-600 font-medium">
                  {Math.round(hoursUntilDue)}h remaining
                </span>
              )}
              {assignment.submissionDate && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Submitted: {format(assignment.submissionDate.toDate(), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {assignment.status !== "submitted" && assignment.status !== "late" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkSubmitted}
                disabled={updating}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Submitted
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
