"use client";

import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, BookOpen, CheckCircle } from "lucide-react";

function ResourcesPageContent() {
  const resources = [
    {
      icon: Upload,
      title: "Notes Uploader",
      description: "Upload, browse, and rate study materials with AI-powered summaries",
      content: "Upload notes by subject, get AI summaries, ask questions, and discover top-rated study materials from toppers.",
      href: "/resources/notes",
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-purple",
    },
    {
      icon: CheckCircle,
      title: "Assignment Management",
      description: "Sync from Microsoft Teams or create manually. Track deadlines, submissions, and get smart reminders.",
      content: "Automatically sync assignments from Microsoft Teams, track submission status, get reminders, and monitor your assignment health score.",
      href: "/resources/assignments",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "glow-orange",
    },
    {
      icon: BookOpen,
      title: "Previous Year Questions Repository",
      description: "Access and download previous year question papers",
      content: "Browse PYQs by branch, semester, and subject. Download PDFs organized by course structure.",
      href: "/resources/pyqs",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-blue",
      disabled: false,
    },
  ];

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
            <h1 className="text-4xl font-bold text-white mb-2">Resources</h1>
            <p className="text-lg text-[#D4D4D8]">Academic resources and collaboration</p>
          </motion.div>

          <div className="space-y-6">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <motion.div
                  key={resource.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card variant="glass" interactive delay={index * 0.1} className="group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <motion.div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${resource.gradient} flex items-center justify-center ${resource.glow}`}
                          whileHover={{ scale: 1.1, rotate: 6 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </motion.div>
                        {resource.title}
                      </CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#D4D4D8] mb-4">{resource.content}</p>
                      <Button
                        variant="outline"
                        onClick={() => !resource.disabled && (window.location.href = resource.href)}
                        disabled={resource.disabled}
                        data-cursor-hover
                      >
                        {resource.disabled ? "Coming Soon" : resource.title.includes("Notes") ? "Browse Notes" : resource.title.includes("Previous Year Questions") || resource.title.includes("PYQ") ? "Access PYQ Papers" : "View Assignments"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesPageContent />
    </ProtectedRoute>
  );
}
