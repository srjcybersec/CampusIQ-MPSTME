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
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
          "relative overflow-hidden group",
          {
            // Default (Modern Blue)
            "bg-[#3b82f6] text-white shadow-md-modern hover:bg-[#2563eb] hover:shadow-lg-modern": variant === "default",
            // Outline (Refined)
            "border border-[#262626] bg-[#151515] text-[#e5e5e5] hover:border-[#3b82f6] hover:bg-[#1a1a1a] hover:text-white": variant === "outline",
            // Ghost (Subtle)
            "text-[#a3a3a3] bg-transparent hover:text-white hover:bg-[#151515]": variant === "ghost",
            // Accent (Purple)
            "bg-[#6366f1] text-white shadow-md-modern hover:bg-[#4f46e5] hover:shadow-lg-modern": variant === "neon",
            // Success (Teal)
            "bg-[#10b981] text-white shadow-md-modern hover:bg-[#059669] hover:shadow-lg-modern": variant === "ai",
            // Sizes
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-5 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-14 px-8 text-lg": size === "xl",
          },
          className
        )}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
