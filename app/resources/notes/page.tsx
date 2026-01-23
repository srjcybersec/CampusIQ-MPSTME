"use client";

import { useState, useEffect, useCallback } from "react";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NoteUploadForm } from "@/components/resources/note-upload-form";
import { NoteCard } from "@/components/resources/note-card";
import { SurvivalKitBuilder } from "@/components/resources/survival-kit-builder";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Filter,
  Upload,
  BookOpen,
  X,
  RefreshCw,
  Loader2,
  Package,
} from "lucide-react";
import { getNotes } from "@/lib/firebase/notes";
import { Note, NoteFilter, Subject, Semester, Difficulty, ExamType } from "@/lib/types/notes";
import { formatDistanceToNow } from "date-fns";

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

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const EXAM_TYPES: ExamType[] = [
  "Midterm",
  "Final",
  "Quiz",
  "Assignment",
  "Lab",
  "Project",
  "Other",
];

function NotesPageContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showKitBuilder, setShowKitBuilder] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [semester, setSemester] = useState<Semester | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [examType, setExamType] = useState<ExamType | "">("");
  const [professor, setProfessor] = useState("");
  const [hasTopperBadge, setHasTopperBadge] = useState<boolean | undefined>(
    undefined
  );
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "rating" | "downloads">(
    "newest"
  );

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: NoteFilter = {};
      if (subject) filters.subject = subject;
      if (semester) filters.semester = semester;
      if (difficulty) filters.difficulty = difficulty;
      if (examType) filters.examType = examType;
      if (professor) filters.professor = professor;
      if (hasTopperBadge !== undefined) filters.hasTopperBadge = hasTopperBadge;
      if (minRating !== undefined) filters.minRating = minRating;
      if (searchQuery) filters.searchQuery = searchQuery;

      const fetchedNotes = await getNotes(filters, 100);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const applyFilters = useCallback(() => {
    let filtered = [...notes];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.description?.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          note.subject.toLowerCase().includes(query)
      );
    }

    // Apply client-side filters (already applied in getNotes, but double-check)
    if (subject) {
      filtered = filtered.filter((note) => note.subject === subject);
    }
    if (semester) {
      filtered = filtered.filter((note) => note.semester === semester);
    }
    if (difficulty) {
      filtered = filtered.filter((note) => note.difficulty === difficulty);
    }
    if (examType) {
      filtered = filtered.filter((note) => note.examType === examType);
    }
    if (professor) {
      filtered = filtered.filter(
        (note) =>
          note.professor?.toLowerCase().includes(professor.toLowerCase())
      );
    }
    if (hasTopperBadge !== undefined) {
      filtered = filtered.filter(
        (note) => note.hasTopperBadge === hasTopperBadge
      );
    }
    if (minRating !== undefined) {
      filtered = filtered.filter((note) => note.averageRating >= minRating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.averageRating - a.averageRating;
        case "downloads":
          return b.downloads - a.downloads;
        case "newest":
        default:
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchQuery, subject, semester, difficulty, examType, professor, hasTopperBadge, minRating, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchQuery("");
    setSubject("");
    setSemester("");
    setDifficulty("");
    setExamType("");
    setProfessor("");
    setHasTopperBadge(undefined);
    setMinRating(undefined);
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery ||
    subject ||
    semester ||
    difficulty ||
    examType ||
    professor ||
    hasTopperBadge !== undefined ||
    minRating !== undefined;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Notes Uploader
              </h1>
              <p className="text-neutral-600">
                Upload, browse, and rate study materials
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = "/resources/notes/kits"}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                View Kits
              </button>
              <button
                onClick={() => setShowKitBuilder(!showKitBuilder)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {showKitBuilder ? "Hide Kit Builder" : "Create Kit"}
              </button>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {showUploadForm ? "Hide Upload" : "Upload Note"}
              </button>
            </div>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <div className="mb-8">
              <NoteUploadForm
                onSuccess={() => {
                  setShowUploadForm(false);
                  loadNotes();
                }}
              />
            </div>
          )}

          {/* Survival Kit Builder */}
          {showKitBuilder && (
            <div className="mb-8">
              <SurvivalKitBuilder
                availableNotes={notes}
                onKitCreated={() => {
                  setShowKitBuilder(false);
                  loadNotes();
                }}
              />
            </div>
          )}

          {/* Filters and Search */}
          <Card className="mb-6 shadow-premium">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes by title, description, tags, or subject..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter Row 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject | "")}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Subjects</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={semester}
                    onChange={(e) =>
                      setSemester(e.target.value as Semester | "")
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Semesters</option>
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as Difficulty | "")
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Difficulties</option>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={examType}
                    onChange={(e) =>
                      setExamType(e.target.value as ExamType | "")
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Exam Types</option>
                    {EXAM_TYPES.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Professor name..."
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />

                  <select
                    value={hasTopperBadge === undefined ? "" : hasTopperBadge ? "true" : "false"}
                    onChange={(e) =>
                      setHasTopperBadge(
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true"
                      )
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Notes</option>
                    <option value="true">Topper Badge Only</option>
                    <option value="false">No Badge</option>
                  </select>

                  <select
                    value={minRating === undefined ? "" : minRating.toString()}
                    onChange={(e) =>
                      setMinRating(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Star</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "newest" | "rating" | "downloads"
                      )
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="downloads">Most Downloaded</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                    <button
                      onClick={loadNotes}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <Card className="shadow-premium">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No notes found
                </h3>
                <p className="text-neutral-600 mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query"
                    : "Be the first to upload study materials!"}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => setShowUploadForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Upload Note
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-neutral-600">
                Showing {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onView={() => setSelectedNote(note)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesPageContent />
    </ProtectedRoute>
  );
}
