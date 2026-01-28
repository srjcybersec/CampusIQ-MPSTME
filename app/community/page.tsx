"use client";

import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare } from "lucide-react";

function CommunityPageContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">Community</h1>
            <p className="text-lg text-[#D4D4D8]">Campus culture and engagement</p>
          </motion.div>

          {/* Live Event Discovery */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card variant="glass" interactive delay={0.1}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center glow-blue"
                    whileHover={{ scale: 1.1, rotate: 6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Calendar className="w-6 h-6 text-white" />
                  </motion.div>
                  Live Event Discovery
                </CardTitle>
                <CardDescription>
                  Discover upcoming campus events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[#D4D4D8] mb-4">
                  Find workshops, seminars, cultural events, and more happening on campus.
                </p>
                <Button 
                  variant="neon" 
                  onClick={() => window.location.href = '/community/events'}
                  className="w-full"
                >
                  View Events
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Confessions Page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card variant="glass" interactive delay={0.2} className="group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C7CFF] to-[#38BDF8] flex items-center justify-center glow-purple"
                    whileHover={{ scale: 1.1, rotate: 6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MessageSquare className="w-6 h-6 text-white" />
                  </motion.div>
                  Confessions
                </CardTitle>
                <CardDescription>
                  Anonymous campus confessions and discussions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[#D4D4D8] mb-4">
                  Share your thoughts anonymously. Post confessions in categories like Unsent Messages, College Truths, Almost Confessed, Guilty Pleasures, and Gratitude Notes. All content is moderated for safety.
                </p>
                <div className="space-y-2 mb-4">
                  <motion.div
                    className="p-3 glass border border-[#7C7CFF]/30 rounded-lg"
                    whileHover={{ scale: 1.02, borderColor: "rgba(124, 124, 255, 0.5)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm text-white italic">
                      &quot;The library is so peaceful during exam season. Best study spot!&quot;
                    </p>
                    <p className="text-xs text-[#D4D4D8] mt-1">— Gratitude Notes</p>
                  </motion.div>
                  <motion.div
                    className="p-3 glass border border-[#EC4899]/30 rounded-lg"
                    whileHover={{ scale: 1.02, borderColor: "rgba(236, 72, 153, 0.5)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm text-white italic">
                      &quot;Anyone else struggling with the Data Structures assignment? Let&apos;s form a study group!&quot;
                    </p>
                    <p className="text-xs text-[#D4D4D8] mt-1">— College Truths</p>
                  </motion.div>
                </div>
                <Button
                  variant="default"
                  onClick={() => window.location.href = '/community/confessions'}
                  className="w-full"
                >
                  View & Post Confessions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
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
