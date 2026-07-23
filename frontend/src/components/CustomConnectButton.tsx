"use client";

import { ConnectButton } from "thirdweb/react";
import { client, wallets, CHAIN } from "@/lib/config";

export interface CustomConnectButtonProps {
  label?: string;
}

export function CustomConnectButton({ label }: CustomConnectButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div title="Gas is sponsored via ERC-4337 Account Abstraction. Native ETH is not required.">
        <ConnectButton 
          client={client} 
          wallets={wallets}
          chain={CHAIN}
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
