"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, FileText, Upload, X, MessageSquare, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

interface Result {
  id: string;
  semester: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
}

export function ResultViewerAnalyzer() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSemester, setUploadSemester] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadResults = useCallback(async () => {
    if (!user) return;
    setIsLoadingResults(true);
    try {
      const response = await fetch(`/api/results?userId=${user.uid}`);
      const data = await response.json();
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (error: any) {
      console.error("Error loading results:", error);
    } finally {
      setIsLoadingResults(false);
    }
  }, [user]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setUploadFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadSemester || !user) {
      setError("Please select a semester and PDF file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("semester", uploadSemester);
      formData.append("userId", user.uid);

      const response = await fetch("/api/results/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload result");
      }

      // Reload results
      await loadResults();
      setUploadFile(null);
      setUploadSemester("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      setError(error.message || "Failed to upload result");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectResult = (result: Result) => {
    setSelectedResult(result);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `I've loaded your ${result.semester} results. You can view the PDF on the left and ask me questions about your grades, CGPA, or what you need to score to achieve a specific CGPA. What would you like to know?`,
      },
    ]);
    setError(null);
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this result?")) return;

    try {
      const response = await fetch("/api/results/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });

      const data = await response.json();
      if (data.success) {
        await loadResults();
        if (selectedResult?.id === resultId) {
          setSelectedResult(null);
          setMessages([]);
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete result");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedResult) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

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
      const conversationHistory = messages
        .filter((msg) => !msg.isLoading)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch("/api/results/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: selectedResult.id,
          question: userMessage.content,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

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

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^#{1,6}\s+(.*)$/gm, "$1")
      .replace(/^\*\s+(.*)$/gm, "• $1")
      .replace(/^-\s+(.*)$/gm, "• $1")
      .replace(/^\d+\.\s+(.*)$/gm, "$1")
      .trim();
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="w-5 h-5 text-purple-400" />
            Upload Results
          </CardTitle>
          <CardDescription className="text-[#D4D4D8]">
            Upload your semester-wise result PDFs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Semester
              </label>
              <select
                value={uploadSemester}
                onChange={(e) => setUploadSemester(e.target.value)}
                className="w-full px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#7C7CFF] focus:border-[#7C7CFF]"
              >
                <option value="">Select Semester</option>
                {["1", "2", "3", "4", "5", "6", "7", "8"].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Result PDF
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-[#1a1a1a] bg-[#161616]/50 rounded-xl text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
              />
            </div>
          </div>
          {uploadFile && (
            <div className="p-3 bg-[#161616] border border-[#222222] rounded-lg flex items-center justify-between">
              <span className="text-sm text-white">{uploadFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          <Button
            onClick={handleUpload}
            disabled={!uploadFile || !uploadSemester || isUploading}
            variant="neon"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Result
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            Your Results
          </CardTitle>
          <CardDescription className="text-[#D4D4D8]">
            Select a result to view and analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingResults ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-[#D4D4D8] text-center py-8">
              No results uploaded yet. Upload your first result above.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedResult?.id === result.id
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-[#161616] border-[#222222] hover:bg-[#1a1a1a] hover:border-[#333333]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSelectResult(result)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="font-medium text-white">
                            Semester {result.semester}
                          </p>
                          <p className="text-xs text-[#D4D4D8]">{result.fileName}</p>
                        </div>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteResult(result.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer and Chat */}
      {selectedResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PDF Viewer */}
          <Card variant="glass" className="lg:sticky lg:top-4 lg:h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-purple-400" />
                Result PDF
              </CardTitle>
              <CardDescription className="text-[#D4D4D8] truncate" title={selectedResult.fileName}>
                {selectedResult.fileName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden relative">
                <iframe
                  src={selectedResult.fileUrl}
                  className="w-full h-full border-0"
                  title="Result PDF Viewer"
                  allow="fullscreen"
                />
              </div>
              <div className="p-2 border-t border-[#222222] bg-[#161616] flex items-center justify-between">
                <a
                  href={selectedResult.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Open in new tab
                </a>
                <span className="text-xs text-[#A1A1AA]">
                  Semester {selectedResult.semester}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card variant="glass" className="flex flex-col lg:h-[calc(100vh-12rem)]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Result Analyzer Chat
              </CardTitle>
              <CardDescription className="text-[#D4D4D8]">
                Ask questions about your results
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Messages */}
              <div className="space-y-4 mb-4 flex-1 overflow-y-auto pr-2 min-h-0 max-h-full custom-scrollbar">
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
                          ? "bg-purple-500/20 border border-purple-500/30 text-white"
                          : "bg-[#161616] border border-[#222222] text-[#D4D4D8]"
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                          <span className="text-sm">Analyzing...</span>
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

              {/* Input */}
              <div className="flex gap-2 flex-shrink-0 mt-auto">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your CGPA, grades, or what you need to score..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  variant="neon"
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
    </div>
  );
}
