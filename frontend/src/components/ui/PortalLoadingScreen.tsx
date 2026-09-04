"use client";

import { motion } from "framer-motion";

export function PortalLoadingScreen({
  title = "Restoring Workspace",
  message = "Reconnecting to Gigly Protocol...",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F4F7FB]/95 backdrop-blur-md p-8">
      <div className="bg-white/90 border border-slate-200 shadow-xl rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-3 border-sky-500 border-t-transparent mb-4"
        />
        <h3 className="text-slate-800 font-display font-bold text-base mb-1">
          {title}
        </h3>
        <p className="text-slate-500 font-mono text-xs animate-pulse tracking-wider uppercase font-semibold">
          {message}
        </p>
      </div>
    </div>
  );
}
