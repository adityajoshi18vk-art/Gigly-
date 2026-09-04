"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Glow dot */}
          <span className="flex w-2.5 h-2.5 rounded-full bg-[#0DA5F0] shadow-[0_0_8px_rgba(13,165,240,0.6)] group-hover:shadow-[0_0_12px_rgba(13,165,240,0.9)] transition-shadow" />
          <span className="font-display text-xl font-extrabold tracking-[0.15em] text-[#071014] transition-opacity duration-300 group-hover:opacity-80">
            GIGLY
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="/#features" className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#334155] hover:text-[#071014] transition-colors duration-300">
            Features
          </Link>
          <Link href="/#process" className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#334155] hover:text-[#071014] transition-colors duration-300">
            Process
          </Link>
          <Link href="/#security" className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#334155] hover:text-[#071014] transition-colors duration-300">
            Security
          </Link>
          <Link href="/docs" className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#334155] hover:text-[#0DA5F0] transition-colors duration-300">
            Docs
          </Link>
        </div>

        {/* CTA */}
        <div className="flex items-center">
          <Link 
            href="/login" 
            className="text-[13px] font-bold tracking-[0.06em] uppercase px-5 py-2.5 rounded-full bg-primary hover:bg-[#0877AF] text-white hover:shadow-glow-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm"
          >
            Sign In
          </Link>
        </div>

      </div>
    </motion.nav>
  );
}
