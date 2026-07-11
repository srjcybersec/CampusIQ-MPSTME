"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth/registration";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("student" | "faculty")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();

  const isAllowedDomain = !!user?.email?.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (!isAllowedDomain) {
      // Non-MPSTME account somehow signed in — block it.
      router.push("/auth/login");
    } else if (!user.emailVerified) {
      router.push("/auth/verify-email");
    }
  }, [user, loading, router, isAllowedDomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center glow-purple mx-auto mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </motion.div>
          <p className="text-[#D4D4D8]">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !isAllowedDomain || !user.emailVerified) {
    return null; // Will redirect
  }

  // Check role-based access
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card variant="glass" className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page. This page is only available for: {allowedRoles.join(", ")}.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
