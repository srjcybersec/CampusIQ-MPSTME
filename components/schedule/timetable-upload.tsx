"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, FileText, Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { motion } from "framer-motion";
import { extractTimetableFromImage } from "@/lib/schedule/extract-timetable-client";
import { authedFetch } from "@/lib/auth/authed-fetch";

const COMMON_BATCHES = ["K1", "K2", "K3", "K4"];

const PROGRESS_STEPS = [
  "Preparing your photo...",
  "AI is reading your timetable grid...",
  "Detecting subjects, rooms and faculty...",
  "Separating batch-wise classes...",
  "Saving your schedule...",
];

/** Resize/compress images client-side so Gemini finishes within Vercel's time limit */
async function prepareFileForUpload(file: File): Promise<{ base64: string; mimeType: string }> {
  if (file.type === "application/pdf") {
    const base64 = await readFileAsBase64(file);
    return { base64, mimeType: file.type };
  }

  const bitmap = await createImageBitmap(file);
  const maxDim = 800;
  let { width, height } = bitmap;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image compression failed"))), "image/jpeg", 0.65);
  });

  const base64 = await readFileAsBase64(blob);
  return { base64, mimeType: "image/jpeg" };
}

function readFileAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function parseApiResponse(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    if (response.status === 504 || response.status === 502) {
      throw new Error(
        "Saving took too long. Your timetable may have been read — please refresh and try again."
      );
    }
    throw new Error(
      raw.startsWith("An error")
        ? "Server error while processing your timetable. Please try again with a smaller/clearer photo."
        : `Server error (${response.status}). Please try again.`
    );
  }
}

export function TimetableUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [batch, setBatch] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    entriesExtracted?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Elapsed-time counter + rotating progress messages during extraction
  useEffect(() => {
    if (!isUploading) {
      setElapsed(0);
      setStepIndex(0);
      setAiStatus(null);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const secs = (Date.now() - start) / 1000;
      setElapsed(secs);
      // Advance step roughly every 4 seconds, capping before the final "saving" step
      setStepIndex(Math.min(Math.floor(secs / 4), PROGRESS_STEPS.length - 1));
    }, 100);
    return () => clearInterval(timer);
  }, [isUploading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileIsImage = selectedFile.type.startsWith("image/");
    const fileIsPdf = selectedFile.type === "application/pdf";

    if (!fileIsImage && !fileIsPdf) {
      setUploadStatus({
        success: false,
        message: "Please upload an image (JPG, PNG, WebP) or a PDF of your timetable",
      });
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadStatus({
        success: false,
        message: "File size must be less than 10MB",
      });
      return;
    }

    setFile(selectedFile);
    setIsPdf(fileIsPdf);
    setUploadStatus(null);

    if (fileIsImage) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      // PDFs have no inline image preview; show a placeholder instead
      setPreview("pdf");
    }
  };

  const handleUpload = async () => {
      if (!file || !user) {
      setUploadStatus({
        success: false,
        message: "Please select a file and ensure you're logged in",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const { base64, mimeType } = await prepareFileForUpload(file);
      setStepIndex(1);

      // Run Gemini in the browser — no Vercel timeout on the slow AI step
      const extractedEntries = await extractTimetableFromImage(base64, mimeType, (msg) => {
        setAiStatus(msg);
      }, user.uid);

      setStepIndex(4);
      const response = await authedFetch("/api/schedule/save-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: extractedEntries,
          userId: user.uid,
          batch: batch.trim() || undefined,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      if (data.success) {
        const batchNote =
          data.availableBatches && data.availableBatches.length > 0
            ? ` Detected batches: ${data.availableBatches.join(", ")}.`
            : "";
        setUploadStatus({
          success: true,
          message: `Successfully extracted ${data.entriesCount} schedule entries!${batchNote}`,
          entriesExtracted: data.entriesCount,
        });
        // Clear file after successful upload
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Reload page after 1.5 seconds to show new schedule
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || "Failed to process timetable");
      }
    } catch (error: any) {
      console.error("Error uploading timetable:", error);
      setUploadStatus({
        success: false,
        message: error.message || "Failed to process timetable. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Full-card loading screen shown while the AI extracts the timetable
  if (isUploading) {
    return (
      <Card variant="glass" className="relative z-10">
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#38BDF8] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Building your schedule</h3>
            <motion.p
              key={aiStatus || stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[#D4D4D8] mb-6 min-h-[20px]"
            >
              {aiStatus || PROGRESS_STEPS[stepIndex]}
            </motion.p>

            <p className="text-xs text-[#6b6b6b] mb-4">
              This can take 30–90 seconds for dense timetables. Please keep this tab open.
            </p>

            {/* Indeterminate progress bar */}
            <div className="w-full h-2 bg-[#161616] rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-[#22D3EE] to-[#38BDF8]"
                initial={{ width: "5%" }}
                animate={{ width: `${Math.min(15 + elapsed * 6, 95)}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            <p className="text-xs text-[#6b6b6b]">
              {elapsed.toFixed(1)}s elapsed — this usually takes 10 to 25 seconds. Please keep this tab open.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          Upload Your Timetable
        </CardTitle>
        <CardDescription>
          Upload an image or PDF of your timetable and we&apos;ll automatically extract your schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#3a3a3a] transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-[#6b6b6b]" />
              <p className="text-sm text-[#a0a0a0] mb-4">
                Upload a clear image or PDF of your timetable
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="timetable-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
            <p className="text-xs text-[#6b6b6b] text-center">
              Supported: JPG, PNG, WebP, PDF (Max 10MB). Use a clear, well-lit photo of the full timetable.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#111111]">
              {isPdf ? (
                <div className="flex items-center gap-3 p-6">
                  <FileText className="w-10 h-10 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file?.name}</p>
                    <p className="text-xs text-[#6b6b6b]">PDF ready to extract</p>
                  </div>
                </div>
              ) : (
                preview && (
                  <Image
                    src={preview}
                    alt="Timetable preview"
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-96 object-contain"
                    unoptimized
                  />
                )
              )}
            </div>

            {/* Batch picker */}
            <div className="p-4 rounded-lg border border-[#2a2a2a] bg-[#111111]">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-medium text-white">Which batch are you in?</p>
              </div>
              <p className="text-xs text-[#6b6b6b] mb-3">
                Many timetables split classes between batches (like K1 and K2). Tell us yours and we&apos;ll show only the classes you need to attend. You can change this later.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_BATCHES.map((b) => (
                  <Button
                    key={b}
                    type="button"
                    size="sm"
                    variant={batch.toUpperCase() === b ? "default" : "outline"}
                    onClick={() => setBatch(batch.toUpperCase() === b ? "" : b)}
                  >
                    {b}
                  </Button>
                ))}
              </div>
              <Input
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="Or type your batch (e.g. K1, A2). Leave blank to show all."
                className="bg-[#161616] border-[#222222] text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setIsPdf(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                Change File
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                variant="default"
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Extract Schedule
              </Button>
            </div>
          </div>
        )}

        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${
              uploadStatus.success
                ? "bg-green-500/20 border-green-500/50"
                : "bg-red-500/20 border-red-500/50"
            }`}
          >
            <div className="flex items-start gap-3">
              {uploadStatus.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    uploadStatus.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {uploadStatus.message}
                </p>
                {uploadStatus.success && uploadStatus.entriesExtracted && (
                  <p className="text-xs text-green-300 mt-1">
                    Your schedule has been updated. The page will refresh shortly.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
