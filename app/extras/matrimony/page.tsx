"use client";

import { useState, useEffect, useCallback } from "react";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MatrimonyProfileForm } from "@/components/extras/matrimony-profile-form";
import { MatrimonyMatchCard } from "@/components/extras/matrimony-match-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, findMatches, getUserMatches, getProfile as getOtherProfile } from "@/lib/firebase/matrimony";
import { useAuth } from "@/lib/auth/context";
import { MatrimonyProfile, Match } from "@/lib/types/matrimony";
import { Heart, Sparkles, RefreshCw, Loader2, MessageCircle } from "lucide-react";

function MatrimonyPageContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MatrimonyProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFindingMatches, setIsFindingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "matches" | "my-matches">("profile");
  const [profileDetails, setProfileDetails] = useState<Record<string, MatrimonyProfile>>({});

  const loadMyMatches = useCallback(async () => {
    if (!user) return;
    try {
      const userMatches = await getUserMatches(user.uid);
      setMatches(userMatches);
      
      // Load profile details for matches
      const profilePromises = userMatches.map(async (match) => {
        const otherUserId = match.user1Id === user.uid ? match.user2Id : match.user1Id;
        if (!profileDetails[otherUserId]) {
          const otherProfile = await getOtherProfile(otherUserId);
          if (otherProfile) {
            setProfileDetails(prev => ({ ...prev, [otherUserId]: otherProfile }));
          }
        }
      });
      await Promise.all(profilePromises);
    } catch (error) {
      console.error("Error loading matches:", error);
    }
  }, [user, profileDetails]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userProfile = await getProfile(user.uid);
      setProfile(userProfile);
      if (userProfile) {
        setActiveTab("matches");
        await loadMyMatches();
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadMyMatches]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleFindMatches = async () => {
    if (!user) return;
    setIsFindingMatches(true);
    try {
      const newMatches = await findMatches(user.uid, 10);
      setMatches(newMatches);
      
      // Load profile details
      const profilePromises = newMatches.map(async (match) => {
        const otherUserId = match.user1Id === user.uid ? match.user2Id : match.user1Id;
        if (!profileDetails[otherUserId]) {
          const otherProfile = await getOtherProfile(otherUserId);
          if (otherProfile) {
            setProfileDetails(prev => ({ ...prev, [otherUserId]: otherProfile }));
          }
        }
      });
      await Promise.all(profilePromises);
      
      setActiveTab("matches");
    } catch (error: any) {
      alert(error.message || "Failed to find matches");
    } finally {
      setIsFindingMatches(false);
    }
  };

  const handleProfileCreated = () => {
    loadProfile();
  };

  const handleMatchUpdate = () => {
    loadMyMatches();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Heart className="w-8 h-8 text-pink-600" />
              <h1 className="text-4xl font-bold text-neutral-900">Campus Matrimony</h1>
            </div>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              CGPA-based matchmaking for campus connections. Find dating partners, friends, or study buddies based on compatibility.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "profile"
                  ? "text-pink-600 border-b-2 border-pink-600"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {profile ? "Update Profile" : "Create Profile"}
            </button>
            {profile && (
              <>
                <button
                  onClick={() => setActiveTab("matches")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "matches"
                      ? "text-pink-600 border-b-2 border-pink-600"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  Find Matches
                </button>
                <button
                  onClick={() => {
                    setActiveTab("my-matches");
                    loadMyMatches();
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "my-matches"
                      ? "text-pink-600 border-b-2 border-pink-600"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  My Matches
                </button>
              </>
            )}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <MatrimonyProfileForm
              existingProfile={profile}
              onSuccess={handleProfileCreated}
            />
          )}

          {/* Find Matches Tab */}
          {activeTab === "matches" && profile && (
            <div className="space-y-4">
              <Card className="shadow-premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Arrange My Match
                  </CardTitle>
                  <CardDescription>
                    Find compatible matches based on CGPA, branch, year, study style, and personality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={handleFindMatches}
                    disabled={isFindingMatches}
                    className="w-full min-h-[40px] px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium rounded-xl shadow-premium hover:shadow-glow-hover hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isFindingMatches ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finding Matches...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Find My Matches
                      </>
                    )}
                  </button>
                </CardContent>
              </Card>

              {/* Matches List */}
              {matches.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Your Matches ({matches.length})
                  </h2>
                  {matches.map((match) => (
                    <MatrimonyMatchCard
                      key={match.id}
                      match={match}
                      otherUserProfile={profileDetails[match.user1Id === user?.uid ? match.user2Id : match.user1Id]}
                      onUpdate={handleMatchUpdate}
                    />
                  ))}
                </div>
              )}

              {matches.length === 0 && !isFindingMatches && (
                <Card className="shadow-soft">
                  <CardContent className="p-12 text-center">
                    <Sparkles className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-2">No matches yet</p>
                    <p className="text-sm text-neutral-400">
                      Click &quot;Find My Matches&quot; to discover compatible connections!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* My Matches Tab */}
          {activeTab === "my-matches" && profile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Accepted Matches</h2>
                <button
                  onClick={loadMyMatches}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <MatrimonyMatchCard
                      key={match.id}
                      match={match}
                      otherUserProfile={profileDetails[match.user1Id === user?.uid ? match.user2Id : match.user1Id]}
                      onUpdate={handleMatchUpdate}
                    />
                  ))}
                </div>
              ) : (
                <Card className="shadow-soft">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-2">No accepted matches yet</p>
                    <p className="text-sm text-neutral-400">
                      Accept matches from the &quot;Find Matches&quot; tab to start chatting!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MatrimonyPage() {
  return (
    <ProtectedRoute>
      <MatrimonyPageContent />
    </ProtectedRoute>
  );
}
