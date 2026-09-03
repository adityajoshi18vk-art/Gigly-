"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Briefcase, Users } from "lucide-react";

export function ProductCards() {
  return (
    <section id="products" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, z: -300, rotateX: 20 }}
          whileInView={{ opacity: 1, z: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Choose your path</h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">Whether you're looking for top Web3 talent or you want to earn guaranteed crypto, Gigly has you covered.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Client Card */}
          <Link href="/login" className="group block">
            <motion.div
              initial={{ opacity: 0, z: -400, rotateY: -15, scale: 0.9 }}
              whileInView={{ opacity: 1, z: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[2rem] p-10 border border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden shadow-2xl h-full flex flex-col"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full group-hover:bg-primary/40 transition-colors duration-500" />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:border-primary/30 transition-colors">
                  <Briefcase className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-4">I'm Hiring</h3>
                <p className="text-white/60 text-lg mb-12 flex-1">
                  Create gigs, lock funds in secure escrow, and collaborate with verified Web3 professionals worldwide.
                </p>
                
                <div className="flex items-center text-primary font-bold text-lg group-hover:translate-x-2 transition-transform duration-300">
                  Hire Talent <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Freelancer Card */}
          <Link href="/login" className="group block">
            <motion.div
              initial={{ opacity: 0, z: -400, rotateY: 15, scale: 0.9 }}
              whileInView={{ opacity: 1, z: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[2rem] p-10 border border-white/5 hover:border-secondary/50 transition-all duration-500 overflow-hidden shadow-2xl h-full flex flex-col"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/5 transition-colors duration-500" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full group-hover:bg-secondary/40 transition-colors duration-500" />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:border-secondary/30 transition-colors">
                  <Users className="w-8 h-8 text-white group-hover:text-secondary transition-colors" />
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-4">I'm a Freelancer</h3>
                <p className="text-white/60 text-lg mb-12 flex-1">
                  Find high-paying gigs, submit your work securely, and get paid instantly when the job is done.
                </p>
                
                <div className="flex items-center text-secondary font-bold text-lg group-hover:translate-x-2 transition-transform duration-300">
                  Find Gigs <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>

        </div>
      </div>
    </section>
  );
}
