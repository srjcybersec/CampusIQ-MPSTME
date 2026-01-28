"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, UtensilsCrossed, Calendar, ExternalLink, Info } from "lucide-react";
import { CanteenMenu } from "@/components/campus/canteen-menu";

function CampusPageContent() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCanteenMenu, setShowCanteenMenu] = useState(false);
  const features = [
    {
      icon: MapPin,
      title: "Empty Space Finder",
      description: "Find available classrooms and study spaces based on your schedule",
      content: "Get intelligent suggestions for empty spaces based on time, schedule, and upcoming deadlines.",
      gradient: "from-[#22D3EE] to-[#A855F7]",
      glow: "glow-blue",
    },
    {
      icon: Calendar,
      title: "Library Discussion Room Booking",
      description: "Book library discussion rooms for group study sessions",
      content: "Check availability and book discussion rooms in the library.",
      gradient: "from-[#7C7CFF] to-[#38BDF8]",
      glow: "glow-purple",
    },
    {
      icon: UtensilsCrossed,
      title: "Canteen Menu",
      description: "Complete canteen menu with prices and categories",
      content: "Browse the full canteen menu with search and filter options.",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "glow-orange",
    },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">Campus</h1>
            <p className="text-lg text-[#D4D4D8]">Campus space and infrastructure intelligence</p>
          </motion.div>

          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card variant="glass" interactive delay={index * 0.1} className="group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <motion.div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center ${feature.glow}`}
                          whileHover={{ scale: 1.1, rotate: 6 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </motion.div>
                        {feature.title}
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#D4D4D8] mb-4">{feature.content}</p>
                      {feature.title === "Canteen Menu" ? (
                        <div className="space-y-4">
                          <Button 
                            onClick={() => setShowCanteenMenu(!showCanteenMenu)}
                            variant="neon"
                            className="w-full"
                          >
                            {showCanteenMenu ? "Hide Menu" : "View Full Menu"}
                          </Button>
                          
                          {showCanteenMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CanteenMenu />
                            </motion.div>
                          )}
                        </div>
                      ) : feature.title === "Library Discussion Room Booking" ? (
                        <div className="space-y-4">
                          <Button 
                            onClick={() => setShowBookingForm(!showBookingForm)}
                            variant="neon"
                            className="w-full"
                          >
                            {showBookingForm ? "Hide Booking Form" : "Book Discussion Room"}
                          </Button>
                          
                          {showBookingForm && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="p-4 bg-[#161616] border border-[#222222] rounded-lg space-y-3"
                            >
                              <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                  <a
                                    href="https://docs.google.com/forms/d/1RldPX-rQjO4pmL3AMS8uO8RLa8jnK3l9-8GQQSR-bXc/viewform?edit_requested=true"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors break-all"
                                  >
                                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                    <span className="underline">
                                      https://docs.google.com/forms/d/1RldPX-rQjO4pmL3AMS8uO8RLa8jnK3l9-8GQQSR-bXc/viewform?edit_requested=true
                                    </span>
                                  </a>
                                  <p className="text-sm text-[#D4D4D8] mt-3">
                                    After registering through the link above, please meet the library assistant at the circulation counter. They will open the discussion room doors for you.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <Button variant="outline" disabled>
                          {feature.title.includes("Empty Space") ? "Find Empty Spaces" : "View Availability"}
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

export default function CampusPage() {
  return (
    <ProtectedRoute>
      <CampusPageContent />
    </ProtectedRoute>
  );
}
