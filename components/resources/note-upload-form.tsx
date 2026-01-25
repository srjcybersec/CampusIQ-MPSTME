"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, CheckCircle, X, AlertCircle } from "lucide-react";
import {
  Subject,
  Semester,
  Difficulty,
  ExamType,
} from "@/lib/types/notes";
import { uploadNote } from "@/lib/firebase/notes";
import { getUserProfile } from "@/lib/firebase/user-profile";

const SUBJECTS: Subject[] = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Operating Systems",
  "Networks",
  "Software Engineering",
  "Web Development",
  "Machine Learning",
  "Other",
];

const SEMESTERS: Semester[] = ["1", "2", "3", "4", "5", "6", "7", "8"];

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const EXAM_TYPES: ExamType[] = [
  "Midterm",
  "Final",
  "Quiz",
  "Assignment",
  "Lab",
  "Project",
  "Other",
];

interface NoteUploadFormProps {
  onSuccess?: () => void;
}

export function NoteUploadForm({ onSuccess }: NoteUploadFormProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<Subject>("Computer Science");
  const [semester, setSemester] = useState<Semester>("1");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [examType, setExamType] = useState<ExamType>("Midterm");
  const [professor, setProfessor] = useState("");
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) {
      setError("Please select a file and ensure you're logged in");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Step 1: Upload file via API route (server-side to avoid CORS)
      setUploadProgress(10);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.uid);

      const uploadResponse = await fetch("/api/notes/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload response:", {
        fileName: uploadData.fileName,
        extractedTextLength: uploadData.extractedText?.length || 0,
        hasExtractedText: !!uploadData.extractedText
      });
      setUploadProgress(50);

      // Step 2: Get AI summary using extracted text from the file
      let aiSummary = "";
      let keyTopics: string[] = [];
      
      // Use extracted text if available, otherwise fall back to title/description
      const fileContent = uploadData.extractedText || "";
      
      if (fileContent || title || description) {
        try {
          const summaryResponse = await fetch("/api/notes/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              title,
              description: description || "",
              fileContent: fileContent, // Use extracted text from the file
            }),
          });

          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            aiSummary = summaryData.summary || "";
            keyTopics = Array.isArray(summaryData.keyTopics) ? summaryData.keyTopics : [];
          }
        } catch (summaryError) {
          console.warn("AI summarization failed, continuing without it:", summaryError);
        }
      }

      setUploadProgress(70);

      // Step 3: Get user profile for CGPA and name
      const userProfile = await getUserProfile(user.uid);
      // Get uploader name: prefer displayName from Firebase Auth, then email username
      let uploaderName: string | undefined = undefined;
      if (!isAnonymous) {
        if (user.displayName) {
          uploaderName = user.displayName;
        } else if (user.email) {
          // Extract username from email (part before @)
          uploaderName = user.email.split("@")[0];
        } else if (userProfile?.email) {
          uploaderName = userProfile.email.split("@")[0];
        } else {
          uploaderName = "User"; // Fallback
        }
      }

      // Step 4: Check for Topper badge (CGPA >= 3.5 on 4.0 scale)
      // We'll need to get CGPA from user profile or matrimony profile
      let hasTopperBadge = false;
      let uploaderCGPA: number | undefined = undefined;
      
      // Try to get CGPA from matrimony profile if available
      try {
        const { getProfile } = await import("@/lib/firebase/matrimony");
        const matrimonyProfile = await getProfile(user.uid);
        if (matrimonyProfile?.cgpa) {
          uploaderCGPA = matrimonyProfile.cgpa;
          // Topper badge for CGPA >= 3.5 (4.0 scale)
          hasTopperBadge = matrimonyProfile.cgpa >= 3.5;
        }
      } catch {
        // No matrimony profile, skip badge
      }

      setUploadProgress(85);

      // Step 5: Create note document in Firestore
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await uploadNote({
        title,
        description: description || undefined,
        fileUrl: uploadData.fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploaderId: user.uid,
        uploaderName,
        isAnonymous,
        subject,
        semester,
        difficulty,
        examType,
        professor: professor || undefined,
        tags: tagArray,
        hasTopperBadge,
        uploaderCGPA,
        aiSummary: aiSummary || undefined,
        keyTopics: Array.isArray(keyTopics) && keyTopics.length > 0 ? keyTopics : undefined,
        extractedText: uploadData.extractedText || undefined, // Store extracted text for Q&A
      });

      setUploadProgress(100);
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        setFile(null);
        setTitle("");
        setDescription("");
        setProfessor("");
        setTags("");
        setIsAnonymous(false);
        setSuccess(false);
        setUploadProgress(0);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error("Error uploading note:", err);
      setError(err.message || "Failed to upload note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Study Material
        </CardTitle>
        <CardDescription>
          Share your notes, assignments, and study materials with the campus community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              File *
            </label>
            <div className="border-2 border-dashed border-[#222222] rounded-lg p-6 text-center hover:border-[#333333] transition-colors bg-[#161616]">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.pptx,.xlsx"
                disabled={isSubmitting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="w-8 h-8 text-[#D4D4D8]" />
                {file ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-red-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-[#D4D4D8]">
                    Click to upload or drag and drop
                  </span>
                )}
                <span className="text-xs text-[#D4D4D8]">
                  PDF, DOC, DOCX, TXT, PPTX, XLSX (Max 50MB)
                </span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Data Structures Midterm Notes"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#161616] text-white placeholder:text-[#D4D4D8]"
              rows={3}
              placeholder="Brief description of the material..."
              disabled={isSubmitting}
            />
          </div>

          {/* Tags Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#161616] text-white"
                required
                disabled={isSubmitting}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} className="bg-[#161616] text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#161616] text-white"
                required
                disabled={isSubmitting}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s} className="bg-[#161616] text-white">
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Difficulty *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#161616] text-white"
                required
                disabled={isSubmitting}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="bg-[#161616] text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Exam Type *
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full px-4 py-2 border border-[#222222] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#161616] text-white"
                required
                disabled={isSubmitting}
              >
                {EXAM_TYPES.map((e) => (
                  <option key={e} value={e} className="bg-[#161616] text-white">
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Professor and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Professor (Optional)
              </label>
              <Input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="e.g., Dr. John Smith"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tags (Optional)
              </label>
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., algorithms, sorting, trees (comma-separated)"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Anonymous Upload */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-[#222222] rounded focus:ring-blue-500 bg-[#161616]"
              disabled={isSubmitting}
            />
            <label htmlFor="anonymous" className="text-sm text-white">
              Upload anonymously
            </label>
          </div>

          {/* Progress Bar */}
          {isSubmitting && uploadProgress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-[#D4D4D8] mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#222222] rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Note uploaded successfully!</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Note
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
