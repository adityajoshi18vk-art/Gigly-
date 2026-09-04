"use client";
import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  isDismissible?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = "lg", isDismissible = true }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop — darkened overlay with blur for contrast */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#071014]/50 backdrop-blur-sm"
            onClick={isDismissible ? onClose : undefined}
          />
          
          {/* Dialog */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`relative z-50 w-full mx-4 ${
              size === "sm" ? "max-w-sm" :
              size === "md" ? "max-w-md" :
              size === "lg" ? "max-w-lg" :
              "max-w-xl"
            }`}
          >
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Top edge highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-glass-border p-5">
                <h2 className="text-lg font-semibold text-on-surface tracking-tight">{title}</h2>
                {isDismissible && (
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-glass-light transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
