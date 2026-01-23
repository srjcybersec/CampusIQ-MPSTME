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
          <Star key={i} className="w-4 h-4 text-neutral-300" />
        ))}
        <span className="text-sm text-neutral-600 ml-1">
          ({note.totalRatings})
        </span>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900 line-clamp-2 flex-1">
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
                <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                  {note.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-2">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {note.subject}
                </span>
                <span>•</span>
                <span>Sem {note.semester}</span>
                <span>•</span>
                <span>{note.difficulty}</span>
                <span>•</span>
                <span>{note.examType}</span>
                {note.professor && (
                  <>
                    <span>•</span>
                    <span>{note.professor}</span>
                  </>
                )}
                {note.uploaderName && !note.isAnonymous && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {note.uploaderName}
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
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 5).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 5 && (
              <span className="px-2 py-1 text-neutral-500 text-xs">
                +{note.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* AI Summary Preview */}
        {note.aiSummary && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-neutral-700 line-clamp-2">
              <span className="font-semibold">AI Summary: </span>
              {note.aiSummary}
            </p>
          </div>
        )}

        {/* Key Topics */}
        {note.keyTopics && Array.isArray(note.keyTopics) && note.keyTopics.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-neutral-700 mb-1">
              Key Topics:
            </p>
            <div className="flex flex-wrap gap-1">
              {note.keyTopics.slice(0, 4).map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                >
                  {topic}
                </span>
              ))}
              {note.keyTopics.length > 4 && (
                <span className="px-2 py-1 text-neutral-500 text-xs">
                  +{note.keyTopics.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-200">
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
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
