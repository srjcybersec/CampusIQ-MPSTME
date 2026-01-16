"use client";

import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Train, CreditCard } from "lucide-react";

function ServicesPageContent() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Services</h1>
          <p className="text-neutral-600 mb-8">Administrative and student services</p>

          {/* College FAQs */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                College FAQs
              </CardTitle>
              <CardDescription>
                Frequently asked questions about college policies and procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Find answers to common questions about academics, administration, and campus life.
              </p>
              <Button variant="outline" disabled>
                Browse FAQs
              </Button>
            </CardContent>
          </Card>

          {/* Railway Concession Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Train className="w-5 h-5" />
                Railway Concession Form
              </CardTitle>
              <CardDescription>
                Book and manage railway concession forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Request and track your railway concession form booking.
              </p>
              <Button variant="outline" disabled>
                Request Form
              </Button>
            </CardContent>
          </Card>

          {/* ID Card & Lanyard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                ID Card & Lanyard Request
              </CardTitle>
              <CardDescription>
                Request new or replacement ID cards and lanyards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Submit requests for ID card issuance or replacement, and lanyard requests.
              </p>
              <Button variant="outline" disabled>
                Submit Request
              </Button>
            </CardContent>
          </Card>
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
