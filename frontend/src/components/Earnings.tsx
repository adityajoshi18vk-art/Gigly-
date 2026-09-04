"use client";

import { useState, useEffect, useCallback } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client, CHAIN, mockUsdcContract, CHAINLINK_FEEDS } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import {
  Link as LinkIcon,
  RefreshCw,
  Clock,
  Building2,
  AlertTriangle,
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { WithdrawModal } from "@/components/WithdrawModal";
import { KYCModal } from "@/components/KYCModal";
import { getFreelancerProfile, saveFreelancerProfile } from "@/lib/freelancerRegistry";

// ─── Chainlink EUR/USD feed ───────────────────────────────────────────────────
const eurUsdFeedContract = getContract({
  client,
  chain: CHAIN,
  address: CHAINLINK_FEEDS.EUR_USD,
});

// ─── On-chain INR/USD feed (MockINRFeed on Sepolia) ───────────────────────────
const inrUsdFeedContract = getContract({
  client,
  chain: CHAIN,
  address: CHAINLINK_FEEDS.INR_USD,
});

export function Earnings() {
  const account = useActiveAccount();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isKYCVerified, setIsKYCVerified] = useState(false);

  // Sync KYC state from localStorage
  useEffect(() => {
    if (account?.address) {
      const stored = localStorage.getItem(`finguard_kyc_${account.address.toLowerCase()}`);
      setIsKYCVerified(stored === "true");
    } else {
      setIsKYCVerified(false);
    }
  }, [account?.address]);

  const handleWithdrawClick = useCallback(() => {
    if (!isKYCVerified) {
      setIsKYCModalOpen(true);
    } else {
      setIsWithdrawOpen(true);
    }
  }, [isKYCVerified]);

  const handleKYCVerified = useCallback(async () => {
    setIsKYCVerified(true);
    setIsKYCModalOpen(false);
    // Persist kycVerified to API so the client marketplace can see it
    if (account?.address) {
      try {
        const existing = await getFreelancerProfile(account.address);
        if (existing) {
          await saveFreelancerProfile({ ...existing, kycVerified: true });
        }
      } catch (e) {
        console.warn("Failed to persist kycVerified to API:", e);
      }
    }
  }, [account?.address]);

  const handleResetKYC = useCallback(() => {
    localStorage.removeItem(`finguard_kyc_${account?.address?.toLowerCase()}`);
    localStorage.removeItem("anonAadhaar");
    sessionStorage.clear();
    window.location.reload();
  }, [account?.address]);

  // 1. Fetch USDC Balance
  const { data: usdcBalance, isLoading: isUsdcLoading, refetch: refetchBalance } = useReadContract({
    contract: mockUsdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: account
      ? [account.address]
      : ["0x0000000000000000000000000000000000000000"],
    queryOptions: {
      enabled: !!account,
      refetchInterval: 30000,
    },
  });

  // 2. Fetch Chainlink EUR/USD Rate
  const { data: latestRoundData, isLoading: isEurLoading } = useReadContract({
    contract: eurUsdFeedContract,
    method:
      "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    params: [],
    queryOptions: {
      refetchInterval: 30000,
    },
  });

  // 3. Fetch on-chain INR/USD Rate (MockINRFeed)
  const { data: inrRoundData, isLoading: isInrLoading } = useReadContract({
    contract: inrUsdFeedContract,
    method:
      "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    params: [],
    queryOptions: {
      refetchInterval: 30000,
    },
  });

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-on-surface-variant">Please connect your wallet to view earnings.</p>
      </div>
    );
  }

  // Base USDC
  const usdcFormatted =
    usdcBalance !== undefined ? Number(formatUnits(usdcBalance, 6)) : null;

  // EUR via Chainlink
  let eurEquivalent: number | null = null;
  let isEurDelayed = false;
  let eurUpdatedAtDate: Date | null = null;

  if (usdcFormatted !== null && latestRoundData) {
    const answer = latestRoundData[1];
    const updatedAt = Number(latestRoundData[3]);

    const nowInSeconds = Math.floor(Date.now() / 1000);
    isEurDelayed = nowInSeconds - updatedAt > 10800;
    eurUpdatedAtDate = new Date(updatedAt * 1000);

    const eurUsdRate = Number(formatUnits(answer, 8));
    if (eurUsdRate > 0) {
      eurEquivalent = usdcFormatted / eurUsdRate;
    }
  }

  // INR via MockINRFeed
  let inrEquivalent: number | null = null;
  let isInrDelayed = false;
  let inrUpdatedAtDate: Date | null = null;

  if (usdcFormatted !== null && inrRoundData) {
    const inrAnswer = inrRoundData[1];
    const inrUpdatedAt = Number(inrRoundData[3]);

    const nowInSeconds = Math.floor(Date.now() / 1000);
    isInrDelayed = nowInSeconds - inrUpdatedAt > 10800;
    inrUpdatedAtDate = new Date(inrUpdatedAt * 1000);

    const inrUsdRate = Number(formatUnits(inrAnswer, 8));
    if (inrUsdRate > 0) {
      inrEquivalent = usdcFormatted * inrUsdRate;
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold text-on-surface">Your Earnings</h2>
            
            {/* KYC Status Badge */}
            {isKYCVerified ? (
              <div className="flex items-center gap-2">
                <Badge
                  id="kyc-status-badge"
                  variant="success"
                  className="flex items-center gap-1.5 px-3 py-1 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ZK-KYC Verified (RBI &amp; GDPR Compliant)
                </Badge>
                <button
                  id="kyc-reset-btn"
                  onClick={handleResetKYC}
                  className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-error border border-glass-border hover:border-error/30 rounded-lg px-2.5 py-1 transition-colors"
                  title="Reset KYC verification for demo purposes"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset (Demo)
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  id="kyc-status-badge"
                  variant="pending"
                  className="flex items-center gap-1.5 px-3 py-1 text-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  KYC Required for Payouts
                </Badge>
                <Button
                  id="verify-identity-btn"
                  variant="outline"
                  onClick={() => setIsKYCModalOpen(true)}
                  className="text-xs px-3 py-1 h-auto font-semibold border-warning/30 text-warning hover:bg-warning/10"
                >
                  Verify Identity
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-accent" />
              <span>30s Oracles</span>
            </div>
            
            <Button
              id="withdraw-to-bank-btn"
              onClick={handleWithdrawClick}
              className="btn-gradient-primary text-xs font-semibold py-2 px-4 shadow-glow-accent flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Withdraw to Bank
            </Button>
          </div>
        </div>

        {/* Testnet simulation notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-glass-border bg-glass-subtle px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
          <FlaskConical className="w-4 h-4 text-accent-light shrink-0 mt-0.5" />
          <p>
            <strong>Testnet Sandbox:</strong> Balances shown are Circle Testnet USDC on{" "}
            <strong>{CHAIN.name ?? "Ethereum Sepolia"}</strong>. &quot;Withdraw to Bank Account&quot; triggers a{" "}
            <strong>zero-slippage simulated off-ramp</strong>.
          </p>
        </div>

        {/* Multi-Currency Oracle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base USDC Card */}
          <div className="surface-card-interactive rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-accent-light" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1 font-mono">
                Total Balance
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display text-3xl font-bold text-on-surface">
                  {isUsdcLoading
                    ? "..."
                    : usdcFormatted !== null
                    ? usdcFormatted.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </span>
                <span className="text-sm font-semibold text-accent-light font-mono">USDC</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-glass-border">
              <span className="text-[11px] text-slate-700 font-mono font-semibold">Native Smart Wallet Balance</span>
            </div>
          </div>

          {/* EUR (Chainlink Oracle) Card */}
          <div className="surface-card-interactive rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400" />
            <div>
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 font-mono">
                  EUR Equivalent
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <LinkIcon className="w-2.5 h-2.5" />
                  Chainlink
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display text-3xl font-bold text-on-surface">
                  €
                  {isUsdcLoading || isEurLoading
                    ? "..."
                    : eurEquivalent !== null
                    ? eurEquivalent.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-glass-border flex items-center justify-between text-[11px]">
              {isEurDelayed ? (
                <div className="flex items-center gap-1.5 text-warning font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rate delayed
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  {eurUpdatedAtDate
                    ? `Updated ${eurUpdatedAtDate.toLocaleTimeString()}`
                    : "Chainlink Feed"}
                </div>
              )}
            </div>
          </div>

          {/* INR (On-Chain) Card */}
          <div className="surface-card-interactive rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tertiary to-tertiary-warm" />
            <div>
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                  INR Equivalent
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  <LinkIcon className="w-2.5 h-2.5" />
                  On-Chain
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display text-3xl font-bold text-on-surface">
                  ₹
                  {isUsdcLoading || isInrLoading
                    ? "..."
                    : inrEquivalent !== null
                    ? inrEquivalent.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-glass-border flex items-center justify-between text-[11px]">
              {isInrDelayed ? (
                <div className="flex items-center gap-1.5 text-warning font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rate delayed
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  {inrUpdatedAtDate
                    ? `Updated ${inrUpdatedAtDate.toLocaleTimeString()}`
                    : "MockINRFeed"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        walletAddress={account.address}
        usdcBalance={usdcFormatted ?? 0}
        onWithdrawSuccess={() => refetchBalance()}
      />

      <KYCModal
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        onVerified={handleKYCVerified}
        walletAddress={account.address}
      />
    </>
  );
}
