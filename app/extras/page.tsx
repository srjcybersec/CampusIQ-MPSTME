"use client";

import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart } from "lucide-react";

function ExtrasPageContent() {
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
            <h1 className="text-4xl font-bold text-white mb-2">Extras</h1>
            <p className="text-lg text-[#D4D4D8]">Experimental and optional features</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card variant="glass" interactive delay={0.1} className="group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EC4899] flex items-center justify-center glow-orange"
                    whileHover={{ scale: 1.1, rotate: 6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </motion.div>
                  Campus Connections
                  <span className="ml-2 px-2 py-1 text-xs font-medium text-[#D4D4D8] border border-[#222222] rounded-full bg-[#161616]/50">Experimental</span>
                </CardTitle>
                <CardDescription>
                  CGPA-based matchmaking for campus connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[#D4D4D8] mb-4">
                  Find friends or study buddies based on CGPA, branch, year, study style, and personality compatibility. Safe, ethical, and campus-appropriate.
                </p>
                <Button
                  variant="neon"
                  onClick={() => window.location.href = '/extras/matrimony'}
                  className="w-full"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  View Connections
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function ExtrasPage() {
  return (
    <ProtectedRoute>
      <ExtrasPageContent />
    </ProtectedRoute>
  );
}
