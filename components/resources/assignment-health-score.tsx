"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssignmentHealthScore as HealthScoreType } from "@/lib/types/assignments";
import { calculateHealthScore, getLatestHealthScore } from "@/lib/firebase/assignments";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface AssignmentHealthScoreProps {
  userId: string;
}

export function AssignmentHealthScore({ userId }: AssignmentHealthScoreProps) {
  const [healthScore, setHealthScore] = useState<HealthScoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const loadHealthScore = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      let score = await getLatestHealthScore(userId, period);
      if (!score) {
        // Calculate if doesn't exist
        score = await calculateHealthScore(userId, period);
      }
      setHealthScore(score);
    } catch (error) {
      console.error("Error loading health score:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, period]);

  useEffect(() => {
    loadHealthScore();
  }, [loadHealthScore]);

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const score = await calculateHealthScore(userId, period);
      setHealthScore(score);
    } catch (error) {
      console.error("Error calculating health score:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100 border-green-300";
    if (score >= 70) return "bg-blue-100 border-blue-300";
    if (score >= 50) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  if (loading && !healthScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment Health Score</CardTitle>
          <CardDescription>Calculating...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!healthScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment Health Score</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Assignment Health Score
            </CardTitle>
            <CardDescription>
              {period === "weekly" ? "Last 7 days" : "Last 30 days"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("weekly")}
              style={{ minWidth: '70px', color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff', display: 'inline-block' }}>Week</span>
            </Button>
            <Button
              variant={period === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("monthly")}
              style={{ minWidth: '70px' }}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreBgColor(
                healthScore.score
              )} ${getScoreColor(healthScore.score)}`}
            >
              <span className="text-3xl font-bold">{healthScore.score}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-neutral-600 capitalize">
              {healthScore.status.replace("_", " ")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-600">Total Assignments</p>
              <p className="text-2xl font-bold text-neutral-900">
                {healthScore.totalAssignments}
              </p>
            </div>
            <div>
              <p className="text-neutral-600">Completed On Time</p>
              <p className="text-2xl font-bold text-green-600">
                {healthScore.completedOnTime}
              </p>
            </div>
            <div>
              <p className="text-neutral-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {healthScore.overdue}
              </p>
            </div>
            <div>
              <p className="text-neutral-600">Late Submissions</p>
              <p className="text-2xl font-bold text-orange-600">
                {healthScore.late}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={loading}
            className="w-full"
          >
            Recalculate Score
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
