"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssignmentList } from "./assignment-list";
import { AssignmentHealthScore } from "./assignment-health-score";
import { WorkloadOverview } from "./workload-overview";
import { PrioritySuggestions } from "./priority-suggestions";
import { ManualAssignmentForm } from "./manual-assignment-form";
import { ReminderPreferencesComponent } from "./reminder-preferences";
import { getUserAssignments, getUserCourses } from "@/lib/firebase/assignments";
import { Assignment, AssignmentFilter, AssignmentStatus, Course } from "@/lib/types/assignments";
import { Plus, Search, Filter, X } from "lucide-react";

interface AssignmentDashboardProps {
  userId: string;
}

export function AssignmentDashboard({ userId }: AssignmentDashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showReminderPreferences, setShowReminderPreferences] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const filter: AssignmentFilter = {};
      if (statusFilter.length > 0) {
        filter.status = statusFilter;
      }
      if (courseFilter) {
        filter.courseId = courseFilter;
      }
      if (searchQuery) {
        filter.search = searchQuery;
      }

      const [assignmentsData, coursesData] = await Promise.all([
        getUserAssignments(userId, filter),
        getUserCourses(userId),
      ]);

      console.log("Loaded assignments:", assignmentsData.length, assignmentsData);
      console.log("Loaded courses:", coursesData.length, coursesData);

      // Sort by nearest deadline (already sorted in getUserAssignments, but ensure it's sorted)
      assignmentsData.sort((a, b) => {
        return a.dueDate.toMillis() - b.dueDate.toMillis();
      });

      setAssignments(assignmentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter, courseFilter, searchQuery]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleStatusFilterToggle = (status: AssignmentStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setCourseFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter.length > 0 || courseFilter || searchQuery;

  return (
    <div className="space-y-6 relative z-10">
      {/* Health Score and Workload Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AssignmentHealthScore userId={userId} />
        <WorkloadOverview assignments={assignments} />
      </div>

      {/* Reminder Preferences */}
      {showReminderPreferences && (
        <ReminderPreferencesComponent userId={userId} />
      )}

      {/* Priority Suggestions */}
      <PrioritySuggestions assignments={assignments} />

      {/* Filters and Search */}
      <Card variant="glass" className="relative z-10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Assignments</CardTitle>
              <CardDescription>
                {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReminderPreferences(!showReminderPreferences)}
              >
                Reminder Settings
              </Button>
              <Button 
                onClick={() => setShowManualForm(true)}
                style={{ color: '#ffffff' }}
              >
                <Plus className="w-4 h-4 mr-2" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff', display: 'inline-block' }}>Create Assignment</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#D4D4D8]" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-[#D4D4D8] self-center">Status:</span>
              {(["pending", "submitted", "overdue", "late"] as AssignmentStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter.includes(status) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilterToggle(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>

            {courses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-[#D4D4D8] self-center">Course:</span>
                <Button
                  variant={!courseFilter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCourseFilter("")}
                >
                  All Courses
                </Button>
                {courses.map((course) => (
                  <Button
                    key={course.id}
                    variant={courseFilter === course.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCourseFilter(course.id)}
                  >
                    {course.displayName}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Assignment List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-[#D4D4D8]">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#D4D4D8] mb-4">
                {hasActiveFilters
                  ? "No assignments match your filters."
                  : "No assignments found. Sync from Microsoft Teams or create one manually."}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setShowManualForm(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              )}
            </div>
          ) : (
            <AssignmentList
              assignments={assignments}
              courses={courses}
              onUpdate={loadAssignments}
            />
          )}
        </CardContent>
      </Card>

      {/* Manual Assignment Form Modal */}
      {showManualForm && (
        <ManualAssignmentForm
          userId={userId}
          courses={courses}
          onClose={() => {
            setShowManualForm(false);
            loadAssignments();
          }}
          onSuccess={() => {
            setShowManualForm(false);
            loadAssignments();
          }}
        />
      )}
    </div>
  );
}
