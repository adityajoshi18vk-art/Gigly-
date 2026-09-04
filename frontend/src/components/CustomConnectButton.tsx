"use client";

import { ConnectButton } from "thirdweb/react";
import { client, wallets, CHAIN } from "@/lib/config";

export interface CustomConnectButtonProps {
  label?: string;
  theme?: "dark" | "light";
}

/**
 * ConnectButton with wallet-type-aware Account Abstraction.
 *
 * - **In-app wallets (Google / Email)**: These already have ERC-4337 AA
 *   configured via `executionMode` in their wallet definition (config.ts).
 *   Users get a gasless smart wallet automatically — no ETH needed.
 *
 * - **External wallets (MetaMask / Coinbase)**: These connect with their
 *   native EOA address. Users see and use their own MetaMask address and
 *   existing USDC balance directly. They pay their own gas (tiny on Sepolia).
 */
export function CustomConnectButton({ label, theme = "dark" }: CustomConnectButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div title="In-app wallets are gasless via ERC-4337. External wallets use their own address.">
        <ConnectButton
          client={client}
          wallets={wallets}
          chain={CHAIN}
          theme={theme}
          connectButton={label ? { label } : undefined}
        />
      </div>
      <span className={`text-[10px] mt-1 font-medium text-center ${theme === "light" ? "text-slate-500" : "text-on-surface-variant"}`}>
        ⚡ Gas-free (No ETH needed)
      </span>
    </div>
  );
}
