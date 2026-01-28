"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Course } from "@/lib/types/assignments";
import { saveAssignment, saveCourse } from "@/lib/firebase/assignments";
import { Timestamp } from "firebase/firestore";
import { X } from "lucide-react";

interface ManualAssignmentFormProps {
  userId: string;
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualAssignmentForm({
  userId,
  courses,
  onClose,
  onSuccess,
}: ManualAssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [points, setPoints] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !courseName || !dueDate) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Validate userId
      if (!userId) {
        throw new Error("User ID is required. Please log in again.");
      }

      // Create or get course
      let finalCourseId = courseId;
      if (!finalCourseId) {
        // Create new course
        try {
          finalCourseId = await saveCourse({
            displayName: courseName,
            userId,
          });
        } catch (courseError: any) {
          console.error("Error creating course:", courseError);
          throw new Error(`Failed to create course: ${courseError.message || "Please check your permissions"}`);
        }
      }

      // Combine date and time
      const dueDateTime = new Date(`${dueDate}T${dueTime || "23:59"}`);
      
      // Validate date
      if (isNaN(dueDateTime.getTime())) {
        throw new Error("Invalid due date. Please check the date format.");
      }

      // Save assignment
      try {
        await saveAssignment({
          title,
          courseId: finalCourseId,
          courseName,
          description: description || undefined,
          dueDate: Timestamp.fromDate(dueDateTime),
          status: "pending",
          submitted: false,
          userId,
          isManual: true,
          points: points ? parseFloat(points) : undefined,
        });
      } catch (assignmentError: any) {
        console.error("Error saving assignment:", assignmentError);
        throw new Error(`Failed to save assignment: ${assignmentError.message || "Please check your permissions"}`);
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      alert(`Failed to create assignment: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setCourseId(course.id);
    setCourseName(course.displayName);
  };

  // Set default time to end of day if not provided
  const defaultTime = "23:59";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card variant="glass" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-[#222222]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-white">Create Assignment</CardTitle>
              <CardDescription className="text-[#D4D4D8] mt-1">Add a new assignment manually</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-[#D4D4D8] hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Assignment Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Math Homework Chapter 5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Course *
              </label>
              {courses.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {courses.map((course) => (
                    <Button
                      key={course.id}
                      type="button"
                      variant={courseId === course.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCourseSelect(course)}
                    >
                      {course.displayName}
                    </Button>
                  ))}
                </div>
              )}
              <Input
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  setCourseId(""); // Clear selected course if typing new name
                }}
                placeholder="Enter course name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Assignment instructions or notes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Due Date *
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Due Time
                </label>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  placeholder={defaultTime}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Points (optional)
              </label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="e.g., 100"
                min="0"
                step="0.1"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#222222]">
              <Button
                type="submit"
                disabled={submitting}
                variant="neon"
                className="flex-1"
              >
                {submitting ? "Creating..." : "Create Assignment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
