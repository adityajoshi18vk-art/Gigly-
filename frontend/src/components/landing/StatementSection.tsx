"use client";

import { motion } from "framer-motion";

export function StatementSection() {
  return (
    <section className="py-40 px-6 bg-background border-t border-white/5 relative overflow-hidden">
      
      {/* Subtle background tone change */}
      <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase mb-8">
            How It Works
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight mb-12">
            Replace trust <br className="hidden md:block" />
            <span className="text-white/30">with cryptography.</span>
          </h2>
          
          <div className="w-[1px] h-24 bg-white/10 mx-auto mb-12" />
          
          <p className="text-lg md:text-xl text-white/50 font-normal max-w-2xl mx-auto leading-relaxed">
            Freelancing often relies on blind trust. Gigly uses smart contracts to hold funds securely in escrow, ensuring clients get what they pay for and freelancers get paid for what they do.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
