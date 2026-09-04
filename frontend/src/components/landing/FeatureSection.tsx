"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, FastForward } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function FeatureSection() {
  return (
    <section id="features" className="py-20 sm:py-24 px-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto space-y-28">
        
        {/* Feature 1: Deterministic Escrow */}
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pill-badge mb-6">
              <span className="text-xs font-semibold text-primary tracking-wider uppercase font-mono">[ PAYMENT SECURITY ]</span>
            </div>
            <h2 className="font-display text-display-sm md:text-display-md text-[#071014] font-black tracking-tight leading-[1.08] mb-6">
              Deterministic Escrow
            </h2>
            <p className="text-body-lg text-[#1e293b] leading-relaxed max-w-md mb-6 font-semibold">
              Eliminate payment anxiety. Funds are locked securely in an immutable smart contract before work begins, and released instantly upon approval.
            </p>
            <div className="flex flex-col gap-3 text-sm font-bold text-[#1e293b]">
              <div className="flex items-center gap-3"><span className="connector-dot"/><span>Guaranteed deposits</span></div>
              <div className="flex items-center gap-3"><span className="connector-dot"/><span>Milestone-based releases</span></div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <InteractiveEscrowCard />
          </motion.div>
        </div>

        {/* Gasless Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="py-20 flex flex-col items-center text-center relative"
        >
          {/* Top/bottom dividers */}
          <div className="absolute top-0 inset-x-0 section-divider" />
          <div className="absolute bottom-0 inset-x-0 section-divider" />
          
          {/* Atmospheric glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
          
          <h2 className="font-display text-display-md md:text-display-lg text-[#071014] font-black tracking-tight mb-6 z-10">
            <span className="text-gradient-warm">Gasless</span> Transactions.
          </h2>
          <p className="text-body-lg md:text-xl text-[#1e293b] leading-relaxed max-w-2xl font-semibold z-10">
            Powered by a sophisticated meta-transaction relay network. You never have to pay network fees, manage seed phrases, or understand blockchain mechanics. Simply sign in and start working.
          </p>
        </motion.div>

        {/* Feature 2: Freelancer Protection */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <InteractiveDisputeCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="pill-badge mb-8">
              <span className="text-xs font-semibold text-primary tracking-wider uppercase font-mono">[ FREELANCER PROTECTION ]</span>
            </div>
            <h2 className="font-display text-display-sm md:text-display-md text-[#071014] font-black tracking-tight leading-[1.08] mb-8">
              Cryptographic Guarantees.
            </h2>
            <p className="text-body-lg text-[#1e293b] leading-relaxed max-w-md mb-8 font-semibold">
              When you submit work, a 24-hour cryptographically enforced timer begins. If the client is unresponsive, the contract auto-releases your funds. In case of issues, a decentralized Arbiter ensures fair resolution.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#071014] hover:text-primary transition-colors group">
              Read the documentation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function InteractiveEscrowCard() {
  const [status, setStatus] = useState<"locked" | "submitting" | "submitted">("locked");

  const handleSubmit = () => {
    if (status !== "locked") return;
    setStatus("submitting");
    setTimeout(() => {
      setStatus("submitted");
      setTimeout(() => setStatus("locked"), 4000);
    }, 1500);
  };

  return (
    <div className="surface-card-interactive rounded-2xl p-10 cursor-pointer group relative overflow-hidden" onClick={handleSubmit}>
      {/* Accent glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/8 blur-[60px] rounded-full pointer-events-none" />
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      
      <div className="flex justify-between items-end mb-12 border-b border-glass-border pb-6 relative z-10">
        <div>
          <div className="text-slate-600 font-mono font-bold text-[11px] tracking-widest uppercase mb-2">Escrow Contract</div>
          <div className="text-slate-900 font-bold text-lg tracking-wide">Active Agreement</div>
        </div>
        <div className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 border rounded-full transition-colors duration-300 ${status === "submitted" ? "border-accent/50 bg-accent/10 text-primary font-bold" : "border-slate-300 text-slate-700 font-bold"}`}>
          {status === "locked" ? "Funds Secured" : status === "submitting" ? "Processing" : "In Review"}
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="bg-glass-subtle p-5 border border-glass-border rounded-xl">
          <div className="text-slate-600 font-mono font-bold text-[11px] tracking-widest uppercase mb-2">Deliverable</div>
          <div className="text-slate-900 font-semibold">Full-Stack Application Development</div>
        </div>
        
        <div className="bg-glass-subtle p-5 border border-glass-border rounded-xl">
          <div className="text-slate-600 font-mono font-bold text-[11px] tracking-widest uppercase mb-2">Total Value Locked</div>
          <div className="text-3xl text-slate-950 font-bold tracking-tight">$4,500 <span className="text-sm font-bold text-primary font-mono">USDC</span></div>
        </div>
        
        <button 
          className={`w-full py-4 mt-2 text-[12px] font-bold tracking-widest uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            status === "locked" 
              ? "btn-gradient-primary shadow-sm" 
              : status === "submitting"
              ? "bg-slate-100 text-slate-800 cursor-wait border border-slate-300"
              : "bg-blue-50 border border-blue-300 text-primary cursor-default"
          }`}
        >
          {status === "locked" && "Simulate Submission"}
          {status === "submitting" && "Verifying Proof..."}
          {status === "submitted" && <><CheckCircle2 className="w-4 h-4" /> Proof Submitted</>}
        </button>
      </div>
    </div>
  );
}

function InteractiveDisputeCard() {
  const [state, setState] = useState<"review" | "approved" | "disputed" | "autorelease">("review");
  const [timeLeft, setTimeLeft] = useState(24 * 3600 - 18);

  useEffect(() => {
    if (state === "review") {
      const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleApprove = () => {
    setState("approved");
    setTimeout(() => reset(), 4000);
  };

  const handleDispute = () => {
    setState("disputed");
    setTimeout(() => reset(), 4000);
  };

  const handleGhost = () => {
    const interval = setInterval(() => setTimeLeft(t => Math.max(0, t - 3600)), 50);
    setTimeout(() => {
      clearInterval(interval);
      setTimeLeft(0);
      setState("autorelease");
      setTimeout(() => reset(), 4000);
    }, 1000);
  };

  const reset = () => {
    setState("review");
    setTimeLeft(24 * 3600 - 18);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="surface-card-interactive rounded-2xl p-10 relative overflow-hidden">
      {/* Accent glow */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-accent/8 blur-[60px] rounded-full pointer-events-none" />
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      
      <div className="flex justify-between items-end mb-12 border-b border-glass-border pb-6 relative z-10">
        <div>
          <div className="text-slate-600 font-mono font-bold text-[11px] tracking-widest uppercase mb-2">
            Status: {state === "review" ? "Awaiting Client" : state === "approved" ? "Resolved" : state === "autorelease" ? "Auto-Resolved" : "Frozen"}
          </div>
          <div className="text-slate-950 font-bold text-lg tracking-wide">
            {state === "review" && "Review Period Active"}
            {state === "approved" && "Payment Released"}
            {state === "autorelease" && "Auto-Release Triggered"}
            {state === "disputed" && "Arbiter Reviewing"}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-2xl font-bold tracking-tight transition-colors ${state === "autorelease" ? "text-slate-500" : "text-slate-950"}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-primary font-mono font-bold text-[11px] tracking-widest uppercase mt-1">
            {state === "review" ? "Time Remaining" : "Timer Stopped"}
          </div>
        </div>
      </div>
      
      <div className="h-40 flex items-center justify-center relative z-10">
        {state === "review" ? (
          <div className="w-full flex gap-4">
            <button onClick={handleApprove} className="flex-1 btn-gradient-primary rounded-xl font-bold text-[11px] tracking-widest uppercase py-4 shadow-sm">
              Approve Work
            </button>
            <button onClick={handleDispute} className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-800 hover:text-slate-950 font-bold text-[11px] tracking-widest uppercase py-4 transition-colors shadow-sm">
              Dispute
            </button>
          </div>
        ) : (
          <div className="w-full bg-slate-50 border border-slate-200 p-6 rounded-xl text-center">
             {state === "approved" && <span className="text-slate-800 font-mono text-sm font-semibold tracking-wide">Transaction finalized. Client approved.</span>}
             {state === "autorelease" && <span className="text-slate-800 font-mono text-sm font-semibold tracking-wide">Client inactive. Contract auto-executed.</span>}
             {state === "disputed" && <span className="text-slate-800 font-mono text-sm font-semibold tracking-wide">Funds frozen. Sent to Arbiter.</span>}
          </div>
        )}
      </div>

      {state === "review" && (
        <button onClick={handleGhost} className="w-full mt-6 text-[11px] font-mono font-bold tracking-widest uppercase text-slate-600 hover:text-slate-950 transition-colors py-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-100/70 relative z-10">
          <FastForward className="w-3.5 h-3.5 text-primary" /> Simulate Client Inactivity
        </button>
      )}
    </div>
  );
}
