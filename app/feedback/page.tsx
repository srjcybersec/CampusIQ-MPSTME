"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { BetaFeedbackForm } from "@/components/feedback/beta-feedback-form";
import { MessageSquarePlus } from "lucide-react";

function FeedbackPageContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="max-w-2xl mx-auto space-y-6">
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
                <MessageSquarePlus className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Beta Feedback</h1>
            </div>
            <p className="text-[#D4D4D8] max-w-xl mx-auto text-sm sm:text-base">
              You&apos;re helping shape CampusIQ. Report bugs, suggest features, or tell us what&apos;s working well —
              it all lands in our team inbox via Firebase.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Suspense fallback={<div className="text-[#D4D4D8] text-center py-8">Loading form...</div>}>
              <BetaFeedbackForm />
            </Suspense>
          </motion.div>

          <p className="text-center text-xs text-[#6b6b6b]">
            Submissions are private — only the CampusIQ team can read them in Firebase Console.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackPageContent />
    </ProtectedRoute>
  );
}
