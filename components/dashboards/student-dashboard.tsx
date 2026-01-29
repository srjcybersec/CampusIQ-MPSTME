"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export function StudentDashboard() {
  const { user } = useAuth();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Premium Welcome Card - Sci-Fi Style */}
      <motion.div
        className="relative bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#2563eb] rounded-xl p-8 md:p-12 text-white shadow-elevated overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-xl shadow-2xl border border-white/20"
            transition={{ duration: 0.3 }}
          >
            <GraduationCap className="w-8 h-8 md:w-10 md:h-10" />
          </motion.div>
          <div className="flex-1 min-w-0 w-full">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight break-words overflow-wrap-anywhere"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="block">Welcome Back</span>
              {user?.email && (
                <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl mt-1 truncate max-w-full">
                  {user.email}
                </span>
              )}
              <span className="inline-block ml-1">👋</span>
            </motion.h2>
            <motion.p
              className="text-white/80 text-base sm:text-lg md:text-xl leading-relaxed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Your academic command center at MPSTME
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
