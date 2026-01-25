"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PYQList } from "@/components/resources/pyq-list";
import { Search, FileText, Filter, X } from "lucide-react";
import { Branch, Semester } from "@/lib/types/pyqs";

const BRANCHES: Branch[] = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Chemical",
  "Aerospace",
  "Biotechnology",
  "Information Technology",
  "Automobile",
  "Artificial Intelligence",
  "Computer",
  "Csbs",
  "Cse Cyber Security",
  "Data Science",
  "Extc",
  "Other",
];

const SEMESTERS: Semester[] = ["5", "6"];

function PYQsPageContent() {
  const [pyqs, setPYQs] = useState<any[]>([]);
  const [filteredPYQs, setFilteredPYQs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | "">("");
  const [selectedSemester, setSelectedSemester] = useState<Semester | "">("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const loadPYQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branch", selectedBranch);
      if (selectedSemester) params.append("semester", selectedSemester);
      if (selectedSubject) params.append("subject", selectedSubject);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/pyqs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPYQs(data.pyqs);
        setFilteredPYQs(data.pyqs);
      }
    } catch (error) {
      console.error("Error loading PYQs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, selectedSemester, selectedSubject, searchQuery]);

  const loadSubjects = useCallback(async () => {
    if (!selectedBranch && !selectedSemester) {
      setAvailableSubjects([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branch", selectedBranch);
      if (selectedSemester) params.append("semester", selectedSemester);
      params.append("action", "subjects");

      const response = await fetch(`/api/pyqs?${params.toString()}`);
      const data = await response.json();

      if (data.subjects) {
        setAvailableSubjects(data.subjects);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  }, [selectedBranch, selectedSemester]);

  useEffect(() => {
    loadPYQs();
  }, [loadPYQs]);

  useEffect(() => {
    loadSubjects();
    setSelectedSubject(""); // Reset subject when branch/semester changes
  }, [loadSubjects, selectedBranch, selectedSemester]);

  const clearFilters = () => {
    setSelectedBranch("");
    setSelectedSemester("");
    setSelectedSubject("");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedBranch || selectedSemester || selectedSubject || searchQuery;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      <MainNav />

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.1, rotate: 6 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#22D3EE] via-[#A855F7] to-[#22D3EE] rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#22D3EE] via-[#A855F7] to-[#22D3EE] rounded-2xl flex items-center justify-center glow-blue">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-white">Previous Year Questions</h1>
                <p className="text-lg text-[#D4D4D8] mt-1">Browse and download PYQs by branch, semester, and subject</p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card variant="glass" className="mb-6 relative z-10">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D4D4D8] w-5 h-5 z-10" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by subject or file name..."
                      className="w-full pl-10"
                    />
                  </div>

                  {/* Filter Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value as Branch | "")}
                      className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
                    >
                      <option value="">All Branches</option>
                      {BRANCHES.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value as Semester | "")}
                      className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
                    >
                      <option value="">All Semesters</option>
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      disabled={!selectedBranch && !selectedSemester}
                      className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">All Subjects</option>
                      {availableSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>

                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm hover:bg-[#161616] transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* PYQ List */}
          <PYQList pyqs={filteredPYQs} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

export default function PYQsPage() {
  return (
    <ProtectedRoute>
      <PYQsPageContent />
    </ProtectedRoute>
  );
}
