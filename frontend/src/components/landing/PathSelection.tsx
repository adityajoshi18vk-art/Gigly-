"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PathSelection() {
  return (
    <section id="path" className="py-0 overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[60vh]">
        
        {/* Client Path */}
        <Link id="for-clients" href="/login" className="group relative border-b lg:border-b-0 lg:border-r border-glass-border hover:bg-glass-subtle transition-colors duration-700 flex flex-col justify-between p-10 lg:p-16 overflow-hidden scroll-mt-24">
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="pill-badge mb-8">
              <span className="text-xs font-semibold text-accent tracking-wider uppercase">For Clients</span>
            </div>
            <h3 className="font-display text-display-sm md:text-display-md text-on-surface mb-6">
              Hire <br />
              <span className="text-primary font-bold">talent.</span>
            </h3>
            <p className="text-body-lg text-slate-700 leading-relaxed max-w-sm font-medium">
              Create gigs, lock funds in secure escrow, and collaborate with verified professionals worldwide.
            </p>
          </motion.div>
          
          <div className="mt-16 flex items-center justify-between relative z-10">
            <div className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-600 group-hover:text-primary transition-colors duration-500">
              01
            </div>
            <div className="flex items-center text-[12px] font-bold tracking-widest uppercase text-on-surface group-hover:text-primary group-hover:translate-x-4 transition-all duration-500">
              Explore <ArrowRight className="ml-4 w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Freelancer Path */}
        <Link id="for-freelancers" href="/login" className="group relative hover:bg-glass-subtle transition-colors duration-700 flex flex-col justify-between p-10 lg:p-16 overflow-hidden scroll-mt-24">
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-bl from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative z-10"
          >
            <div className="pill-badge mb-8">
              <span className="text-xs font-semibold text-tertiary-warm tracking-wider uppercase">For Freelancers</span>
            </div>
            <h3 className="font-display text-display-sm md:text-display-md text-on-surface mb-6">
              Earn <br />
              <span className="text-tertiary-warm font-bold">crypto.</span>
            </h3>
            <p className="text-body-lg text-slate-700 leading-relaxed max-w-sm font-medium">
              Find high-paying gigs, submit your work securely, and get paid instantly when the job is done.
            </p>
          </motion.div>
          
          <div className="mt-16 flex items-center justify-between relative z-10">
            <div className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-600 group-hover:text-tertiary-warm transition-colors duration-500">
              02
            </div>
            <div className="flex items-center text-[12px] font-bold tracking-widest uppercase text-on-surface group-hover:text-tertiary-warm group-hover:translate-x-4 transition-all duration-500">
              Explore <ArrowRight className="ml-4 w-4 h-4" />
            </div>
          </div>
        </Link>

      </div>
    </section>
  );
}
