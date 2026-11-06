"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CampusVoiceItem,
  CAMPUS_VOICE_CATEGORIES,
  REPORT_REASONS,
} from "@/lib/types/campus-voice";
import {
  likeCampusVoice,
  hasUserLikedVoice,
  reportCampusVoice,
  deleteCampusVoice,
} from "@/lib/firebase/campus-voices";
import { useAuth } from "@/lib/auth/context";
import { Heart, Flag, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CampusVoiceCardProps {
  voice: CampusVoiceItem;
  onUpdate?: () => void;
}

function curatedLikeKey(voiceId: string, userId: string) {
  return `campus-voice-like:${userId}:${voiceId}`;
}

export function CampusVoiceCard({ voice, onUpdate }: CampusVoiceCardProps) {
  const { user } = useAuth();
  const categoryInfo = CAMPUS_VOICE_CATEGORIES[voice.category];
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(voice.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const checkLikeStatus = useCallback(async () => {
    if (!user) return;
    if (voice.isCurated) {
      setIsLiked(localStorage.getItem(curatedLikeKey(voice.id, user.uid)) === "1");
      return;
    }
    try {
      setIsLiked(await hasUserLikedVoice(voice.id, user.uid));
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  }, [user, voice.id, voice.isCurated]);

  useEffect(() => {
    checkLikeStatus();
  }, [checkLikeStatus]);

  const handleLike = async () => {
    if (!user) {
      alert("Please log in to like posts");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (voice.isCurated) {
        const key = curatedLikeKey(voice.id, user.uid);
        const next = !isLiked;
        setIsLiked(next);
        setLikesCount((prev) => (next ? prev + 1 : Math.max(voice.likes, prev - 1)));
        if (next) localStorage.setItem(key, "1");
        else localStorage.removeItem(key);
      } else {
        await likeCampusVoice(voice.id, user.uid);
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
        onUpdate?.();
      }
    } catch (error: any) {
      alert(error.message || "Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("Please log in to report posts");
      return;
    }
    if (!reportReason) {
      alert("Please select a reason for reporting");
      return;
    }

    setIsReporting(true);
    try {
      if (voice.isCurated) {
        alert("Thank you for your report. We'll review this post.");
      } else {
        await reportCampusVoice(voice.id, user.uid, reportReason);
        alert("Thank you for reporting. We'll review this post.");
        onUpdate?.();
      }
      setShowReportModal(false);
      setReportReason("");
    } catch (error: any) {
      alert(error.message || "Failed to report post");
    } finally {
      setIsReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || voice.isCurated) return;

    setIsDeleting(true);
    try {
      await deleteCampusVoice(voice.id, user.uid);
      onUpdate?.();
    } catch (error: any) {
      alert(error.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isAuthor = !voice.isCurated && user && voice.authorId === user.uid;
  const timeAgo = formatDistanceToNow(new Date(voice.createdAt), { addSuffix: true });

  return (
    <>
      <Card className="shadow-soft hover:shadow-premium transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{categoryInfo.emoji}</span>
              <span className="text-sm font-medium text-white">{categoryInfo.label}</span>
            </div>
            <span className="text-xs text-[#D4D4D8]">{timeAgo}</span>
          </div>

          <p className="text-white mb-4 leading-relaxed whitespace-pre-wrap">{voice.content}</p>

          <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking || !user}
              className={`flex items-center gap-2 ${
                isLiked ? "text-red-500 hover:text-red-600" : "text-white hover:text-[#D4D4D8]"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </Button>

            <div className="flex items-center gap-2">
              {isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-white hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(true)}
                disabled={!user}
                className="flex items-center gap-2 text-white hover:text-red-600"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card variant="glass" className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Delete Post</h3>
              <p className="text-sm text-[#D4D4D8] mb-4">
                Are you sure you want to delete this post? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleDelete} disabled={isDeleting} variant="neon" className="flex-1">
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card variant="glass" className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Report Post</h3>
              <p className="text-sm text-[#D4D4D8] mb-4">Why are you reporting this post?</p>
              <div className="space-y-2 mb-4">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      reportReason === reason
                        ? "border-red-500 bg-red-500/20"
                        : "border-[#222222] bg-[#161616] hover:border-[#333333]"
                    }`}
                  >
                    <span className="text-sm text-white">{reason}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleReport} disabled={!reportReason || isReporting} variant="neon" className="flex-1">
                  {isReporting ? "Reporting..." : "Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
