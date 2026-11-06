"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampusVoiceCategory, CAMPUS_VOICE_CATEGORIES } from "@/lib/types/campus-voice";
import { moderateContent, sanitizeContent } from "@/lib/utils/moderation";
import { createCampusVoice } from "@/lib/firebase/campus-voices";
import { useAuth } from "@/lib/auth/context";
import { MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

interface CampusVoiceFormProps {
  onSuccess?: () => void;
}

export function CampusVoiceForm({ onSuccess }: CampusVoiceFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CampusVoiceCategory>("unsent-messages");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [moderationResult, setModerationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const handleContentChange = (value: string) => {
    setContent(value);
    setError(null);
    setSuccess(false);
    if (value.length > 0) {
      const sanitized = sanitizeContent(value);
      setModerationResult(moderateContent(sanitized));
    } else {
      setModerationResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to post");
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
      await createCampusVoice(sanitized, category, user.uid);
      setSuccess(true);
      setContent("");
      setCategory("unsent-messages");
      setModerationResult(null);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Share Your Voice
        </CardTitle>
        <CardDescription>
          Post anonymously. All submissions are moderated for a safe campus community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(CAMPUS_VOICE_CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as CampusVoiceCategory)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    category === key
                      ? "border-blue-500 bg-blue-500/20 shadow-soft"
                      : "border-[#222222] bg-[#161616] hover:border-[#333333] hover:shadow-soft"
                  }`}
                >
                  <div className="text-lg mb-1">{value.emoji}</div>
                  <div className="text-sm font-medium text-white">{value.label}</div>
                  <div className="text-xs text-[#D4D4D8] mt-1">{value.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">Your message</label>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Share your thoughts... (10-500 characters)"
              rows={6}
              maxLength={500}
              className="resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-[#D4D4D8]">{content.length}/500 characters</div>
              {moderationResult && (
                <div className="flex items-center gap-2">
                  {moderationResult.errors.length > 0 && (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {moderationResult.errors.length} error(s)
                    </div>
                  )}
                  {moderationResult.warnings.length > 0 && moderationResult.errors.length === 0 && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {moderationResult.warnings.length} warning(s)
                    </div>
                  )}
                  {moderationResult.errors.length === 0 && moderationResult.warnings.length === 0 && (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Looks good!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {moderationResult && moderationResult.warnings.length > 0 && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
              <div className="text-sm text-amber-400">
                <strong>Note:</strong> {moderationResult.warnings.join(", ")}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="text-sm text-red-400">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-sm text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Posted successfully!
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || !!(moderationResult && !moderationResult.isValid)}
            className="w-full min-h-[40px] px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-premium hover:shadow-glow-hover hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {isSubmitting ? "Posting..." : "Post Anonymously"}
          </button>

          <div className="text-xs text-[#D4D4D8] space-y-1 pt-2 border-t border-[#222222]">
            <p><strong className="text-white">Guidelines:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>No real names or targeting individuals</li>
              <li>No hate speech or inappropriate content</li>
              <li>Keep it respectful and positive</li>
              <li>Your identity stays anonymous</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
