"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useActiveAccount, useActiveWalletConnectionStatus, useDisconnect, useActiveWallet } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { motion } from "framer-motion";
import { Briefcase, Users, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, LogOut, Zap, Lock } from "lucide-react";

export function AuthAndRouting() {
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const searchParams = useSearchParams();

  // If ?chooseRole=true is present in the URL, force showing the Choose Role page
  const forceChooseRole = searchParams?.get("chooseRole") === "true";
  
  const [role, setRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Check local storage for existing role when account connects
  useEffect(() => {
    if (connectionStatus === "connected" && account) {
      if (forceChooseRole) {
        setIsCheckingRole(false);
        return;
      }

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
  }, [account, connectionStatus, router, forceChooseRole]);

  const handleSelectRole = (selectedRole: "client" | "freelancer") => {
    if (!account) return;
    localStorage.setItem(`gigly_role_${account.address}`, selectedRole);
    setRole(selectedRole);
    router.push(`/${selectedRole}`);
  };

  const handleDisconnectWallet = () => {
    if (activeWallet) {
      disconnect(activeWallet);
    }
    if (account) {
      localStorage.removeItem(`gigly_role_${account.address}`);
    }
    setRole(null);
    router.push("/login");
  };

  // State 0: Loading
  if (connectionStatus === "connecting" || (connectionStatus === "connected" && (isCheckingRole || role) && !forceChooseRole)) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F4F7FB] p-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-9 h-9 rounded-full border-3 border-sky-500 border-t-transparent mb-4"
        />
        <p className="text-slate-600 font-mono text-xs animate-pulse tracking-wider uppercase font-semibold">
          Connecting to Gigly Protocol...
        </p>
      </div>
    );
  }

  // State 1: Disconnected -> Clean Light-Themed Glass Tile matching user reference image
  if (connectionStatus === "disconnected" || !account) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-4 sm:px-6 py-12 overflow-y-auto bg-[#F4F7FB]">
        {/* Subtle grid mesh background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(14, 165, 233, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient cyan depth blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-300/25 blur-[140px] pointer-events-none" />

        {/* Back to website button */}
        <div className="w-full max-w-[440px] mb-4 flex items-center justify-start relative z-20">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/80 shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-slate-700" />
            Back to website
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[440px]"
        >
          {/* Card tile matching exact user reference photo */}
          <div className="bg-white/95 border border-white rounded-[2.5rem] p-8 sm:p-11 shadow-[0_20px_50px_-10px_rgba(14,165,233,0.15),0_10px_30px_-5px_rgba(0,0,0,0.06)] backdrop-blur-xl text-center flex flex-col items-center relative overflow-hidden">
            
            {/* Top light shimmer */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-60" />

            {/* Icon: Shield with sky blue glow */}
            <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-6 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-sky-500 stroke-[1.8]" />
            </div>

            {/* Title: GIGLY */}
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[0.18em] text-slate-900 mb-2">
              GIGLY
            </h1>

            {/* Subtitle: DECENTRALIZED FREELANCE ESCROW */}
            <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase mb-6">
              Decentralized Freelance Escrow
            </p>

            {/* Description paragraph */}
            <p className="text-sm text-slate-600 font-normal leading-relaxed max-w-[320px] mb-8">
              Connect your wallet to hire talent or earn guaranteed crypto. Powered by gasless smart contracts on Ethereum Sepolia.
            </p>

            {/* Main Action: Connect Smart Wallet Button */}
            <div className="w-full flex justify-center mb-8">
              <CustomConnectButton label="Connect Smart Wallet" theme="light" />
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-200/80 mb-6" />

            {/* Bottom features bar: Zero Gas Fees • Non-Custodial */}
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Zero Gas Fees
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Non-Custodial
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    );
  }

  // State 2: Logged in -> Role Picker ("I'm Hiring Talent" vs "I'm a Freelancer")
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto bg-[#F4F7FB]">
      {/* Subtle grid mesh background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(14, 165, 233, 0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Retract back to Sign In / Disconnect wallet button */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 relative z-20">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
          Back to website
        </Link>

        <button
          onClick={handleDisconnectWallet}
          className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white/90 hover:bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full shadow-sm transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Switch Wallet / Sign Out
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 relative z-10 max-w-xl"
      >
        <div className="pill-badge mx-auto mb-4 bg-white/80 border border-sky-200 shadow-sm text-sky-600">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span className="text-xs font-semibold uppercase tracking-wider">Account Connected</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Choose your workspace</h2>
        <p className="text-body-sm text-slate-600 leading-relaxed font-normal">
          Select whether you want to fund gigs or offer freelance services. You can retract or switch workspaces at any time.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Client Card */}
        <div 
          onClick={() => handleSelectRole("client")} 
          className="group block cursor-pointer"
        >
          <div className="bg-white/95 border border-slate-200/80 hover:border-sky-400 rounded-3xl p-8 sm:p-10 flex flex-col justify-between h-full relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div>
              <div className="w-14 h-14 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-center mb-6 text-sky-600 group-hover:scale-105 transition-all shadow-sm">
                <Briefcase className="w-7 h-7" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-3 group-hover:text-sky-600 transition-colors">
                I&apos;m Hiring Talent
              </h3>
              <p className="text-body-sm text-slate-600 leading-relaxed mb-8">
                Create freelance jobs, fund immutable smart escrow in USDC, and approve deliverables with complete protection.
              </p>
            </div>
            
            <div className="flex items-center text-sky-600 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
              Open Client Hub <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Freelancer Card */}
        <div 
          onClick={() => handleSelectRole("freelancer")} 
          className="group block cursor-pointer"
        >
          <div className="bg-white/95 border border-slate-200/80 hover:border-violet-400 rounded-3xl p-8 sm:p-10 flex flex-col justify-between h-full relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div>
              <div className="w-14 h-14 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-center mb-6 text-violet-600 group-hover:scale-105 transition-all shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-3 group-hover:text-violet-600 transition-colors">
                I&apos;m a Freelancer
              </h3>
              <p className="text-body-sm text-slate-600 leading-relaxed mb-8">
                Browse open gigs, submit verified proof of work, build on-chain reputation, and withdraw earnings directly to fiat.
              </p>
            </div>
            
            <div className="flex items-center text-violet-600 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
              Open Freelancer Hub <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
