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
      className="relative py-40 px-6 overflow-hidden bg-background border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24 relative z-10">
        
        {/* Left Side: Sticky Editorial Typography */}
        <div className="relative">
          <div className="lg:sticky lg:top-48">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-[11px] font-medium tracking-[0.2em] text-accent uppercase mb-8">
                The Process
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight mb-8">
                How it works.
              </h2>
              <p className="text-lg text-white/50 leading-relaxed max-w-sm font-normal">
                An optimistic engine that protects every transaction from start to finish, built invisibly into the workflow.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Scrolling Timeline */}
        <div className="relative pt-10 lg:pt-0">
          
          {/* Stark Track Line */}
          <div className="absolute left-0 top-4 bottom-4 w-[1px] bg-white/10 hidden md:block">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-accent origin-top shadow-[0_0_10px_rgba(99,102,241,0.5)]"
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
                {/* Minimal Node Point */}
                <div className="hidden md:block absolute left-[-5px] top-2 z-10">
                  <div className="w-2.5 h-2.5 bg-background border-2 border-white/30 rounded-full group-hover:border-accent group-hover:scale-150 transition-all duration-500" />
                </div>

                {/* Flat Typography Card */}
                <div className="flex-1 transition-all duration-500 relative">
                  <div className="text-white/30 font-mono text-[10px] font-medium mb-4 tracking-widest uppercase">
                    STEP 0{index + 1}
                  </div>
                  <h3 className="text-2xl font-medium text-white mb-4 tracking-tight group-hover:text-accent transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-lg text-white/50 leading-relaxed max-w-lg font-normal">
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
