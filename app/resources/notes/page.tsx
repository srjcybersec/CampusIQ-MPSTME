"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NoteUploadForm } from "@/components/resources/note-upload-form";
import { NoteCard } from "@/components/resources/note-card";
import { SurvivalKitBuilder } from "@/components/resources/survival-kit-builder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  }, [subject, semester, difficulty, examType, professor, hasTopperBadge, minRating, searchQuery]);

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
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Notes Uploader
              </h1>
              <p className="text-lg text-[#D4D4D8]">
                Upload, browse, and rate study materials
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => window.location.href = "/resources/notes/kits"}
                variant="neon"
                data-cursor-hover
              >
                <Package className="w-4 h-4 mr-2" />
                View Kits
              </Button>
              <Button
                onClick={() => setShowKitBuilder(!showKitBuilder)}
                variant="neon"
                data-cursor-hover
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {showKitBuilder ? "Hide Kit Builder" : "Create Kit"}
              </Button>
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                variant="default"
                data-cursor-hover
              >
                <Upload className="w-4 h-4 mr-2" />
                {showUploadForm ? "Hide Upload" : "Upload Note"}
              </Button>
            </div>
          </motion.div>

          {/* Upload Form */}
          {showUploadForm && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <NoteUploadForm
                onSuccess={() => {
                  setShowUploadForm(false);
                  loadNotes();
                }}
              />
            </motion.div>
          )}

          {/* Survival Kit Builder */}
          {showKitBuilder && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SurvivalKitBuilder
                availableNotes={notes}
                onKitCreated={() => {
                  setShowKitBuilder(false);
                  loadNotes();
                }}
              />
            </motion.div>
          )}

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card variant="glass" className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D4D4D8] w-5 h-5 z-10" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notes by title, description, tags, or subject..."
                      className="w-full pl-10"
                    />
                  </div>

                {/* Filter Row 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject | "")}
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
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
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
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
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
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
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
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
                  <Input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Professor name..."
                    className="text-sm"
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
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
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
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
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
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="downloads">Most Downloaded</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      data-cursor-hover
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadNotes}
                      data-cursor-hover
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Notes Grid */}
          {isLoading ? (
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </motion.div>
            </motion.div>
          ) : filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card variant="glass">
                <CardContent className="p-12 text-center">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple mx-auto mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <BookOpen className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No notes found
                  </h3>
                  <p className="text-[#D4D4D8] mb-4">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search query"
                      : "Be the first to upload study materials!"}
                  </p>
                  {!hasActiveFilters && (
                    <Button
                      onClick={() => setShowUploadForm(true)}
                      variant="default"
                      data-cursor-hover
                    >
                      Upload Note
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="mb-4 text-sm text-[#D4D4D8]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                Showing {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
              </motion.div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="h-full w-full flex"
                  >
                    <NoteCard
                      note={note}
                      onView={() => setSelectedNote(note)}
                    />
                  </motion.div>
                ))}
              </motion.div>
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
