"use client";

import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ConfessionForm } from "@/components/community/confession-form";
import { ConfessionFeed } from "@/components/community/confession-feed";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

function ConfessionsPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConfessionPosted = () => {
    // Trigger refresh of feed
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-neutral-900">Confessions</h1>
            </div>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Share your thoughts anonymously. All confessions are moderated to ensure a safe and respectful environment.
            </p>
          </div>

          {/* Post Form */}
          <ConfessionForm onSuccess={handleConfessionPosted} />

          {/* Feed */}
          <div key={refreshKey}>
            <ConfessionFeed />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfessionsPage() {
  return (
    <ProtectedRoute>
      <ConfessionsPageContent />
    </ProtectedRoute>
  );
}
