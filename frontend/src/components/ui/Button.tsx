"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed overflow-hidden",
          // Border radius
          "rounded-xl",
          // Size variants
          {
            "text-xs px-3 py-1.5 gap-1.5 rounded-lg": size === "sm",
            "text-sm px-5 py-2.5 gap-2": size === "md",
            "text-base px-6 py-3 gap-2.5": size === "lg",
          },
          // Color variants
          {
            // Primary: Violet gradient with glow
            "bg-gradient-to-r from-accent to-accent-light text-white shadow-glow-accent hover:shadow-glow-primary": variant === "primary",
            // Outline: Glass border with subtle fill
            "border border-glass-border-light bg-glass-subtle text-on-surface-variant hover:text-on-surface hover:bg-glass-light hover:border-accent/30": variant === "outline",
            // Ghost: Transparent with hover fill
            "text-on-surface-variant hover:text-on-surface hover:bg-glass-light": variant === "ghost",
            // Danger: Error colored
            "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:border-error/40": variant === "danger",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
