"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { ApiKeyBanner } from "@/components/ApiKeyModal";
import { ShieldCheck, Briefcase, UserCheck, ShieldAlert } from "lucide-react";

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

  return (
    <>
      <ApiKeyBanner />
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Brand Logo & Chain Status */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-md bg-surface-container border border-outline-variant flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-on-primary text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-on-background">
                  Gigly
                </span>
              </Link>

              {/* Network pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-outline-variant text-xs font-medium text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Polygon Amoy</span>
              </div>
            </div>

            {/* Navigation Links & Role Selector */}
            <div className="hidden sm:flex items-center gap-2">
              {account && (
                <div className="flex items-center bg-surface-container p-1 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant">
                  <button
                    onClick={() => handleRoleSwitch("client")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                      activeRole === "client" || pathname === "/client"
                        ? "bg-surface-container-lowest text-on-surface shadow-level-1 border border-outline-variant"
                        : "hover:text-on-surface hover:bg-surface-container-lowest/50 border border-transparent"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Client
                  </button>
                  <button
                    onClick={() => handleRoleSwitch("freelancer")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                      activeRole === "freelancer" || pathname === "/freelancer"
                        ? "bg-surface-container-lowest text-on-surface shadow-level-1 border border-outline-variant"
                        : "hover:text-on-surface hover:bg-surface-container-lowest/50 border border-transparent"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Freelancer
                  </button>
                </div>
              )}

              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                  pathname === "/admin"
                    ? "bg-surface-container-lowest text-on-surface border-outline-variant shadow-level-1"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
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
