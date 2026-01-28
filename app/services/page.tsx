"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train, ExternalLink, BookOpen, GraduationCap, Map, Shield, PenTool } from "lucide-react";

function ServicesPageContent() {
  const [showLinks, setShowLinks] = useState<Record<string, boolean>>({});
  
  const toggleLink = (serviceTitle: string) => {
    setShowLinks(prev => ({ ...prev, [serviceTitle]: !prev[serviceTitle] }));
  };

  const services = [
    {
      icon: Train,
      title: "Railway Concession Form",
      description: "Apply for railway concession forms online",
      content: "Fill out the railway concession form online and collect it from the admin department.",
      buttonText: "Access Railway Concession Form",
      linkText: "Access Railway Concession Form",
      note: "After filling up the form, please report to the admin department on the 1st floor within a couple of days to collect your railway concession form. The form will be available for collection as per the selected date and time on the form.",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-blue",
      link: "https://concession.mpst.me/",
    },
    {
      icon: BookOpen,
      title: "Library OPAC",
      description: "Online Public Access Catalog for library resources",
      content: "Search and access library books, journals, and digital resources through the online catalog system.",
      buttonText: "Access Library OPAC",
      linkText: "Access Library OPAC",
      note: "Use your college credentials to log in and search for books, journals, and other library resources. You can check availability, reserve books, and access digital materials.",
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-purple",
      link: "http://library.svkm.ac.in/",
    },
    {
      icon: GraduationCap,
      title: "Student Portal",
      description: "Access your student information and academic records",
      content: "View your academic records, grades, attendance, and other student services through the official student portal.",
      buttonText: "Access Student Portal",
      linkText: "Access Student Portal",
      note: "Log in using your SAP ID and password to access your academic records, view grades, check attendance, download certificates, and access other student services.",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-blue",
      link: "https://portal.svkm.ac.in/usermgmt/login",
    },
    {
      icon: Map,
      title: "MapMyAccess",
      description: "Campus navigation and accessibility mapping",
      content: "Navigate the campus and find accessible routes and facilities using the interactive campus map.",
      buttonText: "Access MapMyAccess",
      linkText: "Access MapMyAccess",
      note: "Explore the campus map to find buildings, classrooms, accessible routes, parking areas, and other facilities. The map helps you navigate efficiently and find the best accessible paths.",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "glow-orange",
      link: "https://svkm.mapmyaccess.com/",
    },
    {
      icon: Shield,
      title: "Copyleaks",
      description: "AI content detection and plagiarism checking",
      content: "Check your documents for AI-generated content and plagiarism to ensure academic integrity.",
      buttonText: "Access Copyleaks",
      linkText: "Access Copyleaks",
      note: "Use Copyleaks to detect AI-generated content and check for plagiarism in your assignments and research papers. The tool helps maintain academic integrity and ensures originality in your work.",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-blue",
      link: "https://copyleaks.com/ai-content-detector",
    },
    {
      icon: PenTool,
      title: "Grammarly",
      description: "Writing assistance and grammar checking",
      content: "Improve your writing with real-time grammar, spelling, and style suggestions.",
      buttonText: "Access Grammarly",
      linkText: "Access Grammarly",
      note: "Enhance your writing with Grammarly's AI-powered writing assistant. Get real-time suggestions for grammar, spelling, clarity, and style to make your documents more professional and error-free.",
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-purple",
      link: "https://www.grammarly.com/",
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
            <h1 className="text-4xl font-bold text-white mb-2">Services</h1>
            <p className="text-lg text-[#D4D4D8]">Administrative and student services</p>
          </motion.div>

          <div className="space-y-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card variant="glass" interactive delay={index * 0.1} className="group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <motion.div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center ${service.glow}`}
                          whileHover={{ scale: 1.1, rotate: 6 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </motion.div>
                        {service.title}
                      </CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#D4D4D8] mb-4">{service.content}</p>
                      {service.link ? (
                        <div className="space-y-3">
                          {!showLinks[service.title] ? (
                            <Button
                              variant="neon"
                              onClick={() => toggleLink(service.title)}
                            >
                              {service.buttonText}
                            </Button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-3"
                            >
                              <a
                                href={service.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 underline transition-colors"
                              >
                                <span>{service.linkText}</span>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {service.note && (
                                <p className="text-sm text-[#A1A1AA] mt-2">
                                  <span className="font-semibold text-white">Note:</span> {service.note}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <Button variant="outline" disabled>
                          Submit Request
                        </Button>
                      )}
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

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <ServicesPageContent />
    </ProtectedRoute>
  );
}
