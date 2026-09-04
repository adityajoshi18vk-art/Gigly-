"use client";

import { useActiveAccount } from "thirdweb/react";
import { ShieldAlert, LockKeyhole } from "lucide-react";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS;

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <LockKeyhole className="w-16 h-16 text-on-surface-variant mb-6 opacity-50" />
        <h2 className="text-2xl font-display font-semibold text-on-surface mb-2">Connect Admin Wallet</h2>
        <p className="text-on-surface-variant max-w-sm">
          Please connect your wallet to access the protocol configuration and admin dashboard.
        </p>
      </div>
    );
  }

  if (account.address.toLowerCase() !== adminAddress?.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="w-16 h-16 text-error mb-6" />
        <h2 className="text-2xl font-display font-semibold text-error mb-2">🛑 Unauthorized</h2>
        <p className="text-on-surface-variant max-w-sm">
          Admin Access Only. The connected wallet ({account.address.slice(0, 6)}...{account.address.slice(-4)}) does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
