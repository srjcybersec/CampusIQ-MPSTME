import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-[#1a1a1a] bg-[#161616]/50 px-4 py-3 text-sm text-white",
          "ring-offset-black",
          "placeholder:text-[#D4D4D8]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C7CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "focus-visible:border-[#7C7CFF]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          "transition-all duration-200",
          "hover:border-[#333333]",
          "glass",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
