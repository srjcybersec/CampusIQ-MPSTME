"use client";

import { useState } from "react";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExaminationPolicyChat } from "@/components/academics/examination-policy-chat";
import { AttendanceTracker } from "@/components/academics/attendance-tracker";
import { academicEngine } from "@/lib/gemini/client";
import { Loader2, BookOpen, FileQuestion, HelpCircle, Sparkles } from "lucide-react";

function AcademicsPageContent() {
  const [activeSection, setActiveSection] = useState<"examination" | "attendance" | "passing" | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<"Attendance" | "Passing" | null>(null);

  const handleExplainRule = async (ruleType: "Attendance" | "Passing") => {
    setSelectedRule(ruleType);
    setLoading(true);
    setExplanation("");

    try {
      const result = await academicEngine.explainRule(ruleType);
      setExplanation(result);
    } catch (error: any) {
      console.error("Error:", error);
      setExplanation(`Error: ${error.message || "Sorry, I'm having trouble explaining that right now. Please check your Gemini API key in the .env file and try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-glow transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Academics</h1>
                <p className="text-lg text-neutral-600 mt-1">AI-powered academic intelligence and decision support</p>
              </div>
            </div>
          </div>

          {/* Policy Selection Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setActiveSection("examination")}
                variant={activeSection === "examination" ? "default" : "outline"}
                className={activeSection === "examination" ? "gradient-primary text-white" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Examination Policy
              </Button>
              <Button
                onClick={() => setActiveSection("attendance")}
                variant={activeSection === "attendance" ? "default" : "outline"}
                className={activeSection === "attendance" ? "gradient-primary text-white" : "border-purple-300 text-purple-700 hover:bg-purple-50"}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Attendance Tracker
              </Button>
              <Button
                onClick={() => {
                  setActiveSection("passing");
                  handleExplainRule("Passing");
                }}
                variant={activeSection === "passing" ? "default" : "outline"}
                className={activeSection === "passing" ? "gradient-primary text-white" : "border-green-300 text-green-700 hover:bg-green-50"}
                size="lg"
                disabled={loading}
              >
                {loading && selectedRule === "Passing" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-2" />
                )}
                Passing Criteria
              </Button>
            </div>
          </div>

          {/* Examination Policy Chat */}
          {activeSection === "examination" && (
            <div className="mb-6">
              <ExaminationPolicyChat />
            </div>
          )}

          {/* Attendance Tracker */}
          {activeSection === "attendance" && (
            <div className="mb-6">
              <AttendanceTracker />
            </div>
          )}

          {/* Passing Criteria Explanation */}
          {activeSection === "passing" && explanation && (
            <Card className="mb-6 shadow-premium border-2 border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Explanation (Passing Criteria)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-neutral-800 whitespace-pre-wrap leading-relaxed">{explanation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PYQ Analyzer Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5" />
                PYQ Analyzer
              </CardTitle>
              <CardDescription>
                Analyze previous year questions for patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Upload or paste previous year questions to get insights on topics, repetition trends, and difficulty patterns.
              </p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Academic Decision Explainer */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Decision Explainer</CardTitle>
              <CardDescription>
                Understand academic decisions with contextual reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Get explanations for academic decisions, grade calculations, and policy applications.
              </p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
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
