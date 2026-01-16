"use client";

import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart } from "lucide-react";

function ExtrasPageContent() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Extras</h1>
          <p className="text-neutral-600 mb-8">Experimental and optional features</p>

          {/* Matrimony */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Matrimony
                <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                  Experimental
                </span>
              </CardTitle>
              <CardDescription>
                CGPA-based matchmaking for campus connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                A lighthearted experimental feature for campus connections. This feature does not interfere with core academic flows.
              </p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ExtrasPage() {
  return (
    <ProtectedRoute>
      <ExtrasPageContent />
    </ProtectedRoute>
  );
}
