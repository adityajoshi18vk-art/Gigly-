"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { client, wallets, CHAIN } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

  // State 0: Loading (connecting to wallet OR checking role after connect)
  if (connectionStatus === "connecting" || (connectionStatus === "connected" && (isCheckingRole || role))) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // State 1: Not logged in
  if (connectionStatus === "disconnected" || !account) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to Gigly</h1>
        <p className="text-lg text-slate-500 mb-8 max-w-md mx-auto">
          Secure, gasless freelance payments. Connect your account to get started.
        </p>
        <CustomConnectButton label="Sign In to Gigly" />
      </div>
    );
  }

  // State 3: Logged in, NO role -> Role Picker
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome!</h2>
      <p className="text-slate-500 mb-10 text-center max-w-lg">
        How do you plan to use Gigly today? You can always change this later in settings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Card className="flex flex-col h-full group hover:border-primary transition-colors cursor-pointer" onClick={() => handleSelectRole("client")}>
          <CardContent className="p-8 flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-3">I&apos;m hiring</h3>
            <p className="text-slate-500 mb-8 flex-1">
              Create jobs, lock funds in escrow, and hire top talent without dealing with crypto complexity.
            </p>
            <Button className="w-full group-hover:bg-primary-hover">Continue as Client</Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full group hover:border-primary transition-colors cursor-pointer" onClick={() => handleSelectRole("freelancer")}>
          <CardContent className="p-8 flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-3">I&apos;m working</h3>
            <p className="text-slate-500 mb-8 flex-1">
              Find gigs, submit work, and get guaranteed payouts with zero gas fees.
            </p>
            <Button className="w-full group-hover:bg-primary-hover">Continue as Freelancer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
