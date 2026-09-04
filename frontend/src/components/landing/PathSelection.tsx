"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PathSelection() {
  return (
    <section id="path" className="py-0 overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[70vh]">
        
        {/* Client Path */}
        <Link href="/login" className="group relative border-b lg:border-b-0 lg:border-r border-glass-border hover:bg-glass-subtle transition-colors duration-700 flex flex-col justify-between p-12 lg:p-24 overflow-hidden">
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="pill-badge mb-12">
              <span className="text-xs font-medium text-accent tracking-wider uppercase">For Clients</span>
            </div>
            <h3 className="font-display text-display-sm md:text-display-md lg:text-display-lg text-on-surface mb-8">
              Hire <br />
              <span className="text-on-surface-variant/30">talent.</span>
            </h3>
            <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-sm font-normal">
              Create gigs, lock funds in secure escrow, and collaborate with verified professionals worldwide.
            </p>
          </motion.div>
          
          <div className="mt-24 flex items-center justify-between relative z-10">
            <div className="text-[10px] font-mono tracking-widest uppercase text-on-surface-variant/40 group-hover:text-accent-light transition-colors duration-500">
              01
            </div>
            <div className="flex items-center text-[12px] font-medium tracking-widest uppercase text-on-surface group-hover:text-accent-light group-hover:translate-x-4 transition-all duration-500">
              Explore <ArrowRight className="ml-4 w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Freelancer Path */}
        <Link href="/login" className="group relative hover:bg-glass-subtle transition-colors duration-700 flex flex-col justify-between p-12 lg:p-24 overflow-hidden">
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-bl from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative z-10"
          >
            <div className="pill-badge mb-12">
              <span className="text-xs font-medium text-tertiary-warm tracking-wider uppercase">For Freelancers</span>
            </div>
            <h3 className="font-display text-display-sm md:text-display-md lg:text-display-lg text-on-surface mb-8">
              Earn <br />
              <span className="text-on-surface-variant/30">crypto.</span>
            </h3>
            <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-sm font-normal">
              Find high-paying gigs, submit your work securely, and get paid instantly when the job is done.
            </p>
          </motion.div>
          
          <div className="mt-24 flex items-center justify-between relative z-10">
            <div className="text-[10px] font-mono tracking-widest uppercase text-on-surface-variant/40 group-hover:text-tertiary-warm transition-colors duration-500">
              02
            </div>
            <div className="flex items-center text-[12px] font-medium tracking-widest uppercase text-on-surface group-hover:text-tertiary-warm group-hover:translate-x-4 transition-all duration-500">
              Explore <ArrowRight className="ml-4 w-4 h-4" />
            </div>
          </div>
        </Link>

      </div>
    </section>
  );
}
