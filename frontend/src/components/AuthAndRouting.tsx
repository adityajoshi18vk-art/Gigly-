"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { User, Lock, Briefcase, Users, ArrowRight } from "lucide-react";

export function AuthAndRouting() {
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const router = useRouter();
  
  const [role, setRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Check local storage for existing role when account connects
  useEffect(() => {
    if (connectionStatus === "connected" && account) {
      const savedRole = localStorage.getItem(`gigly_role_${account.address}`);
      if (savedRole) {
        setRole(savedRole);
        router.push(`/${savedRole}`);
      } else {
        setIsCheckingRole(false);
      }
    } else if (connectionStatus === "disconnected") {
      setIsCheckingRole(false);
    }
  }, [account, connectionStatus, router]);

  const handleSelectRole = (selectedRole: "client" | "freelancer") => {
    if (!account) return;
    localStorage.setItem(`gigly_role_${account.address}`, selectedRole);
    setRole(selectedRole);
    router.push(`/${selectedRole}`);
  };

  // State 0: Loading
  if (connectionStatus === "connecting" || (connectionStatus === "connected" && (isCheckingRole || role))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent mb-6"
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-primary font-medium tracking-wide text-sm animate-pulse"
        >
          Initializing Secure Connection...
        </motion.p>
      </div>
    );
  }

  // State 1: Not logged in (Premium Interactive Campsite Login)
  if (connectionStatus === "disconnected" || !account) {
    return (
      <div 
        className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#0a0f1c]"
      >
        {/* Full-screen Background Image */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: "url('/images/bg-campsite.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        />

        {/* Premium Subtle Glass Form Container */}
        <div className="relative z-10 w-full max-w-[400px] mt-24">
          <div className="backdrop-blur-md bg-[#0f172a]/20 border border-white/10 rounded-[2rem] p-10 shadow-2xl transition-all duration-500 hover:bg-[#0f172a]/30">
            
            {/* Logo */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                GIGLY
              </h1>
              <p className="text-white/50 text-xs tracking-widest mt-2 uppercase font-medium">
                On-Chain Escrow
              </p>
            </div>
            
            <form className="space-y-6 mb-8 relative z-10" onSubmit={(e) => e.preventDefault()}>
              {/* Interactive Username Input */}
              <div className="relative group transition-all duration-300">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300 peer"
                />
                <User className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 peer-focus:text-primary transition-colors duration-300" />
              </div>
              
              {/* Interactive Password Input */}
              <div className="relative group transition-all duration-300">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300 peer"
                />
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 peer-focus:text-primary transition-colors duration-300" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 relative z-20">
                <div className="w-full flex justify-center transition-transform duration-300 hover:scale-[1.02] active:scale-95">
                  <CustomConnectButton label="Secure Web3 Login" />
                </div>
              </div>
            </form>

            <p className="text-center text-xs text-white/40 mt-8 relative z-10 font-medium">
              Powered by Account Abstraction & Thirdweb
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Logged in, NO role -> Role Picker
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0f1c] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center mb-16 relative z-10"
      >
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Choose your path</h2>
        <p className="text-xl text-white/50 max-w-2xl mx-auto">
          Whether you're looking for top Web3 talent or you want to earn guaranteed crypto, Gigly has you covered. You can switch roles later.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        {/* Client Card */}
        <div 
          onClick={() => handleSelectRole("client")} 
          className="group block cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
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
                Continue as Client <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Freelancer Card */}
        <div 
          onClick={() => handleSelectRole("freelancer")} 
          className="group block cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
                Continue as Freelancer <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
