import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "pending" | "danger" | "default";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-status-success/10 text-status-success": variant === "success",
          "border-transparent bg-status-pending/10 text-status-pending": variant === "pending",
          "border-transparent bg-status-danger/10 text-status-danger": variant === "danger",
          "border-gray-200 bg-gray-100 text-slate-700": variant === "default",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
