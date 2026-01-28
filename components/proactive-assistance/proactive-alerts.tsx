"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Clock, AlertTriangle, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProactiveAssistance, ProactiveAlert } from "@/lib/hooks/use-proactive-assistance";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function ProactiveAlerts() {
  const { alerts, checkAlerts } = useProactiveAssistance();
  const router = useRouter();
  
  // Load dismissed alerts from localStorage
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem("dismissed_alerts");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Save dismissed alerts to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dismissed_alerts", JSON.stringify(Array.from(dismissedAlerts)));
    }
  }, [dismissedAlerts]);

  // Trigger check when component mounts (only once)
  useEffect(() => {
    checkAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleDismiss = (alert: ProactiveAlert) => {
    // Use a stable ID based on alert type and content, not timestamp
    const alertId = `${alert.type}-${alert.title}`;
    setDismissedAlerts((prev) => {
      const newSet = new Set(prev).add(alertId);
      // Persist immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("dismissed_alerts", JSON.stringify(Array.from(newSet)));
      }
      return newSet;
    });
  };

  const handleAction = (alert: ProactiveAlert) => {
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
    }
  };

  const visibleAlerts = alerts.filter((alert) => {
    // Use stable ID based on type and title, not timestamp
    const alertId = `${alert.type}-${alert.title}`;
    return !dismissedAlerts.has(alertId);
  });

  if (visibleAlerts.length === 0) return null;

  const getIcon = (type: ProactiveAlert["type"]) => {
    switch (type) {
      case "class_reminder":
        return <Clock className="w-5 h-5" />;
      case "attendance_warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "upcoming_deadline":
        return <Calendar className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: ProactiveAlert["priority"]) => {
    switch (priority) {
      case "high":
        return "border-red-500/50 bg-red-500/10";
      case "medium":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "low":
        return "border-blue-500/50 bg-blue-500/10";
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm space-y-2">
      <AnimatePresence>
        {visibleAlerts.slice(0, 3).map((alert, index) => {
          const alertId = `${alert.type}-${alert.title}`;
          return (
            <motion.div
              key={alertId}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`${getPriorityColor(alert.priority)} border-2 shadow-lg`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${
                      alert.priority === "high" ? "text-red-400" :
                      alert.priority === "medium" ? "text-yellow-400" :
                      "text-blue-400"
                    }`}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-[#D4D4D8] mb-2">
                        {alert.message}
                      </p>
                      {alert.actionUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(alert)}
                          className="h-7 text-xs"
                        >
                          View <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(alert)}
                      className="h-6 w-6 p-0 text-[#D4D4D8] hover:text-white flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
