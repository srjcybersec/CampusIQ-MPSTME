"use client";

import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C7CFF] to-[#38BDF8] flex items-center justify-center glow-purple"
                whileHover={{ scale: 1.1, rotate: 6 }}
                transition={{ duration: 0.3 }}
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white">Confessions</h1>
            </div>
            <p className="text-[#D4D4D8] max-w-2xl mx-auto">
              Share your thoughts anonymously. All confessions are moderated to ensure a safe and respectful environment.
            </p>
          </motion.div>

          {/* Post Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ConfessionForm onSuccess={handleConfessionPosted} />
          </motion.div>

          {/* Feed */}
          <motion.div
            key={refreshKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ConfessionFeed />
          </motion.div>
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
