"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { ExaminationPolicyChat } from "@/components/academics/examination-policy-chat";
import { AttendanceTracker } from "@/components/academics/attendance-tracker";
import { StudentResourceBookChat } from "@/components/academics/student-resource-book-chat";
import { ResultViewerAnalyzer } from "@/components/academics/result-viewer-analyzer";
import { Loader2, BookOpen } from "lucide-react";

function AcademicsPageContent() {
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<"examination" | "attendance" | "student-resource-book" | null>(null);

  // Deep-link support for SNEHA voice commands (?section=attendance|results|...)
  useEffect(() => {
    const section = searchParams.get("section");
    if (!section) return;

    if (section === "attendance") {
      setActiveSection("attendance");
    } else if (section === "examination-policy" || section === "examination" || section === "policy") {
      setActiveSection("examination");
    } else if (section === "student-resource-book" || section === "srb") {
      setActiveSection("student-resource-book");
    }

    if (section === "results" && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [searchParams]);

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

          <motion.div
            ref={resultsRef}
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        }
      >
        <AcademicsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
