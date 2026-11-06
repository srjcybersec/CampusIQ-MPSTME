"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth } from "@/lib/auth/context";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth/registration";
import { Lock, Mail } from "lucide-react";
import { CampusIQBrand } from "@/components/brand/campusiq-brand";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in (respecting verification state).
  useEffect(() => {
    if (user) {
      if (user.emailVerified) {
        router.push("/");
      } else {
        router.push("/auth/verify-email");
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Layer 1: only official MPSTME emails may sign in.
      if (!normalizedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
        setError(`Only official MPSTME emails (@${ALLOWED_EMAIL_DOMAIN}) can access CampusIQ.`);
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const signedInUser = userCredential.user;

      // Layer 2: email must be verified before using the app.
      // The verify-email page is the single place that sends the email.
      if (!signedInUser.emailVerified) {
        router.push("/auth/verify-email");
        return;
      }

      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("No account found or incorrect credentials. Please check and try again.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
      // Ensure we don't leave a half-signed-in session on error paths.
      try { await signOut(auth); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-3 sm:p-4 safe-padding">
      <div className="w-full max-w-md relative z-10">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="flex items-center justify-center mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CampusIQBrand variant="auth" />
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
            <CardDescription>Sign in with your MPSTME email</CardDescription>
          </CardHeader>
          <CardContent>
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
                  placeholder={`your.name@${ALLOWED_EMAIL_DOMAIN}`}
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
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="text-sm text-[#D4D4D8] text-center mt-6">
              New to CampusIQ?{" "}
              <Link href="/auth/signup" className="text-[#7C7CFF] hover:text-[#38BDF8] font-semibold">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
