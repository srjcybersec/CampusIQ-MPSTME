"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageSquare, Calculator, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { academicEngine } from "@/lib/gemini/client";

interface Subject {
  id: string;
  name: string;
  maxMissableHours: number; // Maximum hours that can be missed
  minAttendancePercent: number;
}

interface AttendanceResult {
  subject: string;
  totalHours: number;
  maxMissableHours: number;
  missedHours: number;
  attendedHours: number;
  attendancePercent: number;
  canMissMore: number;
  isEligible: boolean;
  status: "safe" | "warning" | "danger";
}

const ATTENDANCE_RULES = `Kindly note the Revised Attendance Rule for all students w.e.f. AY 2025-26

Attendance rules:

To ensure satisfactory attendance and engagement, 100% attendance in all subjects/courses is expected. However, exceptions can be made for valid medical reasons, personal reasons, and participation in extracurricular and co-curricular activities, placement activities, institutional work, and other approved activities. A relaxation of up to 20% absence may be granted in such cases.

Eligibility for Examinations:

Students who have maintained 80% or higher attendance in individual courses during a semester are eligible to appear for the respective semester-end examinations.

Attendance is considered from the date of commencement of each semester.

The decision taken by the University will be final and binding upon everyone

Attendance requirements are summarised hereunder:

100% Attendance in each subject is expected

Attendance% (In Individual Courses) | Remarks
80% and above in individual courses | Eligible to appear for Semester End Examinations.
Below 80% in the individual courses | Students will be required to take re-admission. Students can opt 1. re-admission in the same Semester OR 2. re-admission in the full year of the program in the subsequent academic year`;

