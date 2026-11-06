"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-white text-2xl font-bold">!</span>
        </div>
        <h1 className="text-white text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-[#D4D4D8] text-sm mb-4">
          The page hit an unexpected error. You can try again below.
        </p>
        {error?.message && (
          <pre className="text-left text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 overflow-auto max-h-40 whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] text-white font-semibold text-sm"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="px-4 py-2.5 rounded-lg border border-[#2a2a2a] text-[#D4D4D8] font-semibold text-sm"
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}
