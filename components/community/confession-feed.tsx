"use client";

import { useState, useEffect, useCallback } from "react";
import { ConfessionCard } from "./confession-card";
import { Confession, ConfessionCategory } from "@/lib/types/confession";
import { getConfessions } from "@/lib/firebase/confessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONFESSION_CATEGORIES } from "@/lib/types/confession";
import { RefreshCw, Loader2 } from "lucide-react";

export function ConfessionFeed() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ConfessionCategory | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const loadConfessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConfessions(
        selectedCategory === "all" ? undefined : selectedCategory,
        50
      );
      setConfessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load confessions");
      console.error("Error loading confessions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadConfessions();
  }, [loadConfessions]);

  const handleUpdate = () => {
    loadConfessions();
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-neutral-700 mr-2">Filter:</span>
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {Object.entries(CONFESSION_CATEGORIES).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key as ConfessionCategory)}
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
                onClick={loadConfessions}
                disabled={isLoading}
                className="flex items-center gap-2"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="shadow-soft">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadConfessions} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confessions List */}
      {!isLoading && !error && (
        <>
          {confessions.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <p className="text-neutral-500 mb-2">No confessions yet</p>
                <p className="text-sm text-neutral-400">
                  Be the first to share your thoughts!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {confessions.map((confession) => (
                <ConfessionCard
                  key={confession.id}
                  confession={confession}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
