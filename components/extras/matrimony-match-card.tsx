"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Match, MatrimonyProfile, CONNECTION_TYPES, BRANCHES, STUDY_STYLES } from "@/lib/types/matrimony";
import { updateMatchStatus, reportMatch, getProfile } from "@/lib/firebase/matrimony";
import { useAuth } from "@/lib/auth/context";
import { Heart, X, Flag, MessageCircle, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MatrimonyMatchCardProps {
  match: Match;
  otherUserProfile?: MatrimonyProfile | null;
  onUpdate?: () => void;
  onChat?: (matchId: string) => void;
}

export function MatrimonyMatchCard({ match, otherUserProfile, onUpdate, onChat }: MatrimonyMatchCardProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const isUser1 = match.user1Id === user?.uid;
  const otherUserId = isUser1 ? match.user2Id : match.user1Id;

  const handleAccept = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await updateMatchStatus(match.id, "accepted");
      if (onUpdate) onUpdate();
    } catch (error: any) {
      alert(error.message || "Failed to accept match");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await updateMatchStatus(match.id, "rejected");
      if (onUpdate) onUpdate();
    } catch (error: any) {
      alert(error.message || "Failed to reject match");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReport = async () => {
    if (!user || !reportReason) return;
    setIsProcessing(true);
    try {
      await reportMatch(match.id, user.uid, reportReason);
      alert("Thank you for reporting. We'll review this match.");
      setShowReportModal(false);
      setReportReason("");
      if (onUpdate) onUpdate();
    } catch (error: any) {
      alert(error.message || "Failed to report match");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTimeAgo = () => {
    try {
      const timestamp = match.createdAt?.toDate?.() || new Date(match.createdAt);
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  if (match.status === "rejected" || match.status === "blocked") {
    return null;
  }

  return (
    <>
      <Card className="shadow-soft hover:shadow-premium transition-all duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold">
                {otherUserProfile?.branch ? CONNECTION_TYPES[match.connectionType].emoji : "👤"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-neutral-900">
                    {otherUserProfile ? `${BRANCHES[otherUserProfile.branch].label} Student` : "Anonymous"}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {match.cgpaLeague}
                  </span>
                </div>
                <p className="text-sm text-neutral-500">{getTimeAgo()}</p>
              </div>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-neutral-400 hover:text-red-600 transition-colors"
              title="Report"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Compatibility Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">Compatibility</span>
              <span className="text-lg font-bold text-pink-600">{match.compatibilityScore}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all"
                style={{ width: `${match.compatibilityScore}%` }}
              />
            </div>
          </div>

          {/* Why We Matched */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Why We Matched</span>
            </div>
            <ul className="space-y-1">
              {match.matchReasons.map((reason, index) => (
                <li key={index} className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Profile Details (if available) */}
          {otherUserProfile && (
            <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-500">Branch:</span>
                  <span className="ml-2 font-medium">{BRANCHES[otherUserProfile.branch].label}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Year:</span>
                  <span className="ml-2 font-medium">Year {otherUserProfile.year}</span>
                </div>
                <div>
                  <span className="text-neutral-500">CGPA:</span>
                  <span className="ml-2 font-medium">{otherUserProfile.cgpa}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Study Style:</span>
                  <span className="ml-2 font-medium">{STUDY_STYLES[otherUserProfile.studyStyle].label}</span>
                </div>
              </div>
              {otherUserProfile.bio && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-sm text-neutral-700 italic">&quot;{otherUserProfile.bio}&quot;</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {match.status === "pending" ? (
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Pass</span>
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-glow-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                <span>Accept</span>
              </button>
            </div>
          ) : match.status === "accepted" ? (
            <button
              onClick={() => onChat && onChat(match.id)}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-glow-hover transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Chat</span>
            </button>
          ) : null}
        </CardContent>
      </Card>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-premium">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Report Match</h3>
              <p className="text-sm text-neutral-600 mb-4">Why are you reporting this match?</p>
              <div className="space-y-2 mb-4">
                {["Inappropriate behavior", "Fake profile", "Harassment", "Spam", "Other"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      reportReason === reason
                        ? "border-red-500 bg-red-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span className="text-sm text-neutral-800">{reason}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="flex-1 px-4 py-2 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason || isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Reporting..." : "Report"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
