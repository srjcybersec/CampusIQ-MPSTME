"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C7CFF] to-[#38BDF8] flex items-center justify-center glow-purple"
              whileHover={{ scale: 1.1, rotate: 6 }}
              transition={{ duration: 0.3 }}
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">CampusIQ</h1>
              <p className="text-sm text-[#D4D4D8] -mt-1 font-medium">MPSTME</p>
            </div>
          </motion.div>
          <p className="text-[#D4D4D8] text-lg">Sign in to your account</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="glass" className="shadow-premium">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Choose your account type and sign in</CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.button
                type="button"
                onClick={() => setUserType("student")}
                className={`p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group ${
                  userType === "student"
                    ? "border-blue-500 bg-blue-500/20 shadow-premium"
                    : "border-[#222222] bg-[#161616] hover:border-blue-500/50 hover:shadow-soft"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userType === "student" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                )}
                <User className={`w-7 h-7 mx-auto mb-2 relative z-10 transition-transform duration-300 ${userType === "student" ? "text-blue-400 scale-110" : "text-[#D4D4D8] group-hover:scale-110"}`} />
                <p className={`font-semibold relative z-10 ${userType === "student" ? "text-white" : "text-[#D4D4D8]"}`}>
                  Student
                </p>
                {userType === "student" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setUserType("faculty")}
                className={`p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group ${
                  userType === "faculty"
                    ? "border-purple-500 bg-purple-500/20 shadow-premium"
                    : "border-[#222222] bg-[#161616] hover:border-purple-500/50 hover:shadow-soft"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userType === "faculty" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
                )}
                <GraduationCap className={`w-7 h-7 mx-auto mb-2 relative z-10 transition-transform duration-300 ${userType === "faculty" ? "text-purple-400 scale-110" : "text-[#D4D4D8] group-hover:scale-110"}`} />
                <p className={`font-semibold relative z-10 ${userType === "faculty" ? "text-white" : "text-[#D4D4D8]"}`}>
                  Faculty
                </p>
                {userType === "faculty" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                )}
              </motion.button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
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
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
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
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <Button type="submit" disabled={loading} variant="neon" className="w-full">
                {loading ? "Signing in..." : `Sign in as ${userType === "student" ? "Student" : "Faculty"}`}
              </Button>
            </form>

            <p className="text-xs text-[#D4D4D8] text-center mt-6">
              Signing in as <strong className="text-white">{userType === "student" ? "Student" : "Faculty"}</strong>
            </p>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
