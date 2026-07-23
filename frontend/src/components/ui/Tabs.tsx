import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex items-center space-x-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap hide-scrollbar", className)}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive ? "text-primary" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {tab}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
