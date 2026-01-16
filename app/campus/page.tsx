"use client";

import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, UtensilsCrossed, Calendar } from "lucide-react";

function CampusPageContent() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Campus</h1>
          <p className="text-neutral-600 mb-8">Campus space and infrastructure intelligence</p>

          {/* Empty Space Intelligence */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Empty Space Finder
              </CardTitle>
              <CardDescription>
                Find available classrooms and study spaces based on your schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Get intelligent suggestions for empty spaces based on time, schedule, and upcoming deadlines.
              </p>
              <Button variant="outline" disabled>
                Find Empty Spaces
              </Button>
            </CardContent>
          </Card>

          {/* Library Conference Room Booking */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Library Conference Room Booking
              </CardTitle>
              <CardDescription>
                Book library conference rooms for group study sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Check availability and book conference rooms in the library.
              </p>
              <Button variant="outline" disabled>
                View Availability
              </Button>
            </CardContent>
          </Card>

          {/* Canteen Menu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                Daily Canteen Menu
              </CardTitle>
              <CardDescription>
                Today's thaali and platter options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                View today's menu with daily updates on available meals.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900">Thaali</h4>
                  <p className="text-sm text-neutral-600">Rice, Dal, Sabzi, Roti, Salad</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900">Platter</h4>
                  <p className="text-sm text-neutral-600">Pasta, Sandwich, Burger options available</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
