"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Note } from "@/lib/types/notes";
import { createSurvivalKit, getSurvivalKits } from "@/lib/firebase/notes";
import { useAuth } from "@/lib/auth/context";
import {
  Package,
  Plus,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Subject,
  Semester,
  ExamType,
} from "@/lib/types/notes";

const SUBJECTS: Subject[] = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Operating Systems",
  "Networks",
  "Software Engineering",
  "Web Development",
  "Machine Learning",
  "Other",
];

const SEMESTERS: Semester[] = ["1", "2", "3", "4", "5", "6", "7", "8"];

const EXAM_TYPES: ExamType[] = [
  "Midterm",
  "Final",
  "Quiz",
  "Assignment",
  "Lab",
  "Project",
  "Other",
];

interface SurvivalKitBuilderProps {
  availableNotes: Note[];
  onKitCreated?: () => void;
}

export function SurvivalKitBuilder({
  availableNotes,
  onKitCreated,
}: SurvivalKitBuilderProps) {
  const { user } = useAuth();
  const [kitName, setKitName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<Subject>("Computer Science");
  const [semester, setSemester] = useState<Semester>("1");
  const [examType, setExamType] = useState<ExamType>("Final");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleToggleNote = (noteId: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to create survival kits");
      return;
    }

    if (!kitName.trim()) {
      setError("Please enter a kit name");
      return;
    }

    if (selectedNoteIds.length === 0) {
      setError("Please select at least one note");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await createSurvivalKit({
        name: kitName,
        description: description || undefined,
        creatorId: user.uid,
        noteIds: selectedNoteIds,
        subject,
        semester,
        examType,
      });

      setSuccess(true);
      setKitName("");
      setDescription("");
      setSelectedNoteIds([]);
      setTimeout(() => {
        setSuccess(false);
        if (onKitCreated) onKitCreated();
      }, 2000);
    } catch (err: any) {
      console.error("Error creating survival kit:", err);
      setError(err.message || "Failed to create survival kit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNotes = availableNotes.filter(
    (note) =>
      note.subject === subject &&
      note.semester === semester &&
      note.examType === examType
  );

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Create Exam Survival Kit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kit Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kit Name *
            </label>
            <input
              type="text"
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Data Structures Final Exam Kit"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Brief description of this exam kit..."
              disabled={isSubmitting}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value as Subject);
                  setSelectedNoteIds([]); // Clear selection when filter changes
                }}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value as Semester);
                  setSelectedNoteIds([]);
                }}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Exam Type *
              </label>
              <select
                value={examType}
                onChange={(e) => {
                  setExamType(e.target.value as ExamType);
                  setSelectedNoteIds([]);
                }}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                {EXAM_TYPES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Notes ({selectedNoteIds.length} selected) *
            </label>
            <div className="max-h-60 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-2">
              {filteredNotes.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No notes available for the selected filters
                </p>
              ) : (
                filteredNotes.map((note) => (
                  <label
                    key={note.id}
                    className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNoteIds.includes(note.id)}
                      onChange={() => handleToggleNote(note.id)}
                      className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {note.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {note.difficulty} • {note.averageRating.toFixed(1)}⭐
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Survival kit created successfully!</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || selectedNoteIds.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Survival Kit
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
