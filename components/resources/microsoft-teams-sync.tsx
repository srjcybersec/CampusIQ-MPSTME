"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { saveMicrosoftTokens } from "@/lib/firebase/assignments";
import { Timestamp } from "firebase/firestore";

interface MicrosoftTeamsSyncProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export function MicrosoftTeamsSync({
  isConnected,
  onConnectionChange,
}: MicrosoftTeamsSyncProps) {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Handle OAuth callback - read from URL
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const accessToken = urlParams.get("accessToken");
    const refreshToken = urlParams.get("refreshToken");
    const expiresAt = urlParams.get("expiresAt");
    const error = urlParams.get("error");

    // Handle errors
    if (error) {
      setSyncStatus({
        success: false,
        message: `Connection failed: ${decodeURIComponent(error)}`,
      });
      // Clean URL
      window.history.replaceState({}, "", "/resources/assignments");
      return;
    }

    // Handle successful connection
    if (connected === "true" && accessToken && user.uid) {
      const saveTokens = async () => {
        try {
          await saveMicrosoftTokens(user.uid, {
            accessToken,
            refreshToken: refreshToken || "",
            expiresAt: parseInt(expiresAt || "0"),
            scope: "EduAssignments.Read EduClasses.Read User.Read offline_access",
          });
          onConnectionChange(true);
          setSyncStatus({
            success: true,
            message: "Microsoft account connected successfully!",
          });
          // Clean URL
          window.history.replaceState({}, "", "/resources/assignments");
        } catch (error: any) {
          console.error("Error saving tokens:", error);
          setSyncStatus({
            success: false,
            message: `Failed to save connection: ${error.message}`,
          });
        }
      };
      saveTokens();
    }
  }, [user, onConnectionChange]);

  const handleConnect = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/auth/microsoft?state=${user.uid}`);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || "Failed to get authorization URL");
      }
    } catch (error: any) {
      setSyncStatus({
        success: false,
        message: `Failed to connect: ${error.message}`,
      });
    }
  };

  const handleSync = async () => {
    if (!user) return;

    setSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch("/api/assignments/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          success: true,
          message: data.message || "Assignments synced successfully!",
        });
        // Refresh the page to show new assignments
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSyncStatus({
          success: false,
          message: data.error || "Failed to sync assignments",
        });
      }
    } catch (error: any) {
      setSyncStatus({
        success: false,
        message: `Sync failed: ${error.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card variant="glass" className="mb-6 relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          Microsoft Teams Integration (Optional)
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your Microsoft account is connected. Sync assignments from Teams."
            : "Connect your Microsoft account to automatically sync assignments from Microsoft Teams. You can also create assignments manually without connecting."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {syncStatus && (
          <Alert
            className={`mb-4 ${
              syncStatus.success ? "bg-green-500/20 border-green-500/50" : "bg-red-500/20 border-red-500/50"
            }`}
          >
            <AlertDescription
              className={syncStatus.success ? "text-green-400" : "text-red-400"}
            >
              {syncStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          {!isConnected ? (
            <Button onClick={handleConnect} variant="neon">
              Connect Microsoft Account
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="neon"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Assignments
                  </>
                )}
              </Button>
              <Button onClick={handleConnect} variant="outline">
                Reconnect Account
              </Button>
            </>
          )}
        </div>

        {!isConnected && (
          <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-400">
              <strong className="text-white">Note:</strong> Microsoft Teams integration is optional. You can create and manage assignments manually using the &quot;Add Assignment&quot; button below. If you have Azure AD permissions, you can connect your Microsoft account to automatically sync assignments from Teams.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
