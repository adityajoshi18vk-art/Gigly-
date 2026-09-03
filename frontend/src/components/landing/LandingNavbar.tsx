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
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-widest text-white transition-opacity duration-300 group-hover:opacity-70">
            GIGLY
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-[13px] font-medium tracking-[0.05em] uppercase text-white/50 hover:text-white transition-colors duration-300">
            Features
          </Link>
          <Link href="#path" className="text-[13px] font-medium tracking-[0.05em] uppercase text-white/50 hover:text-white transition-colors duration-300">
            Path
          </Link>
          <Link href="#security" className="text-[13px] font-medium tracking-[0.05em] uppercase text-white/50 hover:text-white transition-colors duration-300">
            Security
          </Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-6">
          <Link href="/login" className="hidden md:block text-[13px] font-medium tracking-[0.05em] uppercase text-white/50 hover:text-white transition-colors duration-300">
            Sign In
          </Link>
          <Link 
            href="/login" 
            className="text-[13px] font-semibold tracking-[0.05em] uppercase text-black bg-white px-5 py-2.5 rounded-full hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

      </div>
    </motion.nav>
  );
}
