"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Higher-order component to protect pages
 */
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: ("student" | "faculty")[]
) {
  return function ProtectedPage(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
