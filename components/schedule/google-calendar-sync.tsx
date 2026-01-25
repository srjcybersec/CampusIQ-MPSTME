"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, CheckCircle, XCircle, RefreshCw, Unlink } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

export function GoogleCalendarSync() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
    eventsCreated?: number;
  } | null>(null);

  // Handle OAuth callback - read from URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const accessToken = urlParams.get("accessToken");
    const refreshToken = urlParams.get("refreshToken");
    const expiryDate = urlParams.get("expiryDate");
    const error = urlParams.get("error");

    console.log("🔍 Checking URL params:", { 
      connected, 
      hasToken: !!accessToken, 
      hasUser: !!user?.uid,
      userUid: user?.uid 
    });

    // Handle errors
    if (error) {
      console.error("❌ OAuth error:", error);
      setSyncStatus({
        success: false,
        message: `Connection failed: ${decodeURIComponent(error)}`,
      });
      setTimeout(() => router.replace("/schedule"), 3000);
      return;
    }

    // Handle successful connection
    if (connected === "true" && accessToken) {
      console.log("✅ OAuth callback detected with tokens!");
      
      // Store tokens function
      const storeTokens = async (userId: string) => {
        try {
          console.log("💾 Storing Google Calendar tokens for user:", userId);
          await setDoc(doc(db, "googleCalendarTokens", userId), {
            accessToken,
            refreshToken: refreshToken || null,
            expiryDate: expiryDate ? parseInt(expiryDate) : null,
            updatedAt: new Date().toISOString(),
          });
          console.log("✅ Tokens stored successfully in Firestore!");
          setIsConnected(true);
          setSyncStatus({
            success: true,
            message: "🎉 Google Calendar connected successfully! You can now sync your timetable.",
          });
          // Clean URL after showing success message
          setTimeout(() => {
            router.replace("/schedule");
          }, 5000);
        } catch (error: any) {
          console.error("❌ Error storing tokens:", error);
          setSyncStatus({
            success: false,
            message: `Failed to store tokens: ${error.message || error}. Please check browser console.`,
          });
        }
      };

      // If user is already loaded, store tokens immediately
      if (user?.uid) {
        console.log("✅ User loaded, storing tokens now");
        storeTokens(user.uid);
      } else {
        // Wait for user to be loaded
        console.log("⏳ User not loaded yet, waiting...");
        setSyncStatus({
          success: false,
          message: "Loading user information...",
        });
        
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds max wait
        
        const checkUser = setInterval(() => {
          attempts++;
          if (user?.uid) {
            clearInterval(checkUser);
            console.log("✅ User loaded after", attempts * 500, "ms");
            storeTokens(user.uid);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkUser);
            console.error("❌ User not loaded after 10 seconds");
            setSyncStatus({
              success: false,
              message: "User not loaded. Please refresh the page and try again.",
            });
          }
        }, 500);
        
        return () => clearInterval(checkUser);
      }
    }
  }, [user, router]);

  const checkConnection = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const tokensRef = doc(db, "googleCalendarTokens", user.uid);
      const tokensDoc = await getDoc(tokensRef);
      setIsConnected(tokensDoc.exists());
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnected(false);
    }
  }, [user?.uid]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      
      if (data.authUrl) {
        // Add user ID to state for callback
        const authUrl = new URL(data.authUrl);
        authUrl.searchParams.set("state", user?.uid || "default-user");
        // Redirect to Google OAuth
        window.location.href = authUrl.toString();
      } else {
        throw new Error("Failed to get authorization URL");
      }
    } catch (error: any) {
      console.error("Error connecting Google Calendar:", error);
      setSyncStatus({
        success: false,
        message: error.message || "Failed to connect Google Calendar",
      });
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!user?.uid) {
      setSyncStatus({
        success: false,
        message: "Please log in to sync your calendar",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    
    try {
      // Get tokens from Firestore
      const tokensRef = doc(db, "googleCalendarTokens", user.uid);
      const tokensDoc = await getDoc(tokensRef);

      if (!tokensDoc.exists()) {
        setSyncStatus({
          success: false,
          message: "Please connect Google Calendar first",
        });
        setIsSyncing(false);
        return;
      }

      const tokens = tokensDoc.data();
      
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          batch: "K1", // TODO: Get from user profile
          userId: user.uid,
        }),
      });

      // Check if response is OK and is JSON
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${text.substring(0, 100)}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
      }

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          success: true,
          message: `Successfully synced ${data.eventsCreated} events to Google Calendar!`,
          eventsCreated: data.eventsCreated,
        });
      } else {
        throw new Error(data.error || "Failed to sync");
      }
    } catch (error: any) {
      console.error("Error syncing to Google Calendar:", error);
      let errorMessage = error.message || "Failed to sync to Google Calendar";
      
      // If error message contains HTML, extract a cleaner message
      if (errorMessage.includes("<!DOCTYPE") || errorMessage.includes("<html") || errorMessage.includes("Unexpected token")) {
        errorMessage = "Server error: The API returned an unexpected response. Please check your server logs or try again later.";
      }
      
      setSyncStatus({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.uid) {
      setSyncStatus({
        success: false,
        message: "Please log in to disconnect",
      });
      return;
    }

    if (!confirm("Are you sure you want to disconnect Google Calendar? This will remove your calendar connection and delete all synced events from your Google Calendar. You'll need to reconnect to sync again.")) {
      return;
    }

    setIsDisconnecting(true);
    setSyncStatus(null);

    try {
      // Get tokens and event IDs before deleting
      const tokensRef = doc(db, "googleCalendarTokens", user.uid);
      const tokensDoc = await getDoc(tokensRef);

      if (tokensDoc.exists()) {
        const data = tokensDoc.data();
        const eventIds = data.eventIds || [];
        const accessToken = data.accessToken;
        const refreshToken = data.refreshToken;

        // Delete all calendar events if we have tokens and event IDs
        if (accessToken && eventIds.length > 0) {
          try {
            setSyncStatus({
              success: false,
              message: `Deleting ${eventIds.length} events from Google Calendar...`,
            });

            const response = await fetch("/api/calendar/delete-events", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken,
                refreshToken,
                eventIds,
              }),
            });

            const deleteData = await response.json();
            if (!deleteData.success) {
              console.warn("Some events may not have been deleted:", deleteData.error);
            }
          } catch (error: any) {
            console.error("Error deleting calendar events:", error);
            // Continue with disconnect even if deletion fails
          }
        }
      }

      // Delete tokens from Firestore
      await deleteDoc(tokensRef);
      
      setIsConnected(false);
      setSyncStatus({
        success: true,
        message: "Google Calendar disconnected successfully. All synced events have been removed from your calendar. You can reconnect anytime.",
      });
    } catch (error: any) {
      console.error("Error disconnecting Google Calendar:", error);
      setSyncStatus({
        success: false,
        message: error.message || "Failed to disconnect Google Calendar",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Check connection status on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      checkConnection();
    }
  }, [user, checkConnection]);

  return (
    <Card variant="glass" className="relative z-10 border-green-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5 text-green-400" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your timetable to Google Calendar for easy access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-[#D4D4D8]">
              Connect your Google Calendar to sync your class schedule automatically.
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              variant="neon"
              className="w-full"
              data-cursor-hover
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium text-white">Google Calendar Connected</span>
            </div>
            
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="neon"
              className="w-full"
              data-cursor-hover
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Timetable to Calendar
                </>
              )}
            </Button>

            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500"
              data-cursor-hover
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect Google Calendar
                </>
              )}
            </Button>

            {syncStatus && (
              <div
                className={`p-4 rounded-lg border ${
                  syncStatus.success
                    ? "bg-green-500/20 border-green-500/50"
                    : "bg-red-500/20 border-red-500/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {syncStatus.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p
                      className={`text-sm font-medium ${
                        syncStatus.success ? "text-green-400" : "text-red-400"
                      } break-words`}
                    >
                      {syncStatus.message}
                    </p>
                    {syncStatus.success && syncStatus.eventsCreated && (
                      <p className="text-xs text-green-300 mt-2">
                        Your classes have been added to Google Calendar with weekly recurrence.
                      </p>
                    )}
                    {syncStatus.success && !syncStatus.eventsCreated && (
                      <p className="text-xs text-green-300 mt-2">
                        Click &quot;Sync Timetable to Calendar&quot; below to add your classes.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
