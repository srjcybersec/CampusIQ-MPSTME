"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageSquare, AlertCircle } from "lucide-react";
import { academicEngine } from "@/lib/gemini/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ExaminationPolicyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm here to help you understand the Examination Policy of MPSTME college. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

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
      const response = await academicEngine.answerExaminationPolicyQuestion(input.trim());
      
      // Remove loading message and add response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingMessageId)
          .concat({
            id: Date.now().toString(),
            role: "assistant",
            content: response,
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

  // Strip markdown formatting (asterisks, underscores, etc.)
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text** -> text
      .replace(/\*(.*?)\*/g, '$1')     // Italic *text* -> text
      .replace(/__(.*?)__/g, '$1')     // Bold __text__ -> text
      .replace(/_(.*?)_/g, '$1')       // Italic _text_ -> text
      .replace(/~~(.*?)~~/g, '$1')     // Strikethrough ~~text~~ -> text
      .replace(/`(.*?)`/g, '$1')        // Inline code `text` -> text
      .replace(/```[\s\S]*?```/g, '')  // Code blocks
      .replace(/^#{1,6}\s+(.*)$/gm, '$1') // Headers # text -> text
      .replace(/^\*\s+(.*)$/gm, '• $1')   // Bullet points * -> •
      .replace(/^-\s+(.*)$/gm, '• $1')    // Bullet points - -> •
      .replace(/^\d+\.\s+(.*)$/gm, '$1')  // Numbered lists
      .trim();
  };

  return (
    <Card className="shadow-premium border-2 border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Examination Policy Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about MPSTME college&apos;s Examination Policy
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-[#161616] text-white border border-[#222222]"
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{cleanMarkdown(message.content)}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Out of Scope Warning */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            This chatbox answers only questions related to the Examination Policy of MPSTME college. 
            Questions outside this scope will be politely redirected.
          </p>
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about examination policy, UFM, grading, etc..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="gradient-primary text-white"
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
  );
}
