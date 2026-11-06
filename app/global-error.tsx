"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#D4D4D8", fontSize: 14, marginBottom: 16 }}>
              The app hit an unexpected error.
            </p>
            {error?.message && (
              <pre style={{ textAlign: "left", fontSize: 12, color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 16, overflow: "auto", maxHeight: 160, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {error.message}
              </pre>
            )}
            <button
              onClick={reset}
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "linear-gradient(to right, #7C7CFF, #38BDF8)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
