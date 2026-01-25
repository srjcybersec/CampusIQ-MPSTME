import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"> {
  variant?: "default" | "outline" | "ghost" | "neon" | "ai";
  size?: "sm" | "md" | "lg" | "xl";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C7CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-50",
          "relative overflow-hidden group",
          "liquid-hover",
          {
            // Default (Purple to Blue gradient)
            "bg-gradient-to-r from-[#7C7CFF] to-[#38BDF8] text-white glow-purple": variant === "default",
            // Outline
            "border-2 border-[#1a1a1a] bg-[#161616]/50 text-white hover:border-[#7C7CFF]/50 hover:bg-[#161616]": variant === "outline",
            // Ghost
            "text-[#D4D4D8] hover:text-white hover:bg-[#161616]/50": variant === "ghost",
            // Neon (Orange to Pink)
            "bg-gradient-to-r from-[#FB923C] to-[#EC4899] text-white glow-orange": variant === "neon",
            // AI (Cyan to Purple)
            "bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white glow-blue": variant === "ai",
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        data-cursor-hover
        {...props}
      >
        {/* Shimmer effect */}
        {(variant === "default" || variant === "neon" || variant === "ai") && (
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
