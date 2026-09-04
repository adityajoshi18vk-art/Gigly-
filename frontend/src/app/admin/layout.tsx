"use client";

import { useActiveAccount } from "thirdweb/react";
import { ShieldAlert, LockKeyhole, Copy } from "lucide-react";
import React, { useState } from "react";
import { CustomConnectButton } from "@/components/CustomConnectButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  // Support comma-separated admin addresses from env
  const envAdminAddresses = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS 
    ? process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS.split(",").map(a => a.trim().toLowerCase())
    : [];
    
  // Fallback to the known Arbiter/Admin address for giglytest3 if env is missing on Vercel
  const validAdmins = envAdminAddresses.length > 0 
    ? envAdminAddresses 
    : ["0x99424dfd6F29e3754228Bd40405bfD1439bcEC4F".toLowerCase(), "0xf95cF899E29eA44833bEBA8559053030861ab17B".toLowerCase()];

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <LockKeyhole className="w-16 h-16 text-on-surface-variant mb-6 opacity-50" />
        <h2 className="text-2xl font-display font-semibold text-on-surface mb-2">Connect Admin Wallet</h2>
        <p className="text-on-surface-variant max-w-sm mb-6">
          Please connect your wallet to access the protocol configuration and admin dashboard.
        </p>
        <CustomConnectButton label="Connect to View Admin" theme="light" />
        
        {envAdminAddresses.length === 0 && (
          <p className="text-xs text-error mt-4">
            Warning: NEXT_PUBLIC_ADMIN_WALLET_ADDRESS is not set in Vercel Environment Variables. Using fallback addresses.
          </p>
        )}
      </div>
    );
  }

  const isAuthorized = validAdmins.includes(account.address.toLowerCase());

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="w-16 h-16 text-error mb-6" />
        <h2 className="text-2xl font-display font-semibold text-error mb-2">🛑 Unauthorized</h2>
        <p className="text-on-surface-variant max-w-sm mb-6">
          Admin Access Only. The connected wallet does not have permission to view this page.
        </p>
        <div className="bg-surface-variant border border-outline px-4 py-2 rounded-xl flex items-center gap-3 mb-6">
          <span className="font-mono text-sm text-on-surface">{account.address}</span>
          <button 
            onClick={() => navigator.clipboard.writeText(account.address)}
            className="text-on-surface-variant hover:text-primary transition-colors"
            title="Copy Address"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <CustomConnectButton theme="light" />
        <p className="text-xs text-on-surface-variant mt-4 max-w-md">
          Make sure you are logged in with the correct email (e.g., giglytest3@yopmail.com). <br/>
          If this is the correct wallet, add this address to NEXT_PUBLIC_ADMIN_WALLET_ADDRESS in Vercel.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
