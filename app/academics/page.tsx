"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExaminationPolicyChat } from "@/components/academics/examination-policy-chat";
import { AttendanceTracker } from "@/components/academics/attendance-tracker";
import { PYQSolver } from "@/components/academics/pyq-solver";
import { StudentResourceBookChat } from "@/components/academics/student-resource-book-chat";
import { ResultViewerAnalyzer } from "@/components/academics/result-viewer-analyzer";
import { Loader2, BookOpen, FileQuestion, HelpCircle } from "lucide-react";
import { Branch, Semester } from "@/lib/types/pyqs";

function AcademicsPageContent() {
  const [activeSection, setActiveSection] = useState<"examination" | "attendance" | "student-resource-book" | null>(null);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoadingPyqs, setIsLoadingPyqs] = useState(false);

  const loadPYQs = useCallback(async () => {
    setIsLoadingPyqs(true);
    try {
      // Load branches
      const branchesRes = await fetch("/api/pyqs?action=branches");
      const branchesData = await branchesRes.json();
      setBranches(branchesData.branches || []);

      // Load all PYQs
      const pyqsRes = await fetch("/api/pyqs");
      const pyqsData = await pyqsRes.json();
      if (pyqsData.success) {
        setPyqs(pyqsData.pyqs || []);
        
        // Extract unique subjects
        const uniqueSubjects = new Set<string>();
        pyqsData.pyqs?.forEach((pyq: any) => {
          if (pyq.subject) uniqueSubjects.add(pyq.subject);
        });
        setSubjects(Array.from(uniqueSubjects).sort());
      }
    } catch (error) {
      console.error("Error loading PYQs:", error);
    } finally {
      setIsLoadingPyqs(false);
    }
  }, []);

  useEffect(() => {
    loadPYQs();
  }, [loadPYQs]);


  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 relative z-20 max-w-full">
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            className="mb-8"
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#7C7CFF] via-[#38BDF8] to-[#7C7CFF] rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#7C7CFF] via-[#38BDF8] to-[#7C7CFF] rounded-2xl flex items-center justify-center glow-purple">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold gradient-text-purple">Academics</h1>
                <p className="text-lg text-[#D4D4D8] mt-1">AI-powered academic intelligence and decision support</p>
              </div>
            </div>
          </motion.div>

          {/* Policy Selection Buttons */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setActiveSection("examination")}
                variant={activeSection === "examination" ? "default" : "outline"}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Examination Policy
              </Button>
              <Button
                onClick={() => setActiveSection("attendance")}
                variant={activeSection === "attendance" ? "default" : "outline"}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Attendance Tracker
              </Button>
              <Button
                onClick={() => setActiveSection("student-resource-book")}
                variant={activeSection === "student-resource-book" ? "default" : "outline"}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Student Resource Book
              </Button>
            </div>
          </motion.div>

          {/* Examination Policy Chat */}
          {activeSection === "examination" && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ExaminationPolicyChat />
            </motion.div>
          )}

          {/* Attendance Tracker */}
          {activeSection === "attendance" && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AttendanceTracker />
            </motion.div>
          )}

          {/* Student Resource Book Chat */}
          {activeSection === "student-resource-book" && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <StudentResourceBookChat />
            </motion.div>
          )}

          {/* PYQ Solver Section */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isLoadingPyqs ? (
              <Card variant="glass">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-[#D4D4D8]">Loading PYQs...</p>
                </CardContent>
              </Card>
            ) : (
              <PYQSolver pyqs={pyqs} branches={branches} subjects={subjects} />
            )}
          </motion.div>

          {/* Result Viewer and Analyser */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ResultViewerAnalyzer />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function AcademicsPage() {
  return (
    <ProtectedRoute>
      <AcademicsPageContent />
    </ProtectedRoute>
  );
}
