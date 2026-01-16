"use client";

import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare } from "lucide-react";

function CommunityPageContent() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Community</h1>
          <p className="text-neutral-600 mb-8">Campus culture and engagement</p>

          {/* Live Event Discovery */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Live Event Discovery
              </CardTitle>
              <CardDescription>
                Discover upcoming campus events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Find workshops, seminars, cultural events, and more happening on campus.
              </p>
              <Button variant="outline" disabled>
                View Events
              </Button>
            </CardContent>
          </Card>

          {/* Confessions Page */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Confessions
              </CardTitle>
              <CardDescription>
                Anonymous campus confessions and discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Share your thoughts anonymously. Content moderation hooks are in place for safe discussions.
              </p>
              <div className="space-y-2 mb-4">
                <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                  <p className="text-sm text-neutral-700">
                    "The library is so peaceful during exam season. Best study spot!"
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                  <p className="text-sm text-neutral-700">
                    "Anyone else struggling with the Data Structures assignment? Let's form a study group!"
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Post Confession
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityPageContent />
    </ProtectedRoute>
  );
}
