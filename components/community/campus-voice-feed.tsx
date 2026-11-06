"use client";

import { useState, useEffect, useCallback } from "react";
import { CampusVoiceCard } from "./campus-voice-card";
import { CampusVoiceCategory, CAMPUS_VOICE_CATEGORIES, postToItem } from "@/lib/types/campus-voice";
import { getCuratedCampusVoices } from "@/lib/data/campus-voices";
import { getCampusVoicePosts } from "@/lib/firebase/campus-voices";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";

export function CampusVoiceFeed() {
  const [selectedCategory, setSelectedCategory] = useState<CampusVoiceCategory | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<ReturnType<typeof getCuratedCampusVoices>>([]);

  const loadVoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const category = selectedCategory === "all" ? undefined : selectedCategory;
      const curated = getCuratedCampusVoices(category);
      const live = await getCampusVoicePosts(category, 50);
      const liveItems = live.map(postToItem);

      const merged = [...liveItems, ...curated].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setVoices(merged);
    } catch (err: any) {
      setError(err.message || "Failed to load posts");
      console.error("Error loading campus voices:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white mr-2">Filter:</span>
            <Button
              variant={selectedCategory === "all" ? "neon" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {Object.entries(CAMPUS_VOICE_CATEGORIES).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "neon" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key as CampusVoiceCategory)}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <span>{value.emoji}</span>
                <span>{value.label}</span>
              </Button>
            ))}
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadVoices}
                disabled={isLoading}
                className="flex items-center gap-2 text-white hover:text-[#D4D4D8]"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4D4D8]" />
        </div>
      )}

      {error && !isLoading && (
        <Card variant="glass">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadVoices} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {voices.length === 0 ? (
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <p className="text-white mb-2">No posts in this category yet</p>
                <p className="text-sm text-[#D4D4D8]">Be the first to share your voice!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {voices.map((voice) => (
                <CampusVoiceCard key={voice.id} voice={voice} onUpdate={loadVoices} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
