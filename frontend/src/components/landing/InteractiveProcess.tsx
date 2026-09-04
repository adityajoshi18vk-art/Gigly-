"use client";

import { useRef } from "react";
import { motion, useScroll } from "framer-motion";

export function InteractiveProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const steps = [
    {
      title: "Fund Escrow",
      description: "Client locks USDC in the Gigly smart contract. Verification is instant and gasless.",
    },
    {
      title: "Deliver Work",
      description: "Freelancer completes the task and submits cryptographic proof of work directly on-chain.",
    },
    {
      title: "Release Funds",
      description: "Client reviews the work. If approved or ignored after 24 hours, funds are instantly released.",
    },
    {
      title: "Arbiter Resolution",
      description: "In the event of a dispute, funds freeze and our decentralized Arbiter resolves the issue.",
    },
  ];

  return (
    <section 
      id="security"
      ref={containerRef} 
      className="relative py-20 sm:py-24 px-6 overflow-hidden"
    >
      {/* Top divider */}
      <div className="section-divider mb-0" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 relative z-10 pt-12">
        
        {/* Left Side: Sticky Editorial Typography */}
        <div className="relative">
          <div className="lg:sticky lg:top-36">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="pill-badge mb-8" id="process">
                <span className="text-xs font-semibold text-primary tracking-wider uppercase font-mono">[ PROTOCOL WORKFLOW ]</span>
              </div>
              <h2 className="font-display text-display-sm md:text-display-md text-[#071014] font-black tracking-tight leading-[1.08] mb-8">
                How it works.
              </h2>
              <p className="text-body-lg text-[#1e293b] leading-relaxed max-w-sm font-semibold">
                An optimistic engine that protects every transaction from start to finish, built invisibly into the workflow.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Scrolling Timeline */}
        <div className="relative pt-10 lg:pt-0">
          
          {/* Track Line with scroll progress */}
          <div className="absolute left-0 top-4 bottom-4 w-px bg-glass-border hidden md:block">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-accent origin-top shadow-[0_0_10px_rgba(13,165,240,0.4)]"
              style={{ scaleY: scrollYProgress }}
            />
          </div>

          <div className="space-y-16 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ 
                  duration: 1, 
                  ease: [0.16, 1, 0.3, 1], 
                  delay: index * 0.1 
                }}
                className="flex gap-8 md:gap-12 group pl-0 md:pl-12 relative"
              >
                {/* Node Point with glow */}
                <div className="hidden md:block absolute left-[-5px] top-2 z-10">
                  <div className="connector-dot group-hover:scale-150 group-hover:shadow-[0_0_12px_3px_rgba(13,165,240,0.5)] transition-all duration-500" />
                </div>

                {/* Content */}
                <div className="flex-1 transition-all duration-500 relative surface-card-interactive rounded-xl p-6 md:p-8">
                  <div className="text-primary font-mono text-[11px] font-bold mb-3 tracking-widest uppercase">
                    STEP 0{index + 1}
                  </div>
                  <h3 className="font-display text-headline-md text-[#071014] font-extrabold mb-3 group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-body-md text-[#1e293b] leading-relaxed max-w-lg font-semibold">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
