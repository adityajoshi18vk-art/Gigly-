"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, FastForward } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function FeatureSection() {
  return (
    <section id="features" className="py-32 px-6 overflow-hidden relative bg-background">
      <div className="max-w-7xl mx-auto space-y-48">
        
        {/* Pattern B: Large heading left + product visual right */}
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[11px] font-medium tracking-[0.2em] text-accent uppercase mb-8">
              Payment Security
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight mb-8">
              Deterministic Escrow
            </h2>
            <p className="text-lg text-white/50 leading-relaxed max-w-md mb-8 font-normal">
              Eliminate payment anxiety. Funds are locked securely in an immutable smart contract before work begins, and released instantly upon approval.
            </p>
            <div className="flex flex-col gap-4 text-sm font-medium text-white/60">
              <div className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"/> Guaranteed deposits</div>
              <div className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"/> Milestone-based releases</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <InteractiveEscrowCard />
          </motion.div>
        </div>

        {/* Pattern E: Large statistic/statement + small explanatory copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="border-y border-white/5 py-32 flex flex-col items-center text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
          <h2 className="text-5xl md:text-7xl font-semibold text-white tracking-tight mb-8 z-10">
            Gasless Transactions. <br className="md:hidden" />
          </h2>
          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl font-normal z-10">
            Powered by a sophisticated meta-transaction relay network. You never have to pay network fees, manage seed phrases, or understand blockchain mechanics. Simply sign in and start working.
          </p>
        </motion.div>

        {/* Pattern B (Reversed): Product visual left + Large heading right */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24 items-center">
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
            <div className="text-[11px] font-medium tracking-[0.2em] text-accent uppercase mb-8">
              Freelancer Protection
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight mb-8">
              Cryptographic Guarantees.
            </h2>
            <p className="text-lg text-white/50 leading-relaxed max-w-md mb-8 font-normal">
              When you submit work, a 24-hour cryptographically enforced timer begins. If the client is unresponsive, the contract auto-releases your funds. In case of issues, a decentralized Arbiter ensures fair resolution.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-accent transition-colors group">
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
    <div className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer group shadow-2xl relative overflow-hidden" onClick={handleSubmit}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-6 relative z-10">
        <div>
          <div className="text-white/30 font-mono text-[10px] tracking-widest uppercase mb-2">Escrow Contract</div>
          <div className="text-white font-medium text-lg tracking-wide">Active Agreement</div>
        </div>
        <div className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 border rounded-full transition-colors duration-300 ${status === "submitted" ? "border-accent/50 bg-accent/10 text-accent" : "border-white/10 text-white/40"}`}>
          {status === "locked" ? "Funds Secured" : status === "submitting" ? "Processing" : "In Review"}
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="bg-white/[0.02] p-5 border border-white/5 rounded-xl">
          <div className="text-white/30 font-mono text-[10px] tracking-widest uppercase mb-2">Deliverable</div>
          <div className="text-white/90 font-medium">Full-Stack Application Development</div>
        </div>
        
        <div className="bg-white/[0.02] p-5 border border-white/5 rounded-xl">
          <div className="text-white/30 font-mono text-[10px] tracking-widest uppercase mb-2">Total Value Locked</div>
          <div className="text-3xl text-white font-semibold tracking-tight">$4,500 <span className="text-sm font-medium text-white/30 font-mono">USDC</span></div>
        </div>
        
        <button 
          className={`w-full py-4 mt-2 text-[12px] font-semibold tracking-widest uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            status === "locked" 
              ? "bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]" 
              : status === "submitting"
              ? "bg-white/5 text-white/50 cursor-wait border border-white/5"
              : "bg-accent/20 border border-accent/30 text-accent cursor-default"
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
    <div className="bg-[#121212] border border-white/10 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-6 relative z-10">
        <div>
          <div className="text-white/30 font-mono text-[10px] tracking-widest uppercase mb-2">
            Status: {state === "review" ? "Awaiting Client" : state === "approved" ? "Resolved" : state === "autorelease" ? "Auto-Resolved" : "Frozen"}
          </div>
          <div className="text-white font-medium text-lg tracking-wide">
            {state === "review" && "Review Period Active"}
            {state === "approved" && "Payment Released"}
            {state === "autorelease" && "Auto-Release Triggered"}
            {state === "disputed" && "Arbiter Reviewing"}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-xl tracking-tight ${state === "autorelease" ? "text-white/30" : "text-white"}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-accent font-mono text-[10px] tracking-widest uppercase mt-1">
            {state === "review" ? "Time Remaining" : "Timer Stopped"}
          </div>
        </div>
      </div>
      
      <div className="h-40 flex items-center justify-center relative z-10">
        {state === "review" ? (
          <div className="w-full flex gap-4">
            <button onClick={handleApprove} className="flex-1 bg-white text-black hover:bg-white/90 rounded-xl font-semibold text-[11px] tracking-widest uppercase py-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Approve Work
            </button>
            <button onClick={handleDispute} className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white font-semibold text-[11px] tracking-widest uppercase py-4 transition-colors">
              Dispute
            </button>
          </div>
        ) : (
          <div className="w-full bg-white/[0.02] border border-white/5 p-6 rounded-xl text-center">
             {state === "approved" && <span className="text-white/80 font-mono text-sm tracking-wide">Transaction finalized. Client approved.</span>}
             {state === "autorelease" && <span className="text-white/80 font-mono text-sm tracking-wide">Client inactive. Contract auto-executed.</span>}
             {state === "disputed" && <span className="text-white/80 font-mono text-sm tracking-wide">Funds frozen. Sent to Arbiter.</span>}
          </div>
        )}
      </div>

      {state === "review" && (
        <button onClick={handleGhost} className="w-full mt-6 text-[10px] font-mono tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors py-4 flex items-center justify-center gap-2 rounded-xl border border-transparent hover:bg-white/5 relative z-10">
          <FastForward className="w-3 h-3" /> Simulate Client Inactivity
        </button>
      )}
    </div>
  );
}
