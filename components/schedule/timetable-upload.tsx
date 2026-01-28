"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { motion } from "framer-motion";

export function TimetableUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    entriesExtracted?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type - only images allowed
    if (!selectedFile.type.startsWith("image/")) {
      setUploadStatus({
        success: false,
        message: "Please upload an image file (JPG, PNG, WebP)",
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
    setUploadStatus(null);

    // Create preview for image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
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
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload and process timetable
      const response = await fetch("/api/schedule/upload-timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type,
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus({
          success: true,
          message: `Successfully extracted ${data.entriesCount} schedule entries from your timetable!`,
          entriesExtracted: data.entriesCount,
        });
        // Clear file after successful upload
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Reload page after 2 seconds to show new schedule
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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

  return (
    <Card variant="glass" className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          Upload Your Timetable
        </CardTitle>
        <CardDescription>
          Upload an image of your timetable and we'll automatically extract your schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#3a3a3a] transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-[#6b6b6b]" />
              <p className="text-sm text-[#a0a0a0] mb-4">
                Upload a clear image of your timetable
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
              Supported formats: JPG, PNG, WebP (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#111111]">
              <img
                src={preview || undefined}
                alt="Timetable preview"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
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
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Extract Schedule
                  </>
                )}
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
