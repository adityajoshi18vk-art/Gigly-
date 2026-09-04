import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "pending" | "danger" | "info" | "default" | "neutral" | string;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none backdrop-blur-sm",
        {
          // Success: Emerald on dark
          "border-success/20 bg-success/10 text-success-light": variant === "success",
          // Pending: Amber/warm on dark
          "border-warning/20 bg-warning/10 text-warning": variant === "pending",
          // Danger: Red on dark
          "border-error/20 bg-error/10 text-error": variant === "danger",
          // Info: Blue on dark
          "border-info/20 bg-info/10 text-info": variant === "info",
          // Default/Neutral: Glass pill
          "border-glass-border bg-glass-light text-on-surface-variant": variant === "default" || variant === "neutral",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
