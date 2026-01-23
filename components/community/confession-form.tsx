"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfessionCategory, CONFESSION_CATEGORIES } from "@/lib/types/confession";
import { moderateContent, sanitizeContent } from "@/lib/utils/moderation";
import { createConfession } from "@/lib/firebase/confessions";
import { useAuth } from "@/lib/auth/context";
import { MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

interface ConfessionFormProps {
  onSuccess?: () => void;
}

export function ConfessionForm({ onSuccess }: ConfessionFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ConfessionCategory>("unsent-messages");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [moderationResult, setModerationResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);

  const handleContentChange = (value: string) => {
    setContent(value);
    setError(null);
    setSuccess(false);
    
    if (value.length > 0) {
      const sanitized = sanitizeContent(value);
      const result = moderateContent(sanitized);
      setModerationResult(result);
    } else {
      setModerationResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to post a confession");
      return;
    }

    const sanitized = sanitizeContent(content);
    const moderation = moderateContent(sanitized);

    if (!moderation.isValid) {
      setError(moderation.errors.join(", "));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createConfession(sanitized, category, user.uid);
      setSuccess(true);
      setContent("");
      setCategory("unsent-messages");
      setModerationResult(null);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to post confession. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Post a Confession
        </CardTitle>
        <CardDescription>
          Share your thoughts anonymously. All confessions are moderated for safety.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(CONFESSION_CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as ConfessionCategory)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    category === key
                      ? "border-blue-500 bg-blue-50 shadow-soft"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-soft"
                  }`}
                >
                  <div className="text-lg mb-1">{value.emoji}</div>
                  <div className="text-sm font-medium text-neutral-900">{value.label}</div>
                  <div className="text-xs text-neutral-500 mt-1">{value.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Your Confession
            </label>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Share your thoughts... (10-500 characters)"
              rows={6}
              maxLength={500}
              className="resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-neutral-500">
                {content.length}/500 characters
              </div>
              {moderationResult && (
                <div className="flex items-center gap-2">
                  {moderationResult.errors.length > 0 && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {moderationResult.errors.length} error(s)
                    </div>
                  )}
                  {moderationResult.warnings.length > 0 && moderationResult.errors.length === 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {moderationResult.warnings.length} warning(s)
                    </div>
                  )}
                  {moderationResult.errors.length === 0 && moderationResult.warnings.length === 0 && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Looks good!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Moderation Warnings */}
          {moderationResult && moderationResult.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> {moderationResult.warnings.join(", ")}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Confession posted successfully!
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || (moderationResult && !moderationResult.isValid)}
            className="w-full min-h-[40px] px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-premium hover:shadow-glow-hover hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {isSubmitting ? "Posting..." : "Post Confession"}
          </button>

          {/* Guidelines */}
          <div className="text-xs text-neutral-500 space-y-1 pt-2 border-t border-neutral-200">
            <p><strong>Guidelines:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>No real names or targeting individuals</li>
              <li>No hate speech or inappropriate content</li>
              <li>Keep it respectful and safe</li>
              <li>All confessions are anonymous</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
