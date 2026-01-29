"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, FileQuestion, AlertCircle, BookOpen, X } from "lucide-react";
import { PYQDocument, Branch, Semester } from "@/lib/types/pyqs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

interface PYQSolverProps {
  pyqs: PYQDocument[];
  branches: Branch[];
  subjects: string[];
}

export function PYQSolver({ pyqs, branches, subjects }: PYQSolverProps) {
  const [selectedPyq, setSelectedPyq] = useState<PYQDocument | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState<Branch | "">("");
  const [filterSemester, setFilterSemester] = useState<Semester | "">("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean markdown formatting from AI responses
  const cleanMarkdown = (text: string): string => {
    return text
      // Remove bold markdown (**text** or __text__)
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      // Remove italic markdown (*text* or _text_)
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`(.*?)`/g, "$1")
      // Remove headers
      .replace(/^#{1,6}\s+(.*)$/gm, "$1")
      // Remove horizontal rules
      .replace(/^---$/gm, "")
      .replace(/^___$/gm, "")
      // Clean up multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleSelectPyq = async (pyq: PYQDocument) => {
    setSelectedPyq(pyq);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `I've loaded the PYQ paper: **${pyq.fileName}**\n\nBranch: ${pyq.branch}\nSemester: ${pyq.semester}\nSubject: ${pyq.subject}\n\nYou can view the paper on the left. Type any question from the paper in the chat below, and I'll help you solve it!`,
      },
    ]);
    setError(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedPyq) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Add loading message
    const loadingMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMessageId,
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      // Build conversation history
      const conversationHistory = messages
        .filter((msg) => !msg.isLoading)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch("/api/pyqs/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pyqId: selectedPyq.id,
          question: input.trim(),
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

      // Remove loading message and add response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingMessageId)
          .concat({
            id: Date.now().toString(),
            role: "assistant",
            content: data.answer,
          })
      );
    } catch (error: any) {
      // Remove loading message and add error
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingMessageId)
          .concat({
            id: Date.now().toString(),
            role: "assistant",
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          })
      );
      setError(error.message);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: selectedPyq
          ? `I've loaded the PYQ paper: **${selectedPyq.fileName}**\n\nBranch: ${selectedPyq.branch}\nSemester: ${selectedPyq.semester}\nSubject: ${selectedPyq.subject}\n\nYou can view the paper on the left. Type any question from the paper in the chat below, and I'll help you solve it!`
          : "Please select a PYQ paper to start solving.",
      },
    ]);
  };

  // Filter PYQs based on selected branch/semester/subject
  const filteredPyqs = pyqs.filter((pyq) => {
    if (filterBranch && pyq.branch !== filterBranch) return false;
    if (filterSemester && pyq.semester !== filterSemester) return false;
    if (filterSubject && pyq.subject !== filterSubject) return false;
    return true;
  });

  return (
    <Card variant="glass" interactive delay={0.2}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="w-5 h-5 gradient-text-purple" />
          PYQ Solver
        </CardTitle>
        <CardDescription>
          View PYQ papers and get AI-powered solutions to questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PYQ Selection */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value as Branch | "");
                setFilterSubject("");
              }}
              className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <select
              value={filterSemester}
              onChange={(e) => {
                setFilterSemester(e.target.value as Semester | "");
                setFilterSubject("");
              }}
              className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
            >
              <option value="">All Semesters</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              disabled={!filterBranch && !filterSemester}
              className="px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Subjects</option>
              {subjects
                .filter((subject) => {
                  if (filterBranch || filterSemester) {
                    return filteredPyqs.some((pyq) => pyq.subject === subject);
                  }
                  return true;
                })
                .map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
            </select>
          </div>

          {/* PYQ List */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredPyqs.length === 0 ? (
              <p className="text-[#D4D4D8] text-sm text-center py-4">
                No PYQs found. Try adjusting your filters.
              </p>
            ) : (
              filteredPyqs.map((pyq) => (
                <button
                  key={pyq.id}
                  onClick={() => handleSelectPyq(pyq)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPyq?.id === pyq.id
                      ? "bg-blue-500/20 border-blue-500/50 text-white"
                      : "bg-[#161616]/50 border-[#1a1a1a] text-[#D4D4D8] hover:bg-[#161616] hover:border-[#222222]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pyq.fileName}</p>
                      <p className="text-xs text-[#A1A1AA] mt-1">
                        {pyq.branch} • Sem {pyq.semester} • {pyq.subject}
                      </p>
                    </div>
                    {selectedPyq?.id === pyq.id && (
                      <div className="ml-2 w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* PDF Viewer and Chat Interface */}
        {selectedPyq && (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 mt-4">
            {/* PDF Viewer */}
            <Card variant="glass" className="lg:sticky lg:top-4 flex flex-col order-1">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <FileQuestion className="w-5 h-5 text-blue-400" />
                      PYQ Paper
                    </CardTitle>
                    <CardDescription className="truncate mt-1" title={selectedPyq.fileName}>
                      {selectedPyq.fileName}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* PDF Viewer Container */}
                <div className="flex-1 min-h-[400px] lg:min-h-[500px] lg:h-[calc(100vh-20rem)] overflow-hidden relative bg-[#0a0a0a]">
                  <iframe
                    src={`${selectedPyq.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title="PYQ Paper Viewer"
                    allow="fullscreen"
                    style={{ minHeight: "400px" }}
                  />
                </div>
                {/* PDF Controls */}
                <div className="p-3 border-t border-[#222222] bg-[#161616] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 flex-shrink-0">
                  <a
                    href={selectedPyq.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <FileQuestion className="w-3 h-3" />
                    Open in new tab
                  </a>
                  <span className="text-xs text-[#A1A1AA]">
                    {selectedPyq.branch} • Sem {selectedPyq.semester} • {selectedPyq.subject}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card variant="glass" className="flex flex-col order-2 lg:h-[calc(100vh-12rem)]">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <FileQuestion className="w-5 h-5 text-purple-400" />
                      PYQ Solver Chat
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Ask questions about the paper
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearChat}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Messages */}
                <div className="space-y-4 mb-4 flex-1 overflow-y-auto pr-2 min-h-[300px] lg:min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-500/20 border border-blue-500/30 text-white"
                            : "bg-[#161616] border border-[#222222] text-[#D4D4D8]"
                        }`}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {cleanMarkdown(message.content)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0 mt-auto">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a question from the paper..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedPyq && (
          <div className="p-8 text-center border border-[#222222] rounded-lg bg-[#161616]/50">
            <FileQuestion className="w-12 h-12 text-[#D4D4D8] mx-auto mb-4 opacity-50" />
            <p className="text-[#D4D4D8]">
              Please select a PYQ paper above to start solving.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
