"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MatrimonyProfile, Branch, Year, StudyStyle, PersonalityType, ConnectionType, BRANCHES, STUDY_STYLES, PERSONALITY_TYPES, CONNECTION_TYPES } from "@/lib/types/matrimony";
import { createOrUpdateProfile } from "@/lib/firebase/matrimony";
import { useAuth } from "@/lib/auth/context";
import { User, CheckCircle2, AlertCircle } from "lucide-react";

interface MatrimonyProfileFormProps {
  existingProfile?: MatrimonyProfile | null;
  onSuccess?: () => void;
}

export function MatrimonyProfileForm({ existingProfile, onSuccess }: MatrimonyProfileFormProps) {
  const { user } = useAuth();
  const [cgpa, setCgpa] = useState(existingProfile?.cgpa?.toString() || "");
  const [branch, setBranch] = useState<Branch>(existingProfile?.branch || "CSE");
  const [year, setYear] = useState<Year>(existingProfile?.year || "2");
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(existingProfile?.studyStyle || "balanced");
  const [personality, setPersonality] = useState<PersonalityType[]>(existingProfile?.personality || []);
  const [connectionType, setConnectionType] = useState<ConnectionType[]>(existingProfile?.connectionType || []);
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const togglePersonality = (type: PersonalityType) => {
    setPersonality(prev =>
      prev.includes(type)
        ? prev.filter(p => p !== type)
        : [...prev, type]
    );
  };

  const toggleConnectionType = (type: ConnectionType) => {
    setConnectionType(prev =>
      prev.includes(type)
        ? prev.filter(ct => ct !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create a profile");
      return;
    }

    if (personality.length === 0) {
      setError("Please select at least one personality trait");
      return;
    }

    if (connectionType.length === 0) {
      setError("Please select at least one connection type");
      return;
    }

    const cgpaNum = parseFloat(cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 4.0) {
      setError("CGPA must be between 0 and 4.0");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createOrUpdateProfile(user.uid, {
        cgpa: cgpaNum,
        branch,
        year,
        studyStyle,
        personality,
        connectionType,
        bio: bio.trim() || undefined,
        isActive: true,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {existingProfile ? "Update Your Profile" : "Create Your Profile"}
        </CardTitle>
        <CardDescription>
          Build your profile to find compatible matches on campus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CGPA */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              CGPA <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              placeholder="Enter your CGPA (0-4.0)"
              required
              className="max-w-xs"
            />
            <p className="text-xs text-[#D4D4D8] mt-1">
              Your CGPA helps match you with similar academic achievers
            </p>
          </div>

          {/* Branch */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Branch <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(BRANCHES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBranch(key as Branch)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    branch === key
                      ? "border-blue-500 bg-blue-500/20 shadow-soft"
                      : "border-[#222222] bg-[#161616] hover:border-[#333333]"
                  }`}
                >
                  <div className="text-lg mb-1">{value.emoji}</div>
                  <div className="text-sm font-medium text-white">{value.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Year <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(["1", "2", "3", "4"] as Year[]).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    year === y
                      ? "border-blue-500 bg-blue-500/20 shadow-soft font-medium text-white"
                      : "border-[#222222] bg-[#161616] hover:border-[#333333] text-white"
                  }`}
                >
                  Year {y}
                </button>
              ))}
            </div>
          </div>

          {/* Study Style */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Study Style <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(STUDY_STYLES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStudyStyle(key as StudyStyle)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    studyStyle === key
                      ? "border-blue-500 bg-blue-500/20 shadow-soft"
                      : "border-[#222222] bg-[#161616] hover:border-[#333333]"
                  }`}
                >
                  <div className="text-lg mb-1">{value.emoji}</div>
                  <div className="text-sm font-medium text-white">{value.label}</div>
                  <div className="text-xs text-[#D4D4D8] mt-1">{value.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Personality Traits <span className="text-red-500">*</span> (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(PERSONALITY_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePersonality(key as PersonalityType)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    personality.includes(key as PersonalityType)
                      ? "border-blue-500 bg-blue-500/20 shadow-soft"
                      : "border-[#222222] bg-[#161616] hover:border-[#333333]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{value.emoji}</span>
                    <span className="text-sm font-medium text-white">{value.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Type */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Looking For <span className="text-red-500">*</span> (Select at least one)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(CONNECTION_TYPES)
                .filter(([key]) => key !== "dating")
                .map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleConnectionType(key as ConnectionType)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    connectionType.includes(key as ConnectionType)
                      ? "border-blue-500 bg-blue-500/20 shadow-soft"
                      : "border-[#222222] bg-[#161616] hover:border-[#333333]"
                  }`}
                >
                  <div className="text-2xl mb-2">{value.emoji}</div>
                  <div className="text-sm font-medium mb-1 text-white">{value.label}</div>
                  <div className="text-xs text-[#D4D4D8]">{value.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Bio (Optional)
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself... (max 200 characters)"
              rows={4}
              maxLength={200}
              className="resize-none"
            />
            <p className="text-xs text-[#D4D4D8] mt-1">{bio.length}/200 characters</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-sm text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Profile saved successfully!
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[40px] px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium rounded-xl shadow-premium hover:shadow-glow-hover hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? "Saving..." : existingProfile ? "Update Profile" : "Create Profile"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
