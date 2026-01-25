import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[#1a1a1a] bg-[#161616]/50 px-4 py-2.5 text-sm text-white",
          "ring-offset-black",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-[#D4D4D8]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C7CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "focus-visible:border-[#7C7CFF]",
          "disabled:cursor-not-allowed disabled:opacity-50",
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
Input.displayName = "Input";

export { Input };
