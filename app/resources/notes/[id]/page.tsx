"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteQA } from "@/components/resources/note-qa";
import { AnimatedBackground } from "@/components/ui/animated-background";
import {
  FileText,
  Download,
  Star,
  Eye,
  Award,
  User,
  Calendar,
  Tag,
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { getNote, getUserRating, rateNote, incrementNoteViews, incrementNoteDownloads } from "@/lib/firebase/notes";
import { Note } from "@/lib/types/notes";
import { useAuth } from "@/lib/auth/context";
import { formatDistanceToNow } from "date-fns";

function NoteDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");
  const [isRating, setIsRating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadNote = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedNote = await getNote(noteId);
      if (fetchedNote) {
        console.log("Loaded note:", {
          id: fetchedNote.id,
          title: fetchedNote.title,
          hasExtractedText: !!fetchedNote.extractedText,
          extractedTextLength: fetchedNote.extractedText?.length || 0
        });
        setNote(fetchedNote);
      } else {
        alert("Note not found");
        router.push("/resources/notes");
      }
    } catch (error) {
      console.error("Error loading note:", error);
      alert("Failed to load note");
      router.push("/resources/notes");
    } finally {
      setIsLoading(false);
    }
  }, [noteId, router]);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId, loadNote]);

  const loadUserRating = useCallback(async () => {
    if (!user || !note) return;
    try {
      const rating = await getUserRating(note.id, user.uid);
      if (rating) {
        setUserRating(rating.rating);
        setRatingComment(rating.comment || "");
      }
    } catch (error) {
      console.error("Error loading user rating:", error);
    }
  }, [user, note]);

  useEffect(() => {
    if (note && user) {
      loadUserRating();
      // Increment views
      incrementNoteViews(note.id).catch(console.error);
    }
  }, [note, user, loadUserRating]);

  const handleRating = async (rating: number) => {
    if (!user) {
      alert("Please log in to rate notes");
      return;
    }

    setIsRating(true);
    try {
      await rateNote(note!.id, user.uid, rating, ratingComment || undefined);
      setUserRating(rating);
      // Reload note to get updated average
      await loadNote();
    } catch (error: any) {
      console.error("Error rating note:", error);
      alert(error.message || "Failed to rate note");
    } finally {
      setIsRating(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert("Please log in to download notes");
      return;
    }

    try {
      await incrementNoteDownloads(note!.id);
      window.open(note!.fileUrl, "_blank");
      // Reload note to get updated download count
      await loadNote();
    } catch (error) {
      console.error("Error downloading note:", error);
    }
  };

  const handleDelete = async () => {
    if (!user || !note) {
      return;
    }

    if (note.uploaderId !== user.uid) {
      alert("You can only delete your own notes");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/notes/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: note.id,
          userId: user.uid,
          fileUrl: note.fileUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete note");
      }

      alert("Note and file deleted successfully!");
      router.push("/resources/notes");
    } catch (error: any) {
      console.error("Error deleting note:", error);
      alert(error.message || "Failed to delete note");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black relative">
        <MainNav />
        <main className="container mx-auto px-4 py-8 relative z-20">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        </main>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && handleRating(star)}
            disabled={!interactive || isRating}
            className={interactive ? "hover:scale-110 transition-transform" : ""}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-[#D4D4D8]"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      <MainNav />

      <main className="container mx-auto px-4 py-8 relative z-20">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#D4D4D8] hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </button>

          {/* Note Details */}
          <Card variant="glass" className="mb-6 shadow-premium relative z-10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl text-white">{note.title}</CardTitle>
                        {note.hasTopperBadge && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-md">
                            <Award className="w-4 h-4 text-white" />
                            <span className="text-sm font-semibold text-white">
                              Topper
                            </span>
                          </div>
                        )}
                      </div>
                      {note.uploaderName && !note.isAnonymous && (
                        <div className="flex items-center gap-2 text-sm text-[#D4D4D8]">
                          <User className="w-4 h-4 text-[#D4D4D8]" />
                          <span className="font-medium">Uploaded by {note.uploaderName}</span>
                          {note.uploaderCGPA && (
                            <span className="text-xs text-[#D4D4D8]">
                              (CGPA: {note.uploaderCGPA.toFixed(2)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              {note.description && (
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Description
                  </h3>
                  <p className="text-[#D4D4D8]">{note.description}</p>
                </div>
              )}

              {/* AI Summary */}
              {note.aiSummary && (
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h3 className="font-semibold text-blue-400 mb-2">
                    AI Summary
                  </h3>
                  <p className="text-sm text-[#D4D4D8]">{note.aiSummary}</p>
                </div>
              )}

              {/* Key Topics */}
              {note.keyTopics && Array.isArray(note.keyTopics) && note.keyTopics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Key Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {note.keyTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {note.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#161616] text-[#D4D4D8] text-sm rounded-full border border-[#222222]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#222222]">
                <div>
                  <p className="text-xs text-[#D4D4D8] mb-1">Subject</p>
                  <p className="font-semibold text-white">{note.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-[#D4D4D8] mb-1">Semester</p>
                  <p className="font-semibold text-white">Sem {note.semester}</p>
                </div>
                <div>
                  <p className="text-xs text-[#D4D4D8] mb-1">Difficulty</p>
                  <p className="font-semibold text-white">{note.difficulty}</p>
                </div>
                <div>
                  <p className="text-xs text-[#D4D4D8] mb-1">Exam Type</p>
                  <p className="font-semibold text-white">{note.examType}</p>
                </div>
                {note.professor && (
                  <div>
                    <p className="text-xs text-[#D4D4D8] mb-1">Professor</p>
                    <p className="font-semibold text-white">{note.professor}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-[#222222]">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {note.averageRating.toFixed(1)} ({note.totalRatings} ratings)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#D4D4D8]" />
                  <span className="text-sm text-[#D4D4D8]">{note.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#D4D4D8]" />
                  <span className="text-sm text-[#D4D4D8]">{note.downloads} downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4D4D8]" />
                  <span className="text-sm text-[#D4D4D8]">
                    {note.createdAt
                      ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true })
                      : "Recently"}
                  </span>
                </div>
                {note.uploaderName && !note.isAnonymous && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4D4D8]" />
                    <span className="text-sm text-[#D4D4D8]">{note.uploaderName}</span>
                  </div>
                )}
              </div>

              {/* Rating Section */}
              {user && (
                <div className="pt-4 border-t border-[#222222]">
                  <h3 className="font-semibold text-white mb-3">
                    Rate this note
                  </h3>
                  <div className="space-y-3">
                    <div>{renderStars(userRating || 0, true)}</div>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Add a comment (optional)..."
                      className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#161616] text-white placeholder:text-[#D4D4D8]"
                      rows={2}
                    />
                    {userRating && (
                      <button
                        onClick={() => handleRating(userRating)}
                        disabled={isRating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isRating ? "Updating..." : "Update Rating"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Note
                </button>

                {/* Delete Button - Only show to uploader */}
                {user && note.uploaderId === user.uid && (
                  <>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete Note
                      </button>
                    ) : (
                      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-400 mb-3 font-semibold">
                          Are you sure you want to delete this note? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Yes, Delete
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="flex-1 bg-[#161616] text-white py-2 rounded-lg font-medium hover:bg-[#222222] transition-all disabled:opacity-50 border border-[#222222]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Q&A */}
          <div className="relative z-10">
            <NoteQA note={note} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NoteDetailPage() {
  return (
    <ProtectedRoute>
      <NoteDetailContent />
    </ProtectedRoute>
  );
}
