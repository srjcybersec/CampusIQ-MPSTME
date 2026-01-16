"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, BarChart3, GraduationCap } from "lucide-react";
import Link from "next/link";

export function FacultyDashboard() {
  const quickActions = [
    { href: "/academics", label: "Class Management", icon: Users, color: "blue" },
    { href: "/resources", label: "Course Materials", icon: FileText, color: "purple" },
    { href: "/schedule", label: "Schedule", icon: BarChart3, color: "green" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-premium">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Faculty Dashboard</h2>
            <p className="text-purple-100">Manage your classes and students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-premium transition-calm cursor-pointer border-2 border-transparent hover:border-purple-200">
                <CardHeader>
                  <Icon className={`w-8 h-8 text-${action.color}-600 mb-2`} />
                  <CardTitle>{action.label}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
