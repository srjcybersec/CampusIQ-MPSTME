"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, BarChart3, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export function FacultyDashboard() {
  const { user } = useAuth();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Modern Welcome Card */}
      <motion.div
        className="relative glass-card p-8 md:p-10 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 via-transparent to-[#8b5cf6]/10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl flex items-center justify-center shadow-lg-modern"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0 w-full">
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 tracking-tight text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Welcome Back
            </motion.h2>
            {user?.email && (
              <motion.p
                className="text-lg sm:text-xl md:text-2xl text-[#a3a3a3] mb-3 truncate max-w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {user.email}
              </motion.p>
            )}
            <motion.p
              className="text-base sm:text-lg text-[#737373] leading-relaxed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Manage your classes and students
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
