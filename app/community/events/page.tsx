"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, ArrowLeft } from "lucide-react";
import Image from "next/image";

function EventsPageContent() {
  const [showLinks, setShowLinks] = useState<Record<string, boolean>>({});
  
  const toggleLink = (eventId: string) => {
    setShowLinks(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const events = [
    {
      id: "event-1",
      title: "The Security Keynote",
      image: "/events/event1.jpg", // Place image file named "event1.jpg" (or .png) in public/events/ folder
      registrationLink: "https://docs.google.com/forms/d/e/1FAIpQLSfXitAxk2JvmcXuIOZaMAf6iq9clPNEKNHZD2CpP5C8-Dj-hA/viewform",
      buttonText: "Register for The Security Keynote",
    },
    {
      id: "event-2",
      title: "Cyber Cypher-Taqneeq",
      image: "/events/event2.jpg", // Place image file named "event2.jpg" (or .png) in public/events/ folder
      registrationLink: "https://unstop.com/hackathons/cyber-cypher-50-narsee-monjee-institute-of-management-studies-nmims-mumbai-1593500?lb=VE2YcXOf&utm_medium=Share&utm_source=taqneeqf46875&utm_campaign=Online_coding_challenge",
      buttonText: "Register for Cyber Cypher-Taqneeq",
    },
    {
      id: "event-3",
      title: "The Talk",
      image: "/events/event3.jpg", // Place image file named "event3.jpg" (or .png) in public/events/ folder
      registrationLink: "https://bit.ly/thetalk-openpaws",
      buttonText: "Register for The Talk",
    },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/community'}
                className="text-[#D4D4D8] hover:text-white"
                data-cursor-hover
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Community
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center glow-blue"
                whileHover={{ scale: 1.1, rotate: 6 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white">Live Event Discovery</h1>
            </div>
            <p className="text-[#D4D4D8] max-w-2xl">
              Discover and register for upcoming campus events, workshops, and activities.
            </p>
          </motion.div>

          {/* Events List - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="w-full"
              >
                <Card variant="glass" interactive delay={index * 0.1} className="group w-full h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {/* Event Image */}
                    <div className="relative w-full h-80 rounded-lg overflow-hidden border border-[#222222] bg-[#161616] flex-shrink-0">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>

                    {/* Registration Button/Link */}
                    <div className="space-y-3 mt-auto">
                      {!showLinks[event.id] ? (
                        <Button
                          variant="neon"
                          onClick={() => toggleLink(event.id)}
                          className="w-full"
                          data-cursor-hover
                        >
                          {event.buttonText}
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3"
                        >
                          <a
                            href={event.registrationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 underline transition-colors break-words"
                            data-cursor-hover
                          >
                            <span className="text-sm">{event.buttonText}</span>
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          </a>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsPageContent />
    </ProtectedRoute>
  );
}
