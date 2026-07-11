import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface CardProps
  extends Omit<HTMLMotionProps<"div">, "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "children"> {
  variant?: "default" | "glass" | "elevated" | "gradient";
  interactive?: boolean;
  delay?: number;
  children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, delay = 0, ...props }, ref) => {
    const variantClasses = {
      default: "glass-card",
      glass: "glass-card",
      elevated: "glass-card shadow-2xl",
      gradient: "glass-card relative overflow-hidden",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-200",
          variantClasses[variant],
          interactive ? "cursor-pointer" : "",
          className
        )}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {variant === "gradient" && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/5 via-transparent to-[#6366f1]/5 pointer-events-none" />
        )}
        {props.children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#D4D4D8] leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
