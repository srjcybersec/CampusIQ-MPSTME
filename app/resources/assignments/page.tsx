"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import { AssignmentDashboard } from "@/components/resources/assignment-dashboard";
import { MicrosoftTeamsSync } from "@/components/resources/microsoft-teams-sync";

function AssignmentsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if Microsoft account is connected
    const checkConnection = async () => {
      try {
        const response = await fetch(`/api/assignments/check-connection?userId=${user.uid}`);
        const data = await response.json();
        setIsConnected(data.connected || false);
      } catch (error) {
        console.error("Error checking connection:", error);
        setIsConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnection();
  }, [user, router]);

  if (checkingConnection) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-neutral-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Assignment Management
            </h1>
            <p className="text-neutral-600">
              Track your assignments, deadlines, and submissions from Microsoft Teams
            </p>
          </div>

          {/* Microsoft Teams Sync - Only shown if configured */}
          {process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID && (
            <MicrosoftTeamsSync
              isConnected={isConnected}
              onConnectionChange={setIsConnected}
            />
          )}

          <AssignmentDashboard userId={user?.uid || ""} />
        </div>
      </main>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <ProtectedRoute>
      <AssignmentsPageContent />
    </ProtectedRoute>
  );
}
