"use client";

import { motion } from "framer-motion";

export function StatementSection() {
  return (
    <section className="py-40 px-6 relative overflow-hidden">
      
      {/* Atmospheric glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top divider */}
      <div className="section-divider mb-40" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pill-badge mx-auto mb-10">
            <span className="text-xs font-semibold text-[#0DA5F0] tracking-wider uppercase font-mono">[ PROTOCOL MECHANICS ]</span>
          </div>
          
          <h2 className="font-display text-display-sm md:text-display-md lg:text-display-lg text-[#071014] font-black tracking-tight leading-[1.02] mb-12">
            Replace trust <br className="hidden md:block" />
            <span className="text-gradient-primary">with cryptography.</span>
          </h2>
          
          {/* Connector line */}
          <div className="w-px h-20 bg-gradient-to-b from-accent/30 to-transparent mx-auto mb-12" />
          
          <p className="text-body-lg md:text-xl text-[#1e293b] font-semibold max-w-2xl mx-auto leading-relaxed">
            Freelancing often relies on blind trust. Gigly uses smart contracts to hold funds securely in escrow, ensuring clients get what they pay for and freelancers get paid for what they do.
          </p>
        </motion.div>
      </div>

      {/* Bottom divider */}
      <div className="section-divider mt-40" />
    </section>
  );
}
