import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "children"> {
  variant?: "default" | "outline" | "ghost" | "neon" | "ai";
  size?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-50",
          "relative overflow-hidden group",
          {
            // Default (Professional Blue)
            "bg-[#2563eb] text-white shadow-professional": variant === "default",
            // Outline
            "border border-[#2a2a2a] bg-[#1a1a1a] text-white": variant === "outline",
            // Ghost
            "text-[#a0a0a0] bg-transparent": variant === "ghost",
            // Neon (Accent Purple)
            "bg-[#6366f1] text-white shadow-professional": variant === "neon",
            // AI (Accent Teal)
            "bg-[#14b8a6] text-white shadow-professional": variant === "ai",
            // Sizes
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-14 px-8 text-lg": size === "xl",
          },
          className
        )}
        style={{
          color: variant === "default" || variant === "neon" || variant === "ai" ? "#ffffff" : undefined,
        }}
        ref={ref}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
