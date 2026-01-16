"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { createOrUpdateUserProfile } from "@/lib/firebase/user-profile";
import { useAuth } from "@/lib/auth/context";
import { GraduationCap, User, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "faculty">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create or update user profile with selected role
      await createOrUpdateUserProfile(user.uid, user.email || email, userType);
      
      // Redirect will happen via useEffect in ProtectedRoute
      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative group transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Image
                src="/campusiq-logo.png"
                alt="CampusIQ Logo"
                width={160}
                height={160}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold gradient-text">CampusIQ</h1>
              <p className="text-sm text-neutral-500 -mt-1 font-medium">MPSTME</p>
            </div>
          </div>
          <p className="text-neutral-600 text-lg">Sign in to your account</p>
        </div>

        <Card className="shadow-premium border-0 glass-effect animate-in fade-in slide-in-from-bottom-6 duration-700">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Choose your account type and sign in</CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setUserType("student")}
                className={`p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group ${
                  userType === "student"
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-premium"
                    : "border-neutral-200 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:shadow-soft"
                }`}
              >
                {userType === "student" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                )}
                <User className={`w-7 h-7 mx-auto mb-2 relative z-10 transition-transform duration-300 ${userType === "student" ? "text-blue-600 scale-110" : "text-neutral-400 group-hover:scale-110"}`} />
                <p className={`font-semibold relative z-10 ${userType === "student" ? "text-blue-900" : "text-neutral-600"}`}>
                  Student
                </p>
                {userType === "student" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setUserType("faculty")}
                className={`p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group ${
                  userType === "faculty"
                    ? "border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-premium"
                    : "border-neutral-200 bg-white/80 backdrop-blur-sm hover:border-purple-300 hover:shadow-soft"
                }`}
              >
                {userType === "faculty" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
                )}
                <GraduationCap className={`w-7 h-7 mx-auto mb-2 relative z-10 transition-transform duration-300 ${userType === "faculty" ? "text-purple-600 scale-110" : "text-neutral-400 group-hover:scale-110"}`} />
                <p className={`font-semibold relative z-10 ${userType === "faculty" ? "text-purple-900" : "text-neutral-600"}`}>
                  Faculty
                </p>
                {userType === "faculty" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                )}
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@college.edu"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-white hover:opacity-90">
                {loading ? "Signing in..." : `Sign in as ${userType === "student" ? "Student" : "Faculty"}`}
              </Button>
            </form>

            <p className="text-xs text-neutral-500 text-center mt-6">
              Signing in as <strong>{userType === "student" ? "Student" : "Faculty"}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
