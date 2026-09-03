import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "pending" | "danger" | "info" | "default" | "neutral" | string;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        {
          "border-emerald-200 bg-emerald-100 text-emerald-800": variant === "success",
          "border-amber-200 bg-amber-100 text-amber-800": variant === "pending",
          "border-error/20 bg-error-container text-on-error-container": variant === "danger",
          "border-blue-200 bg-blue-100 text-blue-800": variant === "info",
          "border-outline-variant bg-surface-container text-on-surface-variant": variant === "default" || variant === "neutral",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
