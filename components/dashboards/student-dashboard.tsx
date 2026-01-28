"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export function StudentDashboard() {
  const { user } = useAuth();
  const quickActions = [
    { 
      href: "/academics", 
      label: "Academics", 
      icon: BookOpen, 
      gradient: "from-[#2563eb] to-[#3b82f6]"
    },
    { 
      href: "/schedule", 
      label: "Schedule", 
      icon: Calendar, 
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-blue"
    },
    { 
      href: "/extras", 
      label: "Extras", 
      icon: Sparkles, 
      gradient: "from-[#6366f1] to-[#14b8a6]"
    },
  ];

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

      {/* Quick Actions - Floating Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <Link href={action.href}>
                <Card
                  variant="glass"
                  interactive
                  delay={index * 0.1}
                  className="h-full relative overflow-hidden group"
                >
                  {/* Gradient glow on hover */}
                  <motion.div
                    className={`absolute -inset-1 bg-gradient-to-br ${action.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10`}
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                  
                  <CardHeader className="relative z-10">
                    <motion.div
                      className={`w-20 h-20 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-5 shadow-professional`}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl group-hover:gradient-text-purple transition-all duration-300 font-bold mb-1">
                      {action.label}
                    </CardTitle>
                    <CardDescription className="text-base">Quick access</CardDescription>
                  </CardHeader>
                  
                  {/* Bottom accent */}
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${action.gradient} rounded-b-2xl`}
                    initial={{ scaleX: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ originX: 0 }}
                  />
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
