"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { MailCheck, RefreshCw, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const autoSentRef = useRef(false);

  const sendCode = async (isAuto: boolean) => {
    const current = auth.currentUser;
    if (!current) {
      router.push("/auth/login");
      return;
    }
    if (!isAuto) setResending(true);
    setError("");
    setMessage("");
    try {
      const token = await current.getIdToken();
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (data.alreadyVerified) {
        window.location.href = "/";
        return;
      }
      if (res.ok) {
        setMessage("We emailed you a 6-digit code. Check your inbox (and spam).");
        setCooldown(60);
      } else if (res.status === 429) {
        // A code was just sent (cooldown) or too many requests.
        if (data.reason === "cooldown") {
          setMessage("A code was just sent. Check your inbox (and spam).");
          setCooldown(data.retryAfter || 60);
        } else {
          setError(data.error || "Too many requests. Please try again later.");
          setCooldown(data.retryAfter || 60);
        }
      } else {
        setError(data.error || "Couldn't send the code. Please try Resend.");
      }
    } catch {
      setError("Couldn't send the code. Check your connection and try Resend.");
    } finally {
      if (!isAuto) setResending(false);
    }
  };

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) {
      router.push("/auth/login");
      return;
    }
    setEmail(current.email || "");
    if (current.emailVerified) {
      router.push("/");
      return;
    }
    // Send one code on arrival. The server enforces a cooldown, so if the
    // registration step already sent a code moments ago this won't duplicate.
    if (!autoSentRef.current) {
      autoSentRef.current = true;
      sendCode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    setMessage("");
    try {
      const current = auth.currentUser;
      if (!current) {
        router.push("/auth/login");
        return;
      }
      const token = await current.getIdToken();
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Refresh the token/user so emailVerified propagates, then enter the app.
        try {
          await current.reload();
          await current.getIdToken(true);
        } catch {
          // ignore; the full reload below re-initializes auth state anyway
        }
        window.location.href = "/";
        return;
      }
      setError(data.error || "Verification failed. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4 safe-padding">
      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card variant="glass" className="shadow-premium">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple mx-auto mb-4">
                <MailCheck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-center">Enter your verification code</CardTitle>
              <CardDescription className="text-center">
                We sent a 6-digit code to{" "}
                <span className="text-white font-semibold break-all">{email || "your email"}</span>.
                Enter it below to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-sm text-green-400">{message}</p>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="______"
                  className="w-full text-center text-2xl tracking-[0.5em] font-semibold"
                  autoFocus
                />

                <Button type="submit" disabled={verifying || code.length !== 6} variant="neon" className="w-full">
                  {verifying ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> Verifying...</>
                  ) : (
                    "Verify & continue"
                  )}
                </Button>
              </form>

              <Button
                onClick={() => sendCode(false)}
                disabled={resending || cooldown > 0}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
              </Button>

              <p className="text-sm text-[#D4D4D8] text-center pt-2">
                Wrong account?{" "}
                <button onClick={handleSignOut} className="text-[#7C7CFF] hover:text-[#38BDF8] font-semibold">
                  Sign out
                </button>
                {" "}or{" "}
                <Link href="/auth/login" className="text-[#7C7CFF] hover:text-[#38BDF8] font-semibold">
                  back to login
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
