"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Note } from "@/lib/types/notes";
import {
  FileText,
  Download,
  Star,
  Eye,
  Award,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { incrementNoteDownloads, incrementNoteViews } from "@/lib/firebase/notes";
import { useAuth } from "@/lib/auth/context";

interface NoteCardProps {
  note: Note;
  onView?: () => void;
}

export function NoteCard({ note, onView }: NoteCardProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      alert("Please log in to download notes");
      return;
    }

    setIsDownloading(true);
    try {
      // Increment download count
      await incrementNoteDownloads(note.id);

      // Open file in new tab for download
      window.open(note.fileUrl, "_blank");
    } catch (error) {
      console.error("Error downloading note:", error);
      alert("Failed to download note. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async () => {
    if (!user) {
      alert("Please log in to view notes");
      return;
    }

    try {
      // Increment view count
      await incrementNoteViews(note.id);
      if (onView) onView();
    } catch (error) {
      console.error("Error viewing note:", error);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-[#D4D4D8]" />
        ))}
        <span className="text-sm text-[#D4D4D8] ml-1">
          ({note.totalRatings})
        </span>
      </div>
    );
  };

  return (
    <Card variant="glass" className="hover:shadow-lg transition-shadow h-full w-full flex flex-col relative z-10 overflow-hidden">
      <CardContent className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex items-start justify-between mb-4 min-w-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <h3 className="font-semibold text-white line-clamp-2 flex-1 min-w-0 break-words">
                  {note.title}
                </h3>
                {note.hasTopperBadge && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex-shrink-0">
                    <Award className="w-3 h-3 text-white" />
                    <span className="text-xs font-semibold text-white">Topper</span>
                  </div>
                )}
              </div>
              {note.description && (
                <p className="text-sm text-[#D4D4D8] line-clamp-2 mb-2 break-words overflow-hidden">
                  {note.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4D4D8] mb-2 overflow-hidden">
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Tag className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[120px]">{note.subject}</span>
                </span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">Sem {note.semester}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">{note.difficulty}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">{note.examType}</span>
                {note.professor && (
                  <>
                    <span className="flex-shrink-0">•</span>
                    <span className="truncate max-w-[100px]">{note.professor}</span>
                  </>
                )}
                {note.uploaderName && !note.isAnonymous && (
                  <>
                    <span className="flex-shrink-0">•</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[100px]">{note.uploaderName}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {note.hasTopperBadge && (
            <div className="flex-shrink-0 ml-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                <Award className="w-3 h-3 text-white" />
                <span className="text-xs font-semibold text-white">Topper</span>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 overflow-hidden">
            {note.tags.slice(0, 5).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-[#161616] text-[#D4D4D8] text-xs rounded-full border border-[#222222] truncate max-w-[150px]"
                title={tag}
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 5 && (
              <span className="px-2 py-1 text-[#D4D4D8] text-xs flex-shrink-0">
                +{note.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* AI Summary Preview */}
        {note.aiSummary && (
          <div className="mb-3 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 overflow-hidden">
            <p className="text-xs text-[#D4D4D8] line-clamp-2 break-words">
              <span className="font-semibold text-white">AI Summary: </span>
              {note.aiSummary}
            </p>
          </div>
        )}

        {/* Key Topics */}
        {note.keyTopics && Array.isArray(note.keyTopics) && note.keyTopics.length > 0 && (
          <div className="mb-3 overflow-hidden">
            <p className="text-xs font-semibold text-white mb-1">
              Key Topics:
            </p>
            <div className="flex flex-wrap gap-1 overflow-hidden">
              {note.keyTopics.slice(0, 4).map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30 truncate max-w-[150px]"
                  title={topic}
                >
                  {topic}
                </span>
              ))}
              {note.keyTopics.length > 4 && (
                <span className="px-2 py-1 text-[#D4D4D8] text-xs flex-shrink-0">
                  +{note.keyTopics.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#222222] mt-auto flex-shrink-0 min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#D4D4D8] min-w-0 overflow-hidden">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {renderStars(note.averageRating)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {note.views}
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {note.downloads}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {note.createdAt
                ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true })
                : "Recently"}
            </div>
            {note.uploaderName && !note.isAnonymous && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {note.uploaderName}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                handleView();
                window.location.href = `/resources/notes/${note.id}`;
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              View
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            >
              <Download className="w-3 h-3" />
              {isDownloading ? "..." : "Download"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
