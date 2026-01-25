"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MapPin, User, MessageSquare, Edit2, X } from "lucide-react";
import { TimetableEntry } from "@/lib/data/timetable";
import { format } from "date-fns";

interface ScheduleDayViewProps {
  entries: TimetableEntry[];
  day: string;
  date: Date;
  comments: Record<string, string>;
  onCommentChange: (entryId: string, comment: string) => void;
}

export function ScheduleDayView({ entries, day, date, comments, onCommentChange }: ScheduleDayViewProps) {
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleEditComment = (entryId: string) => {
    setEditingComment(entryId);
    setCommentText(comments[entryId] || "");
  };

  const handleSaveComment = (entryId: string) => {
    onCommentChange(entryId, commentText);
    setEditingComment(null);
    setCommentText("");
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setCommentText("");
  };

  const getEntryColor = (entry: TimetableEntry) => {
    if (entry.type === "break") return "bg-[#161616] border-[#222222]";
    if (entry.type === "placement") return "bg-blue-500/20 border-blue-500/50";
    if (entry.type === "elective") return "bg-purple-500/20 border-purple-500/50";
    return "bg-[#161616] border-[#222222]";
  };

  const getEntryIcon = (entry: TimetableEntry) => {
    if (entry.type === "break") return null;
    if (entry.type === "placement") return "🎯";
    if (entry.type === "elective") return "📚";
    return "📖";
  };

  return (
    <Card variant="glass" className="relative z-10 overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">{day}</h2>
          <p className="text-[#D4D4D8]">{format(date, "MMMM d, yyyy")}</p>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-[#D4D4D8] text-center py-8">No classes scheduled for this day.</p>
          ) : (
            entries.map((entry) => {
              const comment = comments[entry.id] || "";
              const isEditing = editingComment === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-lg border transition-calm overflow-hidden ${getEntryColor(entry)}`}
                >
                  {entry.type === "break" ? (
                    <div className="flex items-center justify-center">
                      <span className="text-[#D4D4D8] font-medium">Break</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2 min-w-0">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getEntryIcon(entry) && <span className="flex-shrink-0">{getEntryIcon(entry)}</span>}
                            <h3 className="font-semibold text-white truncate flex-1 min-w-0">{entry.subject}</h3>
                            {entry.subjectCode && entry.subjectCode !== "BREAK" && (
                              <span className="text-xs bg-[#161616] px-2 py-0.5 rounded text-[#D4D4D8] flex-shrink-0">
                                {entry.subjectCode}
                              </span>
                            )}
                            {entry.batch && (
                              <span className="text-xs bg-blue-500/20 border border-blue-500/50 px-2 py-0.5 rounded text-blue-400 font-medium flex-shrink-0">
                                {entry.batch}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-[#D4D4D8] mt-2 overflow-hidden">
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">{entry.time}</span>
                            </span>
                            {entry.room && (
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{entry.room}</span>
                              </span>
                            )}
                            {entry.faculty && (
                              <span className="flex items-center gap-1 min-w-0 flex-1">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{entry.faculty}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment(entry.id)}
                          className="flex-shrink-0 ml-2"
                          data-cursor-hover
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Comment Section */}
                      {isEditing ? (
                        <div className="mt-3 p-3 bg-[#161616] rounded border border-[#222222]">
                          <Textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a note or reminder for this class..."
                            className="mb-2"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveComment(entry.id)}
                              size="sm"
                              variant="neon"
                              data-cursor-hover
                            >
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              size="sm"
                              variant="outline"
                              data-cursor-hover
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : comment ? (
                        <div className="mt-3 p-3 bg-[#161616] rounded border border-[#222222]">
                          <div className="flex items-start justify-between min-w-0">
                            <p className="text-sm text-white flex-1 break-words overflow-hidden">{comment}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(entry.id)}
                              className="flex-shrink-0 ml-2"
                              data-cursor-hover
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
