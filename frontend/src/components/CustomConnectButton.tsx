"use client";

import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { client, wallets, CHAIN } from "@/lib/config";

export interface CustomConnectButtonProps {
  label?: string;
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
 *
 * This avoids the confusing UX where MetaMask users had to fund a separate
 * smart-account address that differed from their MetaMask wallet.
 */
export function CustomConnectButton({ label }: CustomConnectButtonProps) {
  const wallet = useActiveWallet();
  const isGasless = wallet?.id === "inApp";
  const isConnected = !!wallet;

  return (
    <div className="flex flex-col items-center justify-center">
      <div title="In-app wallets are gasless via ERC-4337. External wallets use their own address.">
        <ConnectButton
          client={client}
          wallets={wallets}
          chain={CHAIN}
          theme="light"
          connectButton={label ? { label } : undefined}
        />
      </div>
      {(!isConnected || isGasless) && (
        <span className="text-[10px] text-slate-400 mt-1 font-medium text-center">
          ⚡ Gas-free {isConnected ? "(No ETH needed)" : "with Email/Google"}
        </span>
      )}
    </div>
  );
}
