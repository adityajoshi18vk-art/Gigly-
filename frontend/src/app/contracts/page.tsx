"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { ExternalLink, Copy, Check, Shield, Code, ArrowRight } from "lucide-react";
import { CONTRACTS } from "@/lib/config";

export default function ContractsPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(key);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const contracts = [
    {
      name: "OptimisticEscrow",
      key: "escrow",
      address: CONTRACTS.OptimisticEscrow,
      description: "Non-custodial escrow protocol for locking, optimistic review verification, and dispute resolution.",
      features: ["2.5% protocol fee (capped at 3%)", "24-hour review window (configurable)", "Arbiter split resolution", "Reentrancy protected"],
      explorer: `https://sepolia.etherscan.io/address/${CONTRACTS.OptimisticEscrow}`,
    },
    {
      name: "VotingDispute (Community Jury)",
      key: "voting",
      address: CONTRACTS.VotingDispute,
      description: "Decentralised community jury dispute resolution protocol powered by credentialed peer voting.",
      features: ["Pseudo-random juror selection", "Dual credential verification", "70/30 split logic", "+Contributor SBT reward"],
      explorer: `https://sepolia.etherscan.io/address/${CONTRACTS.VotingDispute}`,
    },
    {
      name: "GiglyCredential (DID VC & SBT)",
      key: "credential",
      address: CONTRACTS.GiglyCredential,
      description: "Soulbound reputation credential and contributor SBT minted on escrow releases and dispute settlements.",
      features: ["Non-transferable ERC-721", "Dual-minter (Escrow + VotingDispute)", "Tied to did:ethr:sepolia", "Mathematical Sybil resistance"],
      explorer: `https://sepolia.etherscan.io/address/${CONTRACTS.GiglyCredential}`,
    },
    {
      name: "FreelancerRegistry",
      key: "registry",
      address: CONTRACTS.FreelancerRegistry,
      description: "Decentralised on-chain profile store for freelancer credentials, titles, skills, and rates.",
      features: ["Permanent on-chain persistence", "Zero server lock-in", "Wallet authenticated edits", "Global discovery"],
      explorer: `https://sepolia.etherscan.io/address/${CONTRACTS.FreelancerRegistry}`,
    },
    {
      name: "USDC (Payment Token)",
      key: "usdc",
      address: CONTRACTS.USDC,
      description: "Standard ERC-20 stablecoin used for price stability and escrow funding on Sepolia.",
      features: ["6 Decimals precision", "SafeERC20 compliance", "Zero volatility risk for gig budgets"],
      explorer: `https://sepolia.etherscan.io/address/${CONTRACTS.USDC}`,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#071014] selection:bg-accent/30 selection:text-white">
      <LandingNavbar />

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-mono uppercase tracking-wider mb-6 font-semibold">
            [ VERIFIED CONTRACTS ]
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#071014] mb-6 leading-tight">
            Ethereum Sepolia <span className="text-[#0DA5F0]">Smart Contracts</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-normal">
            All Gigly escrows and reputation tokens are governed by immutable, transparent smart contracts deployed on Ethereum Sepolia.
          </p>
        </div>

        {/* Contract Cards */}
        <div className="space-y-6 mb-20" id="escrow">
          {contracts.map((contract) => (
            <div
              key={contract.key}
              className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">{contract.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">Network: Ethereum Sepolia (Chain ID 11155111)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(contract.address, contract.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50 text-xs font-medium transition-colors"
                  >
                    {copiedAddress === contract.key ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                  <a
                    href={contract.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors"
                  >
                    <span>Etherscan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Address Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 break-all mb-4">
                {contract.address}
              </div>

              <p className="text-sm text-slate-600 mb-4">{contract.description}</p>

              {/* Features Pill */}
              <div className="flex flex-wrap gap-2">
                {contract.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-[#0369a1] text-xs font-medium border border-blue-100"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optimistic Protocol Workflow Technical Breakdown */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-slate-50/60 shadow-sm mb-16">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">
            Escrow State Machine &amp; ABI Functions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-mono text-xs uppercase text-primary font-bold mb-2">
                createJob(freelancer, amount, description)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transfers USDC from client to the escrow contract. Emits <code className="text-primary font-mono">JobCreated</code>. Status transitions to <code className="font-mono text-slate-800">Funded</code>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-mono text-xs uppercase text-primary font-bold mb-2">
                submitWork(jobId, proofOfWorkURI)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Called by the assigned freelancer. Starts the review timer (<code className="font-mono text-slate-800">reviewWindowStart = block.timestamp</code>). Emits <code className="text-primary font-mono">WorkSubmitted</code>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-mono text-xs uppercase text-primary font-bold mb-2">
                releaseFunds(jobId) / claimTimeout(jobId)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client can approve early, or anyone can trigger <code className="font-mono text-slate-800">claimTimeout</code> after the review window elapses. Automatically routes fee to platform and net payment to freelancer.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-mono text-xs uppercase text-primary font-bold mb-2">
                dispute(jobId) / resolveDispute(jobId, split)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If work does not meet specifications, client disputes before the timer expires. On-chain arbiter decides the percentage split to ensure fair resolution.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
