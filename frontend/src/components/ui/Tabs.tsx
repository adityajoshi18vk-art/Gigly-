"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("relative flex items-center gap-1 p-1 rounded-xl bg-glass-light border border-glass-border overflow-x-auto whitespace-nowrap hide-scrollbar", className)}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              isActive
                ? "text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-glass-subtle"
            )}
          >
            {/* Active tab indicator — animated pill background */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-glass-medium border border-glass-border-light shadow-inner-glow"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
