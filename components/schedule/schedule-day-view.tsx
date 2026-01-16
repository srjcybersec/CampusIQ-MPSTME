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
    if (entry.type === "break") return "bg-neutral-100 border-neutral-200";
    if (entry.type === "placement") return "bg-blue-50 border-blue-200";
    if (entry.type === "elective") return "bg-purple-50 border-purple-200";
    return "bg-white border-neutral-200";
  };

  const getEntryIcon = (entry: TimetableEntry) => {
    if (entry.type === "break") return null;
    if (entry.type === "placement") return "🎯";
    if (entry.type === "elective") return "📚";
    return "📖";
  };

  return (
    <Card className="shadow-soft border-2 border-neutral-200">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">{day}</h2>
          <p className="text-neutral-600">{format(date, "MMMM d, yyyy")}</p>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No classes scheduled for this day.</p>
          ) : (
            entries.map((entry) => {
              const comment = comments[entry.id] || "";
              const isEditing = editingComment === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-lg border-2 transition-calm ${getEntryColor(entry)}`}
                >
                  {entry.type === "break" ? (
                    <div className="flex items-center justify-center">
                      <span className="text-neutral-500 font-medium">Break</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getEntryIcon(entry) && <span>{getEntryIcon(entry)}</span>}
                            <h3 className="font-semibold text-neutral-900">{entry.subject}</h3>
                            {entry.subjectCode && entry.subjectCode !== "BREAK" && (
                              <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded text-neutral-700">
                                {entry.subjectCode}
                              </span>
                            )}
                            {entry.batch && (
                              <span className="text-xs bg-blue-200 px-2 py-0.5 rounded text-blue-800 font-medium">
                                {entry.batch}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {entry.time}
                            </span>
                            {entry.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {entry.room}
                              </span>
                            )}
                            {entry.faculty && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {entry.faculty}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment(entry.id)}
                          className="flex-shrink-0"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Comment Section */}
                      {isEditing ? (
                        <div className="mt-3 p-3 bg-white rounded border border-neutral-300">
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
                              className="gradient-primary text-white"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              size="sm"
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : comment ? (
                        <div className="mt-3 p-3 bg-white rounded border border-neutral-300">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-neutral-700 flex-1">{comment}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(entry.id)}
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
