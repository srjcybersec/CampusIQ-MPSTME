"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MatrimonyProfileForm } from "@/components/extras/matrimony-profile-form";
import { MatrimonyMatchCard } from "@/components/extras/matrimony-match-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen bg-black">
        <MainNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-[#FB923C] to-[#EC4899] rounded-2xl flex items-center justify-center glow-orange"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EC4899] flex items-center justify-center glow-orange"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white" style={{ transform: 'none !important', fontStyle: 'normal', letterSpacing: '0', textTransform: 'none' }}>Campus Connections</h1>
            </div>
            <p className="text-[#D4D4D8] max-w-2xl mx-auto" style={{ transform: 'none !important', fontStyle: 'normal', letterSpacing: '0', textTransform: 'none' }}>
              CGPA-based matchmaking for campus connections. Find friends or study buddies based on compatibility.
            </p>
          </div>

          {/* Tabs */}
          <motion.div
            className="flex gap-2 border-b border-[#1a1a1a]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              onClick={() => setActiveTab("profile")}
              className={activeTab === "profile" ? "" : "text-[#D4D4D8]"}
            >
              {profile ? "Update Profile" : "Create Profile"}
            </Button>
            {profile && (
              <>
                <Button
                  variant={activeTab === "matches" ? "default" : "ghost"}
                  onClick={() => setActiveTab("matches")}
                  className={activeTab === "matches" ? "" : "text-[#D4D4D8]"}
                >
                  Find Matches
                </Button>
                <Button
                  variant={activeTab === "my-matches" ? "default" : "ghost"}
                  onClick={() => {
                    setActiveTab("my-matches");
                    loadMyMatches();
                  }}
                  className={activeTab === "my-matches" ? "" : "text-[#D4D4D8]"}
                >
                  My Matches
                </Button>
              </>
            )}
          </motion.div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <MatrimonyProfileForm
              existingProfile={profile}
              onSuccess={handleProfileCreated}
            />
          )}

          {/* Find Matches Tab */}
          {activeTab === "matches" && profile && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card variant="glass" interactive>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 gradient-text-orange" />
                    Arrange My Match
                  </CardTitle>
                  <CardDescription>
                    Find compatible matches based on CGPA, branch, year, study style, and personality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleFindMatches}
                    disabled={isFindingMatches}
                    variant="neon"
                    className="w-full"
                  >
                    {isFindingMatches ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finding Matches...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Find My Matches
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Matches List */}
              {matches.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">
                    Your Matches ({matches.length})
                  </h2>
                  {matches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <MatrimonyMatchCard
                        match={match}
                        otherUserProfile={profileDetails[match.user1Id === user?.uid ? match.user2Id : match.user1Id]}
                        onUpdate={handleMatchUpdate}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {matches.length === 0 && !isFindingMatches && (
                <Card variant="glass">
                  <CardContent className="p-12 text-center">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-br from-[#FB923C] to-[#EC4899] rounded-2xl flex items-center justify-center glow-orange mx-auto mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-white mb-2">No matches yet</p>
                    <p className="text-sm text-[#D4D4D8]">
                      Click &quot;Find My Matches&quot; to discover compatible connections!
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* My Matches Tab */}
          {activeTab === "my-matches" && profile && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Accepted Matches</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMyMatches}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <MatrimonyMatchCard
                        match={match}
                        otherUserProfile={profileDetails[match.user1Id === user?.uid ? match.user2Id : match.user1Id]}
                        onUpdate={handleMatchUpdate}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card variant="glass">
                  <CardContent className="p-12 text-center">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-br from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple mx-auto mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MessageCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-white mb-2">No accepted matches yet</p>
                    <p className="text-sm text-[#D4D4D8]">
                      Accept matches from the &quot;Find Matches&quot; tab to start chatting!
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
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
