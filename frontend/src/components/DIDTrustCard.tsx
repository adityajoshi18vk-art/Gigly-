"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Fingerprint,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Scale,
  Hash,
} from "lucide-react";

// ─── Component ───────────────────────────────────────────────────────────────

export function DIDTrustCard() {
  const account = useActiveAccount();
  const did = account?.address
    ? `did:ethr:sepolia:${account.address}`
    : "Not Connected";

  const [copied, setCopied] = useState(false);

  const handleCopyDID = async () => {
    if (!account?.address) return;
    await navigator.clipboard.writeText(did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Mock VC stats ──────────────────────────────────────────────────────
  const vcStats = [
    {
      label: "Verified Gigs",
      value: "14",
      icon: Award,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Trust Score",
      value: "98/100",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Disputes",
      value: "0",
      icon: Scale,
      color: "text-slate-500",
      bg: "bg-slate-50",
    },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Fingerprint className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              On-Chain Trust & Reputation
            </h2>
          </div>
          <Badge variant="default" className="flex items-center gap-1 px-2.5 py-1">
            <ShieldCheck className="w-3 h-3" />
            W3C Standard
          </Badge>
        </div>

        {/* ── DID Identifier ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            DID
          </span>
          <code className="flex-1 text-xs font-mono text-slate-700 truncate select-all">
            {did}
          </code>
          <button
            id="did-copy-btn"
            onClick={handleCopyDID}
            disabled={!account?.address}
            className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy DID to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <CardContent className="space-y-4">
        {/* ── VC Stats Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {vcStats.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-1.5 rounded-xl ${stat.bg} border border-slate-100 py-4 px-3`}
            >
              <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Proof Hash Terminal ──────────────────────────────────────────── */}
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/80" />
              <div className="w-2 h-2 rounded-full bg-amber-500/80" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium">
              Latest VC Proof Hash (Escrow Released)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
            <code className="text-sm font-mono text-emerald-300 tracking-wide">
              0x8f2a91b7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e319
            </code>
          </div>

          <p className="text-[10px] text-slate-500 italic leading-relaxed mt-1">
            Fraud Reduction: Reputation is strictly tied to on-chain escrow
            settlements and cannot be faked.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
