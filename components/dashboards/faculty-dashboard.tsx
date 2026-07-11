"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, BarChart3, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export function FacultyDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-premium">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold break-words">
              <span className="block">Welcome Back</span>
              {user?.email && (
                <span className="block text-base sm:text-lg mt-1 truncate max-w-full">
                  {user.email}
                </span>
              )}
              <span className="inline-block ml-1">👋</span>
            </h2>
            <p className="text-purple-100 mt-2">Manage your classes and students</p>
          </div>
        </div>
      </div>
    </div>
  );
}
