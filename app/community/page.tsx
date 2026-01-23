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
          <Card className="shadow-premium hover:shadow-glow-hover transition-all duration-300">
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
                Share your thoughts anonymously. Post confessions in categories like Unsent Messages, College Truths, Almost Confessed, Guilty Pleasures, and Gratitude Notes. All content is moderated for safety.
              </p>
              <div className="space-y-2 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-neutral-700 italic">
                    &quot;The library is so peaceful during exam season. Best study spot!&quot;
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">— Gratitude Notes</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                  <p className="text-sm text-neutral-700 italic">
                    &quot;Anyone else struggling with the Data Structures assignment? Let&apos;s form a study group!&quot;
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">— College Truths</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/community/confessions'}
                className="w-full min-h-[40px] px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-premium hover:shadow-glow-hover hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
              >
                View & Post Confessions
              </button>
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
