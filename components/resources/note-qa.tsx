"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Note } from "@/lib/types/notes";
import { MessageSquare, Send, Loader2, Bot, User, Trash2 } from "lucide-react";

interface NoteQAProps {
  note: Note;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function NoteQA({ note }: NoteQAProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    // Add user question to messages
    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);
    setError("");

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .slice(-5) // Last 5 messages for context
        .map((msg) => `${msg.role === "user" ? "Student" : "AI"}: ${msg.content}`)
        .join("\n");

      console.log("Sending Q&A request:", {
        hasExtractedText: !!note.extractedText,
        extractedTextLength: note.extractedText?.length || 0,
        hasSummary: !!note.aiSummary,
        hasKeyTopics: !!note.keyTopics
      });

      const response = await fetch("/api/notes/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          title: note.title,
          fileName: note.fileName,
          summary: note.aiSummary,
          keyTopics: note.keyTopics,
          conversationHistory, // Include conversation history
          fileContent: note.extractedText || "", // Use extracted text from the document
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get answer");
      }

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Error asking question:", err);
      setError(err.message || "Failed to get answer. Please try again.");
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && question.trim()) {
        handleAsk();
      }
    }
  };

  return (
    <Card variant="glass" className="shadow-premium relative z-10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5" />
            Ask AI About This Note
          </CardTitle>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-sm text-[#D4D4D8] hover:text-white flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto border border-[#222222] rounded-lg p-4 bg-[#161616]">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-[#161616] border border-[#222222] text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#161616] border border-[#222222] flex items-center justify-center">
                    <User className="w-4 h-4 text-[#D4D4D8]" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-[#161616] border border-[#222222] rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-[#D4D4D8]">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              messages.length === 0
                ? "Ask a question about this study material... (e.g., What are the key concepts? Explain the main topics.)"
                : "Ask a follow-up question..."
            }
            className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-[#161616] text-white placeholder:text-[#D4D4D8]"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#D4D4D8]">
              Press Enter to send, Shift+Enter for new line
            </p>
            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
