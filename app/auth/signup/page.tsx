"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/lib/auth/context";
import {
  PROGRAMS,
  BRANCHES,
  YEARS,
  ALLOWED_EMAIL_DOMAIN,
  validateRegistration,
  normalizeUsername,
  type RegistrationInput,
} from "@/lib/auth/registration";
import { Mail, Lock, User, IdCard, AtSign, Phone, GraduationCap, BookOpen, CheckCircle2, XCircle, Loader2, MailCheck, RefreshCw } from "lucide-react";

type FormState = RegistrationInput & { confirmPassword: string };
type Step = "form" | "otp" | "done";

const initialForm: FormState = {
  name: "",
  username: "",
  email: "",
  sapId: "",
  program: "",
  branch: "",
  year: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const checkUsername = useCallback(async (username: string) => {
    const normalized = normalizeUsername(username);
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(normalized)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (!form.username) {
      setUsernameStatus("idle");
      return;
    }
    const t = setTimeout(() => checkUsername(form.username), 500);
    return () => clearTimeout(t);
  }, [form.username, checkUsername]);

  // Step 1: validate + send the code (no account created yet).
  const startRegistration = async () => {
    const res = await fetch("/api/auth/register/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        email: form.email,
        sapId: form.sapId,
        program: form.program,
        branch: form.branch,
        year: form.year,
        phone: form.phone,
        password: form.password,
      }),
    });
    return res;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const errors = validateRegistration(form);
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await startRegistration();
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data.error || "Could not start registration. Please try again.");
        setLoading(false);
        return;
      }

      setStep("otp");
      setMessage("We emailed a 6-digit code to your college inbox. Check spam/quarantine too.");
      setCooldown(60);
    } catch {
      setError("We couldn't reach the server. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await startRegistration();
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("A new code is on its way. Check your inbox (and spam/quarantine).");
        setCooldown(60);
      } else if (res.status === 429) {
        setMessage(data.error || "Please wait before requesting another code.");
        setCooldown(data.retryAfter || 60);
      } else {
        setError(data.error || "Couldn't resend the code. Please try again.");
      }
    } catch {
      setError("Couldn't resend the code. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: verify the code -> account is created verified, then sign in.
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          code: code.trim(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Verification failed. Please try again.");
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // Account now exists and is verified — sign in and enter the app.
      try {
        await signInWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
        router.push("/");
      } catch {
        // Account created; auto sign-in blocked (network/VPN). Send to login.
        setStep("done");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    } finally {
      submittingRef.current = false;
    }
  };

  const inputError = (key: string) =>
    fieldErrors[key] ? <p className="text-xs text-red-400 mt-1">{fieldErrors[key]}</p> : null;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-3 sm:p-4 py-10 safe-padding">
      <div className="w-full max-w-lg relative z-10">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/campusiq-logo.png" alt="CampusIQ Logo" width={64} height={64} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" priority />
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">CampusIQ</h1>
              <p className="text-xs sm:text-sm text-[#D4D4D8] -mt-0.5 font-medium">MPSTME</p>
            </div>
          </div>
          <p className="text-[#D4D4D8] text-lg">Create your student account</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Card variant="glass" className="shadow-premium">
            {step === "done" ? (
              <CardContent className="text-center py-8 space-y-4">
                <div className="w-14 h-14 bg-green-500/20 border border-green-500/40 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Account verified & created!</p>
                  <p className="text-[#D4D4D8] text-sm mt-1">Please sign in to continue.</p>
                </div>
                <Link href="/auth/login">
                  <Button variant="neon" className="w-full">Go to Sign In</Button>
                </Link>
              </CardContent>
            ) : step === "otp" ? (
              <>
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple mx-auto mb-2">
                    <MailCheck className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-center">Enter your verification code</CardTitle>
                  <CardDescription className="text-center">
                    We sent a 6-digit code to{" "}
                    <span className="text-white font-semibold break-all">{form.email}</span>.
                    Your account is created only after you enter it.
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
                    <Button type="submit" disabled={loading || code.length !== 6} variant="neon" className="w-full">
                      {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> Verifying...</>) : "Verify & create account"}
                    </Button>
                  </form>

                  <Button onClick={handleResend} disabled={resending || cooldown > 0} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2 inline" />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
                  </Button>

                  <p className="text-sm text-[#D4D4D8] text-center pt-2">
                    Entered the wrong details?{" "}
                    <button
                      onClick={() => { setStep("form"); setCode(""); setError(""); setMessage(""); }}
                      className="text-[#7C7CFF] hover:text-[#38BDF8] font-semibold"
                    >
                      Go back
                    </button>
                  </p>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Student Registration</CardTitle>
                  <CardDescription>
                    Use your official MPSTME email (@{ALLOWED_EMAIL_DOMAIN}). We&apos;ll email you a code to verify it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                        <User className="w-4 h-4 inline mr-1" /> Full Name
                      </label>
                      <Input id="name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Aditi Sharma" className="w-full" />
                      {inputError("name")}
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                        <AtSign className="w-4 h-4 inline mr-1" /> Username <span className="text-[#71717A] font-normal">(shown on your dashboard)</span>
                      </label>
                      <div className="relative">
                        <Input id="username" type="text" value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="e.g. aditi_s" className="w-full pr-9" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-[#71717A] animate-spin" />}
                          {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      {usernameStatus === "available" && <p className="text-xs text-green-400 mt-1">Username is available.</p>}
                      {usernameStatus === "taken" && <p className="text-xs text-red-400 mt-1">This username is already taken.</p>}
                      {inputError("username")}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        <Mail className="w-4 h-4 inline mr-1" /> College Email
                      </label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder={`your.name@${ALLOWED_EMAIL_DOMAIN}`} className="w-full" />
                      {inputError("email")}
                    </div>

                    <div>
                      <label htmlFor="sapId" className="block text-sm font-medium text-white mb-2">
                        <IdCard className="w-4 h-4 inline mr-1" /> SAP ID <span className="text-[#71717A] font-normal">(11 digits)</span>
                      </label>
                      <Input id="sapId" type="text" inputMode="numeric" maxLength={11} value={form.sapId} onChange={(e) => update("sapId", e.target.value.replace(/\D/g, ""))} placeholder="e.g. 70012300001" className="w-full" />
                      {inputError("sapId")}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="program" className="block text-sm font-medium text-white mb-2">
                          <GraduationCap className="w-4 h-4 inline mr-1" /> Program
                        </label>
                        <select id="program" value={form.program} onChange={(e) => update("program", e.target.value)} className="w-full rounded-lg bg-[#161616] border border-[#222222] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C7CFF]">
                          <option value="">Select program</option>
                          {PROGRAMS.map((p) => (<option key={p} value={p}>{p}</option>))}
                        </select>
                        {inputError("program")}
                      </div>
                      <div>
                        <label htmlFor="year" className="block text-sm font-medium text-white mb-2">Year</label>
                        <select id="year" value={form.year} onChange={(e) => update("year", e.target.value)} className="w-full rounded-lg bg-[#161616] border border-[#222222] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C7CFF]">
                          <option value="">Select year</option>
                          {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
                        </select>
                        {inputError("year")}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="branch" className="block text-sm font-medium text-white mb-2">
                        <BookOpen className="w-4 h-4 inline mr-1" /> Branch / Specialization
                      </label>
                      <select id="branch" value={form.branch} onChange={(e) => update("branch", e.target.value)} className="w-full rounded-lg bg-[#161616] border border-[#222222] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C7CFF]">
                        <option value="">Select branch</option>
                        {BRANCHES.map((b) => (<option key={b} value={b}>{b}</option>))}
                      </select>
                      {inputError("branch")}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                        <Phone className="w-4 h-4 inline mr-1" /> Phone <span className="text-[#71717A] font-normal">(optional)</span>
                      </label>
                      <Input id="phone" type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile number" className="w-full" />
                      {inputError("phone")}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                          <Lock className="w-4 h-4 inline mr-1" /> Password
                        </label>
                        <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 8 chars" className="w-full" />
                        {inputError("password")}
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                          <Lock className="w-4 h-4 inline mr-1" /> Confirm
                        </label>
                        <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter password" className="w-full" />
                        {inputError("confirmPassword")}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <Button type="submit" disabled={loading || usernameStatus === "taken"} variant="neon" className="w-full">
                      {loading ? "Sending code..." : "Continue"}
                    </Button>
                  </form>

                  <p className="text-sm text-[#D4D4D8] text-center mt-6">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-[#7C7CFF] hover:text-[#38BDF8] font-semibold">Sign in</Link>
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
