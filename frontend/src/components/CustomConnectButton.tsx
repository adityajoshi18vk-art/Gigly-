"use client";

import { ConnectButton } from "thirdweb/react";
import { client, wallets, CHAIN, accountAbstraction } from "@/lib/config";

export interface CustomConnectButtonProps {
  label?: string;
}

/**
 * ConnectButton with accountAbstraction re-enabled globally.
 *
 * This gives EVERY connected wallet (Gmail, Email, MetaMask, Coinbase) a
 * Thirdweb ERC-4337 smart account with sponsored gas — so freelancers never
 * need ETH to claim payment, submit work, or log progress.
 *
 * Trade-off: MetaMask users transact from a smart-account address that differs
 * from their MetaMask EOA. USDC must be sent to the smart-account address,
 * not the raw MetaMask address. The CreateJobModal "funding" screen shows
 * this address explicitly so clients always know where to send funds.
 */
export function CustomConnectButton({ label }: CustomConnectButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div title="Gas is sponsored via ERC-4337 Account Abstraction. Native ETH is not required.">
        <ConnectButton
          client={client}
          wallets={wallets}
          chain={CHAIN}
          accountAbstraction={accountAbstraction}
          theme="light"
          connectButton={label ? { label } : undefined}
        />
      </div>
      <span className="text-[10px] text-slate-400 mt-1 font-medium text-center">
        ⚡ Gas-free (No ETH needed)
      </span>
    </div>
  );
}
