"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PixelCard from "@/components/ui/PixelCard";
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Search, 
  Lock, 
  Check, 
  ExternalLink,
  Copy,
  Calendar,
  Sparkles
} from "lucide-react";

export function HeroSection() {
  const [activeStep, setActiveStep] = useState<number>(1); // 0: Task Assigned, 1: In Review, 2: Funded, 3: Completed
  const [copied, setCopied] = useState(false);

  const steps = [
    {
      id: 1,
      name: "Task Assigned",
      status: activeStep > 0 ? "Completed" : activeStep === 0 ? "Active" : "Pending",
      desc: "Recorded on-chain in escrow contract",
      icon: FileText,
    },
    {
      id: 2,
      name: "In Review",
      status: activeStep > 1 ? "Completed" : activeStep === 1 ? "In Review" : "Pending",
      desc: "24h client approval window",
      icon: Search,
    },
    {
      id: 3,
      name: "Funded",
      status: activeStep > 2 ? "Completed" : activeStep === 2 ? "Active" : "Pending",
      desc: "Instant cryptographic payment",
      icon: Lock,
    },
    {
      id: 4,
      name: "Completed",
      status: activeStep === 3 ? "Completed" : "Pending",
      desc: "Reputation & trust score updated",
      icon: CheckCircle2,
    },
  ];

  // Colors based on state for that glowing cyber roadmap
  const theme = activeStep === 3 
    ? {
        accent: "#10B981", // Emerald
        glow: "rgba(16, 185, 129, 0.4)",
        gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
        badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
        pathColor: "#10B981",
        label: "COMPLETED",
      }
    : activeStep === 1
    ? {
        accent: "#0DA5F0", // Hackshastra Cyan-Blue
        glow: "rgba(13, 165, 240, 0.4)",
        gradient: "from-[#0DA5F0]/20 via-[#0DA5F0]/10 to-transparent",
        badgeBg: "bg-[#E8F7FE] border-[#0DA5F0]/30 text-[#0DA5F0]",
        pathColor: "#0DA5F0",
        label: "IN REVIEW",
      }
    : activeStep === 2
    ? {
        accent: "#0284C7", // Deep Sky Blue
        glow: "rgba(2, 132, 199, 0.4)",
        gradient: "from-sky-500/20 via-sky-500/10 to-transparent",
        badgeBg: "bg-sky-500/10 border-sky-500/30 text-sky-600",
        pathColor: "#0284C7",
        label: "FUNDED",
      }
    : {
        accent: "#38BDF8", // Ice Blue
        glow: "rgba(56, 189, 248, 0.4)",
        gradient: "from-sky-400/20 via-sky-400/10 to-transparent",
        badgeBg: "bg-sky-500/10 border-sky-500/30 text-sky-600",
        pathColor: "#38BDF8",
        label: "AWAITING APPROVAL",
      };

  const handleCopy = () => {
    navigator.clipboard?.writeText("0x7F...3B9A");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative flex items-center pt-28 pb-16 sm:pb-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Left: Typography & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start text-left"
        >
          {/* Pill Badge (Hackshastra style) */}
          <div className="pill-badge mb-8">
            <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_rgba(13,165,240,0.6)]" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase font-mono">
              [ GIGLY PROTOCOL V1.0 LIVE ]
            </span>
          </div>
          
          {/* PixelCard wrapped headline for interactive blue dots on hover */}
          <PixelCard variant="blue" className="p-6 sm:p-8 border border-[#E2E8F0] shadow-sm rounded-2xl bg-white/90 mb-8 w-full">
            <h1 className="font-display text-display-sm sm:text-display-md lg:text-display-lg text-[#071014] leading-[1.02] font-black tracking-tighter">
              Secure freelance <br />
              payments on-chain. <br />
              <span className="text-[#0DA5F0]">Zero friction.</span>
            </h1>
          </PixelCard>
          
          <p className="text-body-lg text-[#1e293b] font-semibold mb-10 max-w-md leading-relaxed">
            Manage and secure your freelance payments from one powerful platform. Gasless, instant, and unconditionally protected by smart contracts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/login"
              className="btn-gradient-primary text-sm font-extrabold tracking-wider uppercase group"
            >
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#features"
              className="btn-ghost text-sm font-extrabold tracking-wider uppercase"
            >
              Explore Protocol <ChevronRight className="w-4 h-4 text-[#1e293b]" />
            </Link>
          </div>
        </motion.div>

        {/* Right: Curved Roadmap Escrow Tracker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full"
        >
          {/* Outer Glass Card Container */}
          <div className="relative rounded-3xl bg-white/95 border border-[#E2E8F0] p-6 sm:p-7 shadow-level-2 backdrop-blur-xl overflow-hidden group">
            
            {/* Ambient dynamic back-glow matching active state */}
            <div 
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[90px] pointer-events-none transition-all duration-700 opacity-20"
              style={{ background: theme.accent }}
            />
            
            {/* Top Bar: Title, Status, Details button */}
            <div className="flex items-center justify-between pb-6 border-b border-[#E2E8F0] relative z-10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500"
                  style={{
                    backgroundColor: `${theme.accent}15`,
                    borderColor: `${theme.accent}40`,
                    boxShadow: `0 0 16px ${theme.glow}`,
                  }}
                >
                  <ShieldCheck className="w-5 h-5 transition-colors duration-500" style={{ color: theme.accent }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-[#071014] text-base tracking-wide flex items-center gap-2">
                    Smart Escrow
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border transition-all duration-500 ${theme.badgeBg}`}
                    >
                      {theme.label}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">Job #1024</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono text-xl font-bold text-[#071014] tracking-tight">
                    $1,250.00
                  </div>
                  <div className="text-[10px] text-[#64748B] uppercase font-mono tracking-wider">USDC Locked</div>
                </div>

                <Link 
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-[#334155] hover:text-[#0DA5F0] px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#0DA5F0]/30 bg-[#F4F7F8] transition-colors"
                >
                  View Details <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>

            {/* CURVED ROADMAP SVG CANVAS */}
            <div className="relative py-8 my-2 z-10 overflow-visible">
              
              {/* SVG Curved Wave Path */}
              <svg 
                className="w-full h-32 overflow-visible"
                viewBox="0 0 520 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Glowing Filter */}
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  
                  {/* Linear Gradient along path */}
                  <linearGradient id="active-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0DA5F0" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Inactive Dashed Background Track (The continuous S-curve) */}
                <path
                  d="M 50 60 C 100 20, 140 100, 190 60 C 240 20, 280 100, 330 60 C 380 20, 420 100, 470 60"
                  stroke="#E2E8F0"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  fill="none"
                />

                {/* Active Luminous Foreground Track with Flow Animation */}
                <path
                  d={
                    activeStep === 0
                      ? "M 50 60 C 100 20, 140 100, 190 60"
                      : activeStep === 1
                      ? "M 50 60 C 100 20, 140 100, 190 60 C 240 20, 280 100, 330 60"
                      : activeStep === 2
                      ? "M 50 60 C 100 20, 140 100, 190 60 C 240 20, 280 100, 330 60 C 380 20, 420 100, 470 60"
                      : "M 50 60 C 100 20, 140 100, 190 60 C 240 20, 280 100, 330 60 C 380 20, 420 100, 470 60"
                  }
                  stroke={theme.pathColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#neon-glow)"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* 4 Interactive Waypoint Nodes Placed on the Curve */}
              <div className="absolute inset-0 flex justify-between items-center px-4 sm:px-6 pointer-events-none">
                {steps.map((s, idx) => {
                  const isCurrent = activeStep === idx;
                  const isCompleted = activeStep > idx;
                  const Icon = s.icon;

                  return (
                    <div 
                      key={s.id}
                      className="flex flex-col items-center pointer-events-auto cursor-pointer group/node"
                      onClick={() => setActiveStep(idx)}
                    >
                      {/* Floating Indicator / Icon Pill */}
                      <div className="relative mb-2">
                        {isCurrent && (
                          <motion.div
                            layoutId="node-pulse"
                            className="absolute -inset-2 rounded-full blur-md opacity-70"
                            style={{ background: theme.accent }}
                            transition={{ duration: 0.4 }}
                          />
                        )}

                        {/* Node Circle */}
                        <div 
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative z-10 border ${
                            isCurrent
                              ? "text-white border-[#0DA5F0] scale-110 shadow-lg"
                              : isCompleted
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/40"
                              : "bg-[#F4F7F8] text-[#64748B] border-[#E2E8F0] hover:border-[#0DA5F0]/40 hover:text-[#0DA5F0]"
                          }`}
                          style={{
                            backgroundColor: isCurrent ? theme.accent : undefined,
                            boxShadow: isCurrent ? `0 0 24px ${theme.glow}` : undefined,
                          }}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <span>{s.id}</span>
                          )}
                        </div>

                        {/* Tiny Floating Category Icon Above Active Node */}
                        {isCurrent && (
                          <motion.div
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-lg bg-[#0DA5F0] border border-[#0DA5F0] flex items-center justify-center text-white shadow-md"
                          >
                            <Icon className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Node Label & Subtext */}
                      <div className="text-center mt-1">
                        <span 
                          className={`block text-xs font-semibold tracking-wide transition-colors ${
                            isCurrent ? "text-[#071014]" : isCompleted ? "text-[#334155]" : "text-[#64748B]"
                          }`}
                        >
                          {s.name}
                        </span>
                        <span 
                          className={`hidden sm:block text-[10px] max-w-[90px] mx-auto mt-0.5 leading-tight ${
                            isCompleted ? "text-emerald-600 font-medium" : isCurrent ? "text-[#0DA5F0]" : "text-[#94A3B8]"
                          }`}
                        >
                          {isCompleted ? "Completed" : s.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
