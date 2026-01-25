"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PYQDocument } from "@/lib/types/pyqs";
import { FileText, Download, Calendar, Building2, GraduationCap, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PYQCardProps {
  pyq: PYQDocument;
}

export function PYQCard({ pyq }: PYQCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Track download
      await fetch("/api/pyqs/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pyqId: pyq.id }),
      });

      // Open file in new tab for download
      window.open(pyq.fileUrl, "_blank");
    } catch (error) {
      console.error("Error downloading PYQ:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card variant="glass" className="hover:shadow-lg transition-shadow h-full w-full flex flex-col relative z-10 overflow-hidden">
      <CardContent className="p-6 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 min-w-0">
          <div className="p-2 bg-gradient-to-br from-[#22D3EE] to-[#A855F7] rounded-lg border border-cyan-500/30 flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3 className="font-semibold text-white mb-1 line-clamp-2 break-words">
              {pyq.fileName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4D4D8] overflow-hidden">
              <span className="flex items-center gap-1 flex-shrink-0">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{pyq.branch}</span>
              </span>
              <span className="flex-shrink-0">•</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <GraduationCap className="w-3 h-3 flex-shrink-0" />
                <span>Sem {pyq.semester}</span>
              </span>
              <span className="flex-shrink-0">•</span>
              <span className="flex items-center gap-1 min-w-0 flex-1">
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{pyq.subject}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#D4D4D8] mb-4 overflow-hidden">
          <div className="flex items-center gap-1 flex-shrink-0">
            <FileText className="w-3 h-3" />
            {formatFileSize(pyq.fileSize)}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Download className="w-3 h-3" />
            {pyq.downloadCount} downloads
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(pyq.uploadedAt, { addSuffix: true })}
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-auto flex-shrink-0 pt-3 border-t border-[#222222]">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white text-sm rounded-lg hover:from-[#22D3EE]/80 hover:to-[#A855F7]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
