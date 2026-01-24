"use client";

import { Assignment, Course } from "@/lib/types/assignments";
import { AssignmentCard } from "./assignment-card";

interface AssignmentListProps {
  assignments: Assignment[];
  courses: Course[];
  onUpdate: () => void;
}

export function AssignmentList({
  assignments,
  courses,
  onUpdate,
}: AssignmentListProps) {
  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          courses={courses}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
