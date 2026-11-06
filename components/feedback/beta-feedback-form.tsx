"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";
import { submitBetaFeedback } from "@/lib/firebase/feedback";
import {
  FEEDBACK_CATEGORIES,
  FeedbackCategory,
} from "@/lib/types/feedback";
import { AlertCircle, CheckCircle2, MessageSquarePlus, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BetaFeedbackForm() {
  const { user, userProfile } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("from");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please sign in to send feedback.");
      return;
    }
    if (rating < 1) {
      setError("Please tap a star rating before submitting.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please write at least 10 characters so we can understand your feedback.");
      return;
    }
    if (message.trim().length > 2000) {
      setError("Feedback is too long. Please keep it under 2000 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitBetaFeedback({
        userId: user.uid,
        email: user.email || userProfile?.email || "unknown",
        username: userProfile?.username,
        rating,
        category,
        message: message.trim(),
        pagePath: fromPage || pathname || "/feedback",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined,
      });
      setSuccess(true);
      setRating(0);
      setCategory("general");
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send feedback. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="shadow-premium border-[#7C7CFF]/30">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Thank you!</h2>
          <p className="text-[#D4D4D8] text-sm max-w-md mx-auto">
            Your beta feedback was saved. It goes straight to the CampusIQ team — we read every submission.
          </p>
          <Button
            variant="outline"
            onClick={() => setSuccess(false)}
            className="border-[#333] text-white hover:bg-[#161616]"
          >
            Send more feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-[#7C7CFF]" />
          Beta feedback form
        </CardTitle>
        <CardDescription>
          Help us improve CampusIQ before launch. Your username and email are attached so we can follow up if needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Overall experience
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg transition-transform hover:scale-110"
                  aria-label={`Rate ${value} out of 5`}
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoverRating || rating) >= value
                        ? "fill-amber-400 text-amber-400"
                        : "text-[#444]"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-[#D4D4D8] ml-2">{rating}/5</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              What kind of feedback is this?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEEDBACK_CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border transition-all",
                    category === item.value
                      ? "border-[#7C7CFF] bg-[#7C7CFF]/10"
                      : "border-[#222] bg-[#161616]/50 hover:border-[#333]"
                  )}
                >
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="block text-xs text-[#6b6b6b] mt-0.5">{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-message" className="text-sm font-medium text-white mb-2 block">
              Your feedback
            </label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
              placeholder="Tell us what happened, what you expected, or what you'd love to see..."
              rows={5}
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#6b6b6b] mt-1 text-right">{message.length}/2000</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] hover:opacity-90"
          >
            {isSubmitting ? "Sending..." : "Send feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
