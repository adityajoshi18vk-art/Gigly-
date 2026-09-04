"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react";

export function usePortalAuth(portalRole: "freelancer" | "client") {
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const router = useRouter();

  // Save active portal and role to local storage whenever account is present
  useEffect(() => {
    if (account?.address) {
      try {
        localStorage.setItem(`gigly_role_${account.address.toLowerCase()}`, portalRole);
        localStorage.setItem("gigly_last_portal", portalRole);
      } catch {
        // Safe fail in private browsing modes
      }
    }
  }, [account?.address, portalRole]);

  // Gracefully redirect unauthenticated visitors who manually navigate to portal without a wallet
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPortal =
        typeof window !== "undefined"
          ? localStorage.getItem("gigly_last_portal")
          : null;

      // Only redirect if there's no account, status is disconnected, AND no saved portal was ever set
      if (!account && connectionStatus === "disconnected" && !savedPortal) {
        router.push("/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [account, connectionStatus, router]);

  return {
    account,
    connectionStatus,
    isConnected: Boolean(account),
  };
}
