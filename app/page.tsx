"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";
import { FacultyDashboard } from "@/components/dashboards/faculty-dashboard";
import { BookOpen, Calendar, MapPin, FolderOpen, Users, Settings, Sparkles, GraduationCap } from "lucide-react";

export default function Home() {
  const { userRole } = useAuth();

  const features = [
    { 
      href: "/academics", 
      label: "Academics", 
      icon: BookOpen, 
      description: "Track attendance, view results, understand examination policies, and get AI-powered academic assistance. Features include attendance calculator, result analyzer, and policy Q&A.",
      gradient: "from-[#3b82f6] to-[#6366f1]"
    },
    { 
      href: "/schedule", 
      label: "Schedule", 
      icon: Calendar, 
      description: "Upload your timetable, view your weekly schedule, and get smart reminders for upcoming classes. Manage your academic calendar with ease.",
      gradient: "from-[#3b82f6] to-[#60a5fa]"
    },
    { 
      href: "/campus", 
      label: "Campus", 
      icon: MapPin, 
      description: "Find empty spaces, book library discussion rooms, browse canteen menu, and order food online. Complete campus infrastructure intelligence at your fingertips.",
      gradient: "from-[#6366f1] to-[#8b5cf6]"
    },
    { 
      href: "/resources", 
      label: "Resources", 
      icon: FolderOpen, 
      description: "Access notes, manage assignments, browse PYQ papers with AI solver, and download study materials. Your complete academic resource hub.",
      gradient: "from-[#10b981] to-[#14b8a6]"
    },
    { 
      href: "/community", 
      label: "Community", 
      icon: Users, 
      description: "View campus events, participate in discussions, and stay connected with the MPSTME community. Engage with fellow students and faculty.",
      gradient: "from-[#6366f1] to-[#a855f7]"
    },
    { 
      href: "/services", 
      label: "Services", 
      icon: Settings, 
      description: "Access administrative services, manage your profile, and configure app settings. Streamlined administrative processes made simple.",
      gradient: "from-[#3b82f6] to-[#6366f1]"
    },
    { 
      href: "/extras", 
      label: "Extras", 
      icon: Sparkles, 
      description: "Explore experimental features and additional tools. Discover new functionalities and special features designed to enhance your campus experience.",
      gradient: "from-[#10b981] to-[#34d399]"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        
        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 relative z-10 max-w-full">
          <div className="max-w-7xl mx-auto w-full">
            {/* Role-Based Dashboard */}
            {userRole === "student" && <StudentDashboard />}
            {userRole === "faculty" && <FacultyDashboard />}
            {!userRole && (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-block">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-[#3b82f6] to-[#6366f1] rounded-2xl flex items-center justify-center shadow-lg-modern mx-auto mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <GraduationCap className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-[#a3a3a3]">Loading your dashboard...</p>
                </div>
              </motion.div>
            )}

            {/* Features Grid - Cinematic */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.href}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Link href={feature.href}>
                      <Card
                        variant="glass"
                        interactive
                        delay={index * 0.05}
                        className="h-full relative overflow-hidden group"
                      >
                        <CardHeader className="relative z-10">
                          <motion.div
                            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md-modern`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Icon className="w-7 h-7 text-white" />
                          </motion.div>
                          <CardTitle className="text-xl font-semibold mb-2 text-white group-hover:text-[#3b82f6] transition-colors duration-300">
                            {feature.label}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed">
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                        
                        {/* Subtle bottom accent */}
                        <motion.div
                          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} rounded-b-2xl`}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                          style={{ originX: 0 }}
                        />
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
