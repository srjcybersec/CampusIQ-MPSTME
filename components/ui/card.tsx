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
      elevated: "glass-card shadow-lg-modern",
      gradient: "glass-card relative overflow-hidden",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variantClasses[variant],
          interactive ? "cursor-pointer hover-lift" : "",
          className
        )}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          delay, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        whileHover={interactive ? { 
          y: -4,
          transition: { duration: 0.2 }
        } : undefined}
        {...props}
      >
        {variant === "gradient" && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 via-transparent to-[#6366f1]/5 pointer-events-none opacity-50" />
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
    className={cn("flex flex-col space-y-2.5 p-6 pb-4", className)}
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
      "text-xl font-semibold leading-tight tracking-tight text-[#ffffff]",
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
    className={cn("text-sm text-[#a3a3a3] leading-relaxed", className)}
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
