import { Info } from "lucide-react";
import { SIGNUPS_CLOSED_MESSAGE } from "@/lib/auth/registration";

export function SignupsClosedNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-3 rounded-lg border border-amber-400/40 bg-amber-400/10 ${className}`}
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
      <p className="text-sm text-amber-100">{SIGNUPS_CLOSED_MESSAGE}</p>
    </div>
  );
}
