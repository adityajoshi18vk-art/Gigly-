"use client";
import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-on-background/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-50 w-full max-w-lg mx-4"
          >
            <div className="bg-surface-container-lowest border border-outline-variant shadow-level-2 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-variant p-4 bg-surface-container-lowest">
                <h2 className="text-lg font-semibold text-on-surface tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-outline-variant/20 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
