"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";

export function StudentDashboard() {
  const quickActions = [
    { href: "/academics", label: "Academics", icon: BookOpen, color: "blue" },
    { href: "/schedule", label: "Schedule", icon: Calendar, color: "purple" },
    { href: "/extras", label: "Extras", icon: Sparkles, color: "violet" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-glow overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome Back! 👋</h2>
            <p className="text-blue-100 text-lg">Your academic command center at MPSTME</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const colorMap: Record<string, string> = {
            blue: "from-blue-500 to-blue-600",
            purple: "from-purple-500 to-purple-600",
            green: "from-green-500 to-green-600",
            violet: "from-violet-500 to-violet-600",
          };
          return (
            <Link 
              key={action.href} 
              href={action.href}
              className="group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <Card className="h-full hover-lift cursor-pointer border-2 relative overflow-hidden bg-gradient-to-br from-white to-neutral-50/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[action.color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <CardHeader className="relative z-10">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorMap[action.color]} flex items-center justify-center mb-4 shadow-premium transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:gradient-text transition-all duration-300">{action.label}</CardTitle>
                  <CardDescription className="text-neutral-600">Quick access</CardDescription>
                </CardHeader>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorMap[action.color]} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
