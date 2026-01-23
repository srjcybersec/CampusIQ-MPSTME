"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteCard } from "@/components/resources/note-card";
import {
  Package,
  Download,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import { getSurvivalKit, getNote, incrementKitDownloads } from "@/lib/firebase/notes";
import { ExamSurvivalKit, Note } from "@/lib/types/notes";
import { useAuth } from "@/lib/auth/context";
import { formatDistanceToNow } from "date-fns";

function SurvivalKitDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const kitId = params.id as string;

  const [kit, setKit] = useState<ExamSurvivalKit | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (kitId) {
      loadKit();
    }
  }, [kitId]);

  const loadKit = async () => {
    setIsLoading(true);
    try {
      const fetchedKit = await getSurvivalKit(kitId);
      if (fetchedKit) {
        setKit(fetchedKit);
        // Load all notes in the kit
        const notePromises = fetchedKit.noteIds.map((noteId) => getNote(noteId));
        const loadedNotes = await Promise.all(notePromises);
        setNotes(loadedNotes.filter((note) => note !== null) as Note[]);
      } else {
        alert("Survival kit not found");
        router.push("/resources/notes/kits");
      }
    } catch (error) {
      console.error("Error loading kit:", error);
      alert("Failed to load survival kit");
      router.push("/resources/notes/kits");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert("Please log in to download kits");
      return;
    }

    setIsDownloading(true);
    try {
      await incrementKitDownloads(kit!.id);
      // Download all notes in the kit
      notes.forEach((note) => {
        window.open(note.fileUrl, "_blank");
      });
      // Reload to update download count
      await loadKit();
    } catch (error) {
      console.error("Error downloading kit:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  if (!kit) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kits
          </button>

          {/* Kit Details */}
          <Card className="mb-6 shadow-premium">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{kit.name}</CardTitle>
                    {kit.description && (
                      <p className="text-neutral-700 mb-4">{kit.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Subject</p>
                  <p className="font-semibold text-neutral-900">{kit.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Semester</p>
                  <p className="font-semibold text-neutral-900">Sem {kit.semester}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Exam Type</p>
                  <p className="font-semibold text-neutral-900">{kit.examType}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Notes</p>
                  <p className="font-semibold text-neutral-900">
                    {kit.noteIds.length} note{kit.noteIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">
                    {kit.downloads} downloads
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">
                    {kit.createdAt
                      ? formatDistanceToNow(kit.createdAt.toDate(), { addSuffix: true })
                      : "Recently"}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading || notes.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isDownloading
                  ? "Downloading..."
                  : `Download All Notes (${notes.length})`}
              </button>
            </CardContent>
          </Card>

          {/* Notes in Kit */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Notes in This Kit ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <Card className="shadow-premium">
                <CardContent className="p-12 text-center">
                  <p className="text-neutral-600">
                    No notes found in this kit. Some notes may have been deleted.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SurvivalKitDetailPage() {
  return (
    <ProtectedRoute>
      <SurvivalKitDetailContent />
    </ProtectedRoute>
  );
}