const SUBJECTS: Subject[] = [
  { id: "1", name: "Digital forensics and incident response", maxMissableHours: 15, minAttendancePercent: 80 },
  { id: "2", name: "System administration", maxMissableHours: 9, minAttendancePercent: 80 },
  { id: "3", name: "Vulnerabilty assessment and penetration testing", maxMissableHours: 12, minAttendancePercent: 80 },
  { id: "4", name: "Reverse engineering and malware analysis", maxMissableHours: 12, minAttendancePercent: 80 },
  { id: "5", name: "Renewable energy sources", maxMissableHours: 9, minAttendancePercent: 80 },
  { id: "6", name: "Application security testing", maxMissableHours: 9, minAttendancePercent: 80 },
  { id: "7", name: "Placement training", maxMissableHours: 18, minAttendancePercent: 75 },
  { id: "8", name: "Interpersonal skills", maxMissableHours: 6, minAttendancePercent: 80 },
  { id: "9", name: "Introductory course on SAP", maxMissableHours: 9, minAttendancePercent: 80 },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function AttendanceTracker() {
  const [showRules, setShowRules] = useState(true);
  const [missedHours, setMissedHours] = useState<Record<string, string>>({});
  const [results, setResults] = useState<AttendanceResult[] | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const calculateAttendance = () => {
    const calculatedResults: AttendanceResult[] = SUBJECTS.map((subject) => {
      // Calculate total hours from max missable hours
      // If 80% required, can miss 20%, so: maxMissable = total * 0.20 => total = maxMissable / 0.20
      // If 75% required, can miss 25%, so: total = maxMissable / 0.25
      const missablePercent = (100 - subject.minAttendancePercent) / 100;
      const totalHours = subject.maxMissableHours / missablePercent;
      
      const missed = parseFloat(missedHours[subject.id] || "0") || 0;
      const attended = Math.max(0, totalHours - missed); // Can't have negative attended
      const attendancePercent = (attended / totalHours) * 100;
      const canMissMore = Math.max(0, subject.maxMissableHours - missed);
      const isEligible = missed <= subject.maxMissableHours;

      let status: "safe" | "warning" | "danger" = "safe";
      if (!isEligible) {
        status = "danger";
      } else if (missed > subject.maxMissableHours * 0.8) {
        // Warning if they've used more than 80% of their missable hours
        status = "warning";
      }

      return {
        subject: subject.name,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        maxMissableHours: subject.maxMissableHours,
        missedHours: missed,
        attendedHours: Math.round(attended * 10) / 10,
        attendancePercent: Math.round(attendancePercent * 100) / 100,
        canMissMore: Math.round(canMissMore * 10) / 10, // Round to 1 decimal
        isEligible,
        status,
      };
    });

    setResults(calculatedResults);
    setShowRules(false);

    // Generate detailed AI summary
    generateDetailedSummary(calculatedResults);
  };

  const generateDetailedSummary = async (results: AttendanceResult[]) => {
    setIsChatLoading(true);
    setChatMessages([
      {
        id: "1",
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      const summary = await academicEngine.generateAttendanceSummary(results, SUBJECTS);
      setChatMessages([
        {
          id: "1",
          role: "assistant",
          content: summary,
        },
      ]);
    } catch (error: any) {
      setChatMessages([
        {
          id: "1",
          role: "assistant",
          content: `I've calculated your attendance. ${generateSummary(results)}\n\nYou can ask me questions about your attendance, eligibility, or what you need to do to maintain the required percentage.`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateSummary = (results: AttendanceResult[]): string => {
    const eligible = results.filter((r) => r.isEligible).length;
    const ineligible = results.filter((r) => !r.isEligible).length;
    const warning = results.filter((r) => r.status === "warning").length;

    if (ineligible > 0) {
      return `You have ${ineligible} subject(s) below the required attendance threshold. You need to take action to maintain eligibility.`;
    } else if (warning > 0) {
      return `You're eligible for all subjects, but ${warning} subject(s) are close to the threshold. Be careful with future absences.`;
    } else {
      return `Great! You're eligible for all subjects. You have some buffer for future absences.`;
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading || !results) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    const loadingMessageId = (Date.now() + 1).toString();
    setChatMessages((prev) => [
      ...prev,
      {
        id: loadingMessageId,
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      const response = await academicEngine.answerAttendanceQuestion(
        chatInput.trim(),
        results as any,
        SUBJECTS as any
      );

      setChatMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingMessageId)
          .concat({
            id: Date.now().toString(),
            role: "assistant",
            content: response,
          })
      );
    } catch (error: any) {
      setChatMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingMessageId)
          .concat({
            id: Date.now().toString(),
            role: "assistant",
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          })
      );
    } finally {
      setIsChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^#{1,6}\s+(.*)$/gm, '$1')
      .replace(/^\*\s+(.*)$/gm, '• $1')
      .replace(/^-\s+(.*)$/gm, '• $1')
      .replace(/^\d+\.\s+(.*)$/gm, '$1')
      .trim();
  };

  return (
    <div className="space-y-6">
      {/* Attendance Rules */}
      {showRules && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="w-5 h-5 text-purple-400" />
              Attendance Rules
            </CardTitle>
            <CardDescription className="text-[#D4D4D8]">
              MPSTME College Attendance Policy (AY 2025-26)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-white whitespace-pre-wrap leading-relaxed mb-6">
              {ATTENDANCE_RULES}
            </div>
            <Button
              onClick={() => setShowRules(false)}
              variant="neon"
              data-cursor-hover
            >
              Continue to Attendance Calculator
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attendance Calculator Form */}
      {!showRules && !results && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calculator className="w-5 h-5 text-purple-400" />
              Attendance Calculator
            </CardTitle>
            <CardDescription className="text-[#D4D4D8]">
              Enter the number of hours you have missed for each subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto custom-scrollbar">
              {SUBJECTS.map((subject) => (
                <div
                  key={subject.id}
                  className="p-4 bg-[#161616] border border-[#222222] rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor={`subject-${subject.id}`}
                      className="font-medium text-white"
                    >
                      {subject.name}
                    </label>
                    <span className="text-sm text-[#D4D4D8]">
                      Can Miss: {subject.maxMissableHours} hrs | Min: {subject.minAttendancePercent}%
                    </span>
                  </div>
                  <Input
                    id={`subject-${subject.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={missedHours[subject.id] || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow whole numbers (integers)
                      if (value === "" || /^\d+$/.test(value)) {
                        setMissedHours({
                          ...missedHours,
                          [subject.id]: value,
                        });
                      }
                    }}
                    onWheel={(e) => {
                      // Prevent scroll from changing the input value
                      e.currentTarget.blur();
                    }}
                    onKeyDown={(e) => {
                      // Prevent decimal point and negative sign
                      if (e.key === "." || e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    placeholder={`Enter missed hours`}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={calculateAttendance}
              variant="neon"
              size="lg"
              className="w-full"
              data-cursor-hover
            >
              Calculate Attendance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calculator className="w-5 h-5 text-purple-400" />
              Your Attendance Status
            </CardTitle>
            <CardDescription className="text-[#D4D4D8]">
              Detailed breakdown of your attendance across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto custom-scrollbar">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === "danger"
                      ? "bg-red-500/20 border-red-500/30"
                      : result.status === "warning"
                      ? "bg-amber-500/20 border-amber-500/30"
                      : "bg-green-500/20 border-green-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{result.subject}</h3>
                    <div className="flex items-center gap-2">
                      {result.isEligible ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span
                        className={`font-bold ${
                          result.status === "danger"
                            ? "text-red-400"
                            : result.status === "warning"
                            ? "text-amber-400"
                            : "text-green-400"
                        }`}
                      >
                        {result.attendancePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-[#D4D4D8]">Total Hours:</span>{" "}
                      <span className="font-medium text-white">{result.totalHours}</span>
                    </div>
                    <div>
                      <span className="text-[#D4D4D8]">Missed:</span>{" "}
                      <span className="font-medium text-red-400">{result.missedHours} / {result.maxMissableHours}</span>
                    </div>
                    <div>
                      <span className="text-[#D4D4D8]">Attended:</span>{" "}
                      <span className="font-medium text-green-400">{result.attendedHours}</span>
                    </div>
                    <div>
                      <span className="text-[#D4D4D8]">Can Miss More:</span>{" "}
                      <span className="font-medium text-blue-400">{result.canMissMore} hrs</span>
                    </div>
                  </div>
                  {!result.isEligible && (
                    <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
                      ⚠️ Exceeded maximum missable hours ({result.maxMissableHours} hrs). Re-admission may be required.
                    </div>
                  )}
                  {result.isEligible && result.canMissMore === 0 && (
                    <div className="mt-2 p-2 bg-amber-500/20 border border-amber-500/30 rounded text-sm text-amber-300">
                      ⚠️ You&apos;ve reached the maximum missable hours. No more absences allowed.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {results && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Ask About Your Attendance
            </CardTitle>
            <CardDescription className="text-[#D4D4D8]">
              Get insights and advice about your attendance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-[#161616] border border-[#222222] rounded-lg custom-scrollbar">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-purple-500/20 border border-purple-500/30 text-white"
                        : "bg-[#161616] border border-[#222222] text-[#D4D4D8]"
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap break-words">{cleanMarkdown(message.content)}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your attendance, eligibility, recommendations..."
                disabled={isChatLoading}
                className="flex-1"
              />
              <Button
                onClick={handleChatSend}
                disabled={isChatLoading || !chatInput.trim()}
                variant="neon"
                data-cursor-hover
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
