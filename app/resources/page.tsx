"use client";

import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, BookOpen, CheckCircle } from "lucide-react";

function ResourcesPageContent() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Resources</h1>
          <p className="text-neutral-600 mb-8">Academic resources and collaboration</p>

          {/* Notes Uploader */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Notes Uploader
              </CardTitle>
              <CardDescription>
                Upload, browse, and rate study materials with AI-powered summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Upload notes by subject, get AI summaries, ask questions, and discover top-rated study materials from toppers.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/resources/notes"}
              >
                Browse Notes
              </Button>
            </CardContent>
          </Card>

          {/* Assignment Management */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Assignment Management
              </CardTitle>
              <CardDescription>
                Track assignment submissions and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Keep track of all your assignments with submission status and reminders.
              </p>
              <Button variant="outline" disabled>
                View Assignments
              </Button>
            </CardContent>
          </Card>

          {/* PYQ Repository */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Previous Year Questions Repository
              </CardTitle>
              <CardDescription>
                Access and analyze previous year question papers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Browse PYQs by subject, analyze topics, repetition trends, and difficulty patterns with AI.
              </p>
              <Button variant="outline" disabled>
                Browse PYQs
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesPageContent />
    </ProtectedRoute>
  );
}
