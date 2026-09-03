"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";

export function HeroSection() {
  const [step, setStep] = useState(0);
  const [view, setView] = useState<'freelancer' | 'client'>('freelancer');

  const handleStepClick = (targetStep: number) => {
    // Only allow clicking steps that are already completed, active, or the immediately next step
    if (targetStep <= step + 1) {
      setStep(targetStep);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden px-6 lg:px-12 bg-background">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-center relative z-10">
        
        {/* Left: Typography & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start text-left"
        >
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="flex w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-white/80 tracking-wide">Gigly Protocol v1.0 Live</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] tracking-tight mb-8">
            Secure freelance <br />
            payments on-chain. <br />
            <span className="text-white/40">Zero friction.</span>
          </h1>
          
          <p className="text-lg text-white/60 font-normal mb-10 max-w-md leading-relaxed">
            Manage and secure your freelance payments from one powerful platform. Gasless, instant, and unconditionally protected by smart contracts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/login"
              className="bg-white text-black px-6 py-3 rounded-full font-medium text-sm hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              Launch App <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#features"
              className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full font-medium text-sm hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              Explore Protocol <ChevronRight className="w-4 h-4 text-white/50" />
            </Link>
          </div>
        </motion.div>

        {/* Right: Abstract UI Representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:flex flex-col items-center justify-center w-full"
        >
          {/* View Toggle */}
          <div className="mb-6 z-30 flex items-center bg-[#111] rounded-lg p-1 border border-white/10 shadow-sm relative">
            <button 
              onClick={() => setView('freelancer')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${view === 'freelancer' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Freelancer View
            </button>
            <button 
              onClick={() => setView('client')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${view === 'client' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Client View
            </button>
          </div>

          <div className="relative w-full max-w-md mx-auto group">
            {/* Main Abstract Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-hidden relative"
            >
              
              {/* Header */}
              <div className="flex items-start justify-between relative z-10 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${step === 2 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-white/80'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white/90 text-sm font-medium tracking-wide">Smart Escrow</div>
                    <div className={`text-[10px] font-medium uppercase tracking-wider mt-1 transition-colors ${step === 2 ? 'text-emerald-500' : 'text-white/40'}`}>
                      {step === 0 ? "Awaiting Work" : step === 1 ? "Awaiting Approval" : "Completed"}
                    </div>
                  </div>
                </div>
                <div className="text-white/90 text-lg font-mono font-medium tracking-tight">
                  $1,250.00
                </div>
              </div>

              {/* Progress/Timeline Abstract */}
              <div className="mt-6 space-y-6 relative z-10">
                {/* Step 0: Assigned */}
                <div 
                  onClick={() => handleStepClick(0)}
                  className={`flex items-center gap-4 group/item cursor-pointer transition-all duration-200 ${step >= 0 ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${step > 0 ? "bg-white/10 text-white" : step === 0 ? "bg-white text-black" : "border border-white/20"}`}>
                    {step > 0 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step === 0 ? (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    ) : null}
                  </div>
                  <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
                     <AnimatePresence>
                       {step >= 0 && (
                         <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 w-full ${step > 0 ? "bg-white/20" : "bg-white"}`}
                         />
                       )}
                     </AnimatePresence>
                  </div>
                  <div className={`text-xs font-medium w-32 text-right transition-colors ${step === 0 ? "text-white" : step > 0 ? "text-white/60" : "text-white/30"}`}>
                    {view === 'freelancer' 
                      ? (step > 0 ? "Funded" : "Task Assigned") 
                      : (step > 0 ? "Funded" : "Fund Escrow")}
                  </div>
                </div>
                
                {/* Step 1: Review */}
                <div 
                  onClick={() => handleStepClick(1)}
                  className={`flex items-center gap-4 group/item cursor-pointer transition-all duration-200 ${step >= 1 ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${step > 1 ? "bg-white/10 text-white" : step === 1 ? "bg-white text-black" : "border border-white/20 group-hover/item:border-white/40"}`}>
                    {step > 1 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step === 1 ? (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    ) : null}
                  </div>
                  <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
                    <AnimatePresence>
                      {step === 1 && (
                        <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: ["-100%", "300%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />
                      )}
                      {step > 1 && (
                         <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 w-full bg-white/20" 
                         />
                       )}
                    </AnimatePresence>
                  </div>
                  <div className={`text-xs font-medium w-32 text-right transition-colors ${step === 1 ? "text-white" : step > 1 ? "text-white/60" : "text-white/30"}`}>
                    {view === 'freelancer'
                      ? (step === 1 ? "In Review" : step > 1 ? "Reviewed" : "Submit for Review")
                      : (step === 1 ? "Review Work" : step > 1 ? "Approved" : "Awaiting Work")}
                  </div>
                </div>
                
                {/* Step 2: Released */}
                <div 
                  onClick={() => handleStepClick(2)}
                  className={`flex items-center gap-4 group/item transition-all duration-200 ${step >= 2 ? "opacity-100 cursor-pointer" : step >= 1 ? "opacity-40 hover:opacity-100 cursor-pointer" : "opacity-20 cursor-not-allowed"}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${step === 2 ? "bg-emerald-500 text-white" : "border border-white/20 group-hover/item:border-white/40"}`}>
                     {step === 2 && (
                       <CheckCircle2 className="w-4 h-4 text-white" />
                     )}
                  </div>
                  <div className="flex-1 h-px bg-white/10 overflow-hidden relative">
                     {step === 2 && (
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 w-full bg-emerald-500/50" 
                        />
                     )}
                  </div>
                  <div className={`text-xs font-medium w-32 text-right transition-colors ${step === 2 ? "text-emerald-500" : "text-white/30"}`}>
                    {view === 'freelancer'
                      ? (step === 2 ? "Funds Released" : "Release Funds")
                      : (step === 2 ? "Funds Released" : "Approve & Release")}
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="mt-8 pt-4 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {view === 'freelancer' ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-[#222] border-2 border-[#0a0a0a] flex items-center justify-center text-[8px] text-white/50 z-10">C</div>
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-[#0a0a0a] flex items-center justify-center text-[8px] text-black font-medium z-20">U</div>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-[#0a0a0a] flex items-center justify-center text-[8px] text-black font-medium z-20">U</div>
                        <div className="w-6 h-6 rounded-full bg-[#222] border-2 border-[#0a0a0a] flex items-center justify-center text-[8px] text-white/50 z-10">F</div>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 font-medium">Participants</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono bg-white/5 px-2 py-1 rounded-md">
                  <div className={`w-1 h-1 rounded-full ${step === 2 ? 'bg-emerald-500' : 'bg-white/50'}`} />
                  0x7F...3B9A
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
