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
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-purple"
    },
    { 
      href: "/schedule", 
      label: "Schedule", 
      icon: Calendar, 
      description: "Upload your timetable, view your weekly schedule, and get smart reminders for upcoming classes. Manage your academic calendar with ease.",
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-blue"
    },
    { 
      href: "/campus", 
      label: "Campus", 
      icon: MapPin, 
      description: "Find empty spaces, book library discussion rooms, browse canteen menu, and order food online. Complete campus infrastructure intelligence at your fingertips.",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-blue"
    },
    { 
      href: "/resources", 
      label: "Resources", 
      icon: FolderOpen, 
      description: "Access notes, manage assignments, browse PYQ papers with AI solver, and download study materials. Your complete academic resource hub.",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "glow-orange"
    },
    { 
      href: "/community", 
      label: "Community", 
      icon: Users, 
      description: "View campus events, participate in discussions, and stay connected with the MPSTME community. Engage with fellow students and faculty.",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-pink"
    },
    { 
      href: "/services", 
      label: "Services", 
      icon: Settings, 
      description: "Access administrative services, manage your profile, and configure app settings. Streamlined administrative processes made simple.",
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-purple"
    },
    { 
      href: "/extras", 
      label: "Extras", 
      icon: Sparkles, 
      description: "Explore experimental features and additional tools. Discover new functionalities and special features designed to enhance your campus experience.",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "glow-orange"
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple mx-auto mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <GraduationCap className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-[#D4D4D8]">Loading your dashboard...</p>
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
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Link href={feature.href} >
                      <Card
                        variant="glass"
                        interactive
                        delay={index * 0.1}
                        className="h-full relative overflow-hidden group"
                      >
                        {/* Gradient glow on hover */}
                        <motion.div
                          className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10`}
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
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-xl ${feature.glow}`}
                            whileHover={{ scale: 1.1, rotate: 6 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Icon className="w-8 h-8 text-white" />
                          </motion.div>
                          <CardTitle className="text-2xl group-hover:gradient-text-purple transition-all duration-300 font-bold mb-1">
                            {feature.label}
                          </CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                        
                        {/* Bottom accent line */}
                        <motion.div
                          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-b-2xl`}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.5 }}
                          style={{ originX: 0 }}
                        />
                        
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
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
