"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MapPin, User, MessageSquare, Edit2, X, Trash2, Save } from "lucide-react";
import { TimetableEntry } from "@/lib/data/timetable";
import { format, isSameDay } from "date-fns";

interface ScheduleDayViewProps {
  entries: TimetableEntry[];
  day: string;
  date: Date;
  comments: Record<string, string>;
  onCommentChange: (entryId: string, comment: string) => void;
  onEntryUpdate?: (entryId: string, updatedEntry: TimetableEntry) => void;
  onEntryDelete?: (entryId: string) => void;
}

export function ScheduleDayView({ entries, day, date, comments, onCommentChange, onEntryUpdate, onEntryDelete }: ScheduleDayViewProps) {
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TimetableEntry>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Check if an entry is currently active
  const isCurrentClass = (entry: TimetableEntry): boolean => {
    // Only highlight if it's today
    if (!isSameDay(date, currentTime)) return false;
    
    // Check if current time is within the class time range
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMin;

    const [startHour, startMin] = entry.startTime.split(":").map(Number);
    const [endHour, endMin] = entry.endTime.split(":").map(Number);
    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  };

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

  const handleEditEntry = (entry: TimetableEntry) => {
    setEditingEntry(entry.id);
    setEditFormData({
      subject: entry.subject,
      subjectCode: entry.subjectCode,
      faculty: entry.faculty,
      room: entry.room,
      batch: entry.batch,
      time: entry.time,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
  };

  const handleSaveEntry = async (entryId: string) => {
    if (!onEntryUpdate) return;
    
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const updatedEntry: TimetableEntry = {
      ...entry,
      ...editFormData,
    };

    onEntryUpdate(entryId, updatedEntry);
    setEditingEntry(null);
    setEditFormData({});
  };

  const handleCancelEditEntry = () => {
    setEditingEntry(null);
    setEditFormData({});
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!onEntryDelete) return;
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    setIsDeleting(entryId);
    try {
      onEntryDelete(entryId);
    } finally {
      setIsDeleting(null);
    }
  };

  const getEntryColor = (entry: TimetableEntry) => {
    // Highlight current class
    if (isCurrentClass(entry)) {
      return "bg-blue-500/30 border-blue-500/70 ring-2 ring-blue-500/50";
    }
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
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#D4D4D8]" />
                        <span className="text-[#D4D4D8] font-medium">{entry.subject || "Break"}</span>
                      </div>
                      {entry.time && (
                        <span className="text-sm text-[#A1A1AA]">{entry.time}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      {editingEntry === entry.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-[#D4D4D8] mb-1 block">Subject</label>
                              <Input
                                value={editFormData.subject || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                                className="bg-[#161616] border-[#222222] text-white"
                                placeholder="Subject name"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#D4D4D8] mb-1 block">Subject Code</label>
                              <Input
                                value={editFormData.subjectCode || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, subjectCode: e.target.value })}
                                className="bg-[#161616] border-[#222222] text-white"
                                placeholder="Subject code"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#D4D4D8] mb-1 block">Faculty</label>
                              <Input
                                value={editFormData.faculty || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, faculty: e.target.value })}
                                className="bg-[#161616] border-[#222222] text-white"
                                placeholder="Faculty name"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#D4D4D8] mb-1 block">Room</label>
                              <Input
                                value={editFormData.room || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                                className="bg-[#161616] border-[#222222] text-white"
                                placeholder="Room number"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#D4D4D8] mb-1 block">Batch</label>
                              <Input
                                value={editFormData.batch || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, batch: e.target.value as "K1" | "K2" })}
                                className="bg-[#161616] border-[#222222] text-white"
                                placeholder="K1, K2, etc."
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#D4D4D8] mb-1 block">Time</label>
                              <Input
                                value={editFormData.time || ""}
                                onChange={(e) => {
                                  const timeMatch = e.target.value.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
                                  if (timeMatch) {
                                    setEditFormData({
                                      ...editFormData,
                                      time: e.target.value,
                                      startTime: `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`,
                                      endTime: `${timeMatch[3].padStart(2, "0")}:${timeMatch[4]}`,
                                    });
                                  } else {
                                    setEditFormData({ ...editFormData, time: e.target.value });
                                  }
                                }}
                                className="bg-[#161616] border-[#222222] text-white"
                                placeholder="09:00-10:00"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEntry(entry.id)}
                              size="sm"
                              variant="neon"
                              className="flex-1"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEditEntry}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
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
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-[#D4D4D8] mt-2 overflow-hidden">
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
                                  <span className="flex items-center gap-1 min-w-0 flex-shrink-0">
                                    <User className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{entry.faculty}</span>
                                  </span>
                                )}
                                {isCurrentClass(entry) && (
                                  <span className="flex items-center gap-1 flex-shrink-0 text-blue-400 font-medium">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                    Now
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              {onEntryUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditEntry(entry)}
                                  className="p-1.5"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                              {onEntryDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  disabled={isDeleting === entry.id}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  {isDeleting === entry.id ? (
                                    <X className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditComment(entry.id)}
                                className="p-1.5"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

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
                        <div className="mt-3 p-3 bg-[#161616] rounded border border-[#222222]">
                          <div className="flex items-start justify-between min-w-0">
                            <p className="text-sm text-white flex-1 break-words overflow-hidden">{comment}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(entry.id)}
                              className="flex-shrink-0 ml-2"
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
