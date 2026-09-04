"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { ApiKeyBanner } from "@/components/ApiKeyModal";
import { ShieldCheck, Briefcase, UserCheck, ShieldAlert, ArrowLeftRight } from "lucide-react";

export function Navbar({ activeRole }: { activeRole?: "client" | "freelancer" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useActiveAccount();

  const handleRoleSwitch = (newRole: "client" | "freelancer") => {
    if (account) {
      localStorage.setItem(`gigly_role_${account.address}`, newRole);
    }
    router.push(`/${newRole}`);
  };

  const handleRetractToChooseRole = () => {
    // Navigates directly to the role selection page ("Choose your workspace")
    router.push("/login?chooseRole=true");
  };

  return (
    <>
      <ApiKeyBanner />
      <header className="sticky top-0 z-40 w-full border-b border-glass-border bg-background/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Brand Logo & Chain Status */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-glass-light border border-glass-border flex items-center justify-center transition-all group-hover:border-accent/50 group-hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] text-accent-light">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-display text-lg font-bold tracking-[0.1em] text-on-surface">
                  GIGLY
                </span>
              </Link>

              {/* Network pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-glass-light border border-glass-border text-xs font-medium text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"></span>
                <span>Ethereum Sepolia</span>
              </div>
            </div>

            {/* Navigation Links, Workspace Retract Button & Role Selector */}
            <div className="hidden sm:flex items-center gap-2">
              {account && (
                <>
                  {/* Retract back to Workspace Selection Page button */}
                  <button
                    onClick={handleRetractToChooseRole}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-accent/40 bg-glass-light hover:bg-glass-medium text-xs font-medium text-on-surface-variant hover:text-white transition-all shadow-sm group"
                    title="Retract to Choose Workspace screen"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-accent-light group-hover:rotate-180 transition-transform duration-300" />
                    <span>Switch Role</span>
                  </button>

                  <div className="flex items-center bg-glass-light p-1 rounded-xl border border-glass-border text-xs font-medium text-on-surface-variant">
                    <button
                      onClick={() => handleRoleSwitch("client")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        activeRole === "client" || pathname === "/client"
                          ? "bg-glass-medium text-on-surface shadow-inner-glow border border-glass-border-light"
                          : "hover:text-on-surface hover:bg-glass-subtle border border-transparent"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Client
                    </button>
                    <button
                      onClick={() => handleRoleSwitch("freelancer")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        activeRole === "freelancer" || pathname === "/freelancer"
                          ? "bg-glass-medium text-on-surface shadow-inner-glow border border-glass-border-light"
                          : "hover:text-on-surface hover:bg-glass-subtle border border-transparent"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Freelancer
                    </button>
                  </div>
                </>
              )}

              <Link
                href="/jury"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                  pathname === "/jury"
                    ? "bg-glass-medium text-on-surface border-glass-border-light shadow-inner-glow"
                    : "border-transparent text-on-surface-variant hover:bg-glass-light hover:text-on-surface"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Jury
              </Link>

              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                  pathname === "/admin"
                    ? "bg-glass-medium text-on-surface border-glass-border-light shadow-inner-glow"
                    : "border-transparent text-on-surface-variant hover:bg-glass-light hover:text-on-surface"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Arbiter
              </Link>
            </div>

            {/* Wallet Connect Button */}
            <div className="flex items-center gap-3">
              <CustomConnectButton />
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
