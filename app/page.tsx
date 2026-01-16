"use client";

import Link from "next/link";
import { MainNav } from "@/components/navigation/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";
import { FacultyDashboard } from "@/components/dashboards/faculty-dashboard";
import { BookOpen, Calendar, MapPin, FolderOpen, Users, Settings, Sparkles, GraduationCap, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const features = [
    { href: "/academics", label: "Academics", icon: BookOpen, description: "AI-powered rule explanations and academic intelligence", color: "blue" },
    { href: "/schedule", label: "Schedule", icon: Calendar, description: "Unified timeline and smart reminders", color: "purple" },
    { href: "/campus", label: "Campus", icon: MapPin, description: "Empty space finder and infrastructure intelligence", color: "green" },
    { href: "/resources", label: "Resources", icon: FolderOpen, description: "Notes, assignments, and PYQ repository", color: "orange" },
    { href: "/community", label: "Community", icon: Users, description: "Events and campus engagement", color: "pink" },
    { href: "/services", label: "Services", icon: Settings, description: "Administrative services made simple", color: "indigo" },
    { href: "/extras", label: "Extras", icon: Sparkles, description: "Experimental features", color: "violet" },
  ];

  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
    green: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100",
    orange: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100",
    pink: "text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    violet: "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100",
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <MainNav />
        
        <main className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Role-Based Dashboard */}
            {userRole === "student" && <StudentDashboard />}
            {userRole === "faculty" && <FacultyDashboard />}
            {!userRole && (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-neutral-600">Loading your dashboard...</p>
                </div>
              </div>
            )}

            {/* Features Grid - Show for all users */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const colorClass = colorClasses[feature.color as keyof typeof colorClasses];
                return (
                  <Link 
                    key={feature.href} 
                    href={feature.href}
                    className="group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Card className={`h-full hover-lift cursor-pointer border-2 relative overflow-hidden ${colorClass}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardHeader className="relative z-10">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-premium transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${colorClass.split(' ')[1]}`}>
                          <Icon className={`w-7 h-7 ${colorClass.split(' ')[0]} group-hover:scale-110 transition-transform duration-300`} />
                        </div>
                        <CardTitle className="text-xl text-neutral-900 group-hover:gradient-text transition-all duration-300">{feature.label}</CardTitle>
                        <CardDescription className="text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">{feature.description}</CardDescription>
                      </CardHeader>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
