"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ExamSurvivalKit } from "@/lib/types/notes";
import { Package, Download, Calendar, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { incrementKitDownloads } from "@/lib/firebase/notes";
import { useAuth } from "@/lib/auth/context";
import { useState } from "react";

interface SurvivalKitCardProps {
  kit: ExamSurvivalKit;
  onView?: () => void;
}

export function SurvivalKitCard({ kit, onView }: SurvivalKitCardProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      alert("Please log in to download kits");
      return;
    }

    setIsDownloading(true);
    try {
      await incrementKitDownloads(kit.id);
      if (onView) onView();
    } catch (error) {
      console.error("Error downloading kit:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card variant="glass" className="hover:shadow-lg transition-shadow h-full w-full flex flex-col relative z-10 overflow-hidden">
      <CardContent className="p-6 flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between mb-4 min-w-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 flex-shrink-0">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-white mb-1 line-clamp-2 break-words">
                {kit.name}
              </h3>
              {kit.description && (
                <p className="text-sm text-[#D4D4D8] line-clamp-2 mb-2 break-words overflow-hidden">
                  {kit.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4D4D8] overflow-hidden">
                <span className="flex-shrink-0">{kit.subject}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">Sem {kit.semester}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">{kit.examType}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">{kit.noteIds.length} note{kit.noteIds.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#222222] mt-auto flex-shrink-0 min-w-0">
          <div className="flex items-center gap-4 text-xs text-[#D4D4D8] overflow-hidden">
            <div className="flex items-center gap-1 flex-shrink-0">
              <Download className="w-3 h-3" />
              {kit.downloads} downloads
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              {kit.createdAt
                ? formatDistanceToNow(kit.createdAt.toDate(), { addSuffix: true })
                : "Recently"}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            >
              <Download className="w-3 h-3" />
              {isDownloading ? "..." : "Download"}
            </button>
            <button
              onClick={() => {
                if (onView) onView();
                window.location.href = `/resources/notes/kits/${kit.id}`;
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              View
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
