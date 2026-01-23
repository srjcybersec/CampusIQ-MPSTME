"use client";

import { useState, useEffect, useCallback } from "react";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SurvivalKitCard } from "@/components/resources/survival-kit-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Search,
  Filter,
  Loader2,
  BookOpen,
} from "lucide-react";
import { getSurvivalKits } from "@/lib/firebase/notes";
import { ExamSurvivalKit, Subject, Semester, ExamType } from "@/lib/types/notes";
import { useAuth } from "@/lib/auth/context";

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

function SurvivalKitsPageContent() {
  const { user } = useAuth();
  const [kits, setKits] = useState<ExamSurvivalKit[]>([]);
  const [filteredKits, setFilteredKits] = useState<ExamSurvivalKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [semester, setSemester] = useState<Semester | "">("");
  const [examType, setExamType] = useState<ExamType | "">("");

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedKits = await getSurvivalKits();
      setKits(fetchedKits);
    } catch (error) {
      console.error("Error loading kits:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  const applyFilters = useCallback(() => {
    let filtered = [...kits];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (kit) =>
          kit.name.toLowerCase().includes(query) ||
          kit.description?.toLowerCase().includes(query) ||
          kit.subject.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (subject) {
      filtered = filtered.filter((kit) => kit.subject === subject);
    }
    if (semester) {
      filtered = filtered.filter((kit) => kit.semester === semester);
    }
    if (examType) {
      filtered = filtered.filter((kit) => kit.examType === examType);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    setFilteredKits(filtered);
  }, [kits, searchQuery, subject, semester, examType]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchQuery("");
    setSubject("");
    setSemester("");
    setExamType("");
  };

  const hasActiveFilters = searchQuery || subject || semester || examType;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Exam Survival Kits
            </h1>
            <p className="text-neutral-600">
              Curated bundles of study materials for your exams
            </p>
          </div>

          {/* Filters */}
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
                    placeholder="Search kits by name or description..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kits Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredKits.length === 0 ? (
            <Card className="shadow-premium">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No survival kits found
                </h3>
                <p className="text-neutral-600 mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Create your first exam survival kit!"}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => window.location.href = "/resources/notes"}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Create Kit
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-neutral-600">
                Showing {filteredKits.length} kit{filteredKits.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredKits.map((kit) => (
                  <SurvivalKitCard
                    key={kit.id}
                    kit={kit}
                    onView={() => loadKits()}
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

export default function SurvivalKitsPage() {
  return (
    <ProtectedRoute>
      <SurvivalKitsPageContent />
    </ProtectedRoute>
  );
}
