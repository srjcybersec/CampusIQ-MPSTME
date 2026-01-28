"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getReminderPreferences,
  saveReminderPreferences,
} from "@/lib/firebase/assignments";
import { ReminderPreferences, ReminderChannel } from "@/lib/types/assignments";
import { Bell, Check } from "lucide-react";

interface ReminderPreferencesProps {
  userId: string;
}

export function ReminderPreferencesComponent({
  userId,
}: ReminderPreferencesProps) {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      let prefs = await getReminderPreferences(userId);
      if (!prefs) {
        // Create default preferences
        prefs = {
          userId,
          enabled: true,
          channels: ["in_app"],
          "24h_before": true,
          "2h_before": true,
          "on_deadline": true,
          "missed_deadline": true,
          updatedAt: { toDate: () => new Date() } as any,
        };
      }
      setPreferences(prefs);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await saveReminderPreferences(preferences);
      alert("Reminder preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channel: ReminderChannel) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      channels: preferences.channels.includes(channel)
        ? preferences.channels.filter((c) => c !== channel)
        : [...preferences.channels, channel],
    });
  };

  const toggleReminderType = (type: keyof ReminderPreferences) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [type]: !preferences[type],
    });
  };

  if (loading || !preferences) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-white">Reminder Preferences</CardTitle>
          <CardDescription className="text-[#D4D4D8]">Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5 text-purple-400" />
          Reminder Preferences
        </CardTitle>
        <CardDescription className="text-[#D4D4D8]">
          Configure when and how you want to receive assignment reminders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Enable Reminders</p>
              <p className="text-sm text-[#D4D4D8]">
                Turn reminders on or off
              </p>
            </div>
            <Button
              variant={preferences.enabled ? "neon" : "outline"}
              size="sm"
              onClick={() =>
                setPreferences({ ...preferences, enabled: !preferences.enabled })
              }
            >
              {preferences.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {preferences.enabled && (
            <>
              {/* Notification Channels */}
              <div>
                <p className="font-medium text-white mb-3">
                  Notification Channels
                </p>
                <div className="flex gap-2">
                  {(["in_app", "email"] as ReminderChannel[]).map((channel) => {
                    const isSelected = preferences.channels.includes(channel);
                    const label = channel === "in_app" ? "In-App" : "Email";
                    return (
                      <Button
                        key={channel}
                        variant={isSelected ? "neon" : "outline"}
                        size="sm"
                        onClick={() => toggleChannel(channel)}
                        className="capitalize"
                      >
                        {isSelected && <Check className="w-4 h-4 mr-1" />}
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Email Address */}
              {preferences.channels.includes("email") && (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={preferences.email || ""}
                    onChange={(e) =>
                      setPreferences({ ...preferences, email: e.target.value })
                    }
                    placeholder="your.email@example.com"
                  />
                </div>
              )}

              {/* Reminder Types */}
              <div>
                <p className="font-medium text-white mb-3">
                  Reminder Timing
                </p>
                <div className="space-y-2">
                  {[
                    { key: "24h_before", label: "24 hours before deadline" },
                    { key: "2h_before", label: "2 hours before deadline" },
                    { key: "on_deadline", label: "On deadline" },
                    { key: "missed_deadline", label: "1 hour after missed deadline" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-[#161616] border border-[#222222] rounded-lg"
                    >
                      <span className="text-sm text-white">{label}</span>
                      <Button
                        variant={
                          preferences[key as keyof ReminderPreferences]
                            ? "neon"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleReminderType(key as keyof ReminderPreferences)}
                      >
                        {preferences[key as keyof ReminderPreferences] ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            On
                          </>
                        ) : (
                          "Off"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="neon"
            className="w-full"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
