"use client";

import { useState, useEffect, useCallback } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client, CHAIN, mockUsdcContract, CHAINLINK_FEEDS } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { WithdrawModal } from "@/components/WithdrawModal";
import { KYCModal } from "@/components/KYCModal";

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

// ─── Main Earnings component ──────────────────────────────────────────────────

export function Earnings() {
  const account = useActiveAccount();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isKYCVerified, setIsKYCVerified] = useState(false);

  // ── Sync KYC state from localStorage whenever wallet changes ────────
  useEffect(() => {
    if (account?.address) {
      const stored = localStorage.getItem(`finguard_kyc_${account.address}`);
      setIsKYCVerified(stored === "true");
    } else {
      setIsKYCVerified(false);
    }
  }, [account?.address]);

  // ── Withdraw click handler — guards with KYC gate ───────────────────
  const handleWithdrawClick = useCallback(() => {
    if (!isKYCVerified) {
      setIsKYCModalOpen(true);
    } else {
      setIsWithdrawOpen(true);
    }
  }, [isKYCVerified]);

  // ── KYC verification success callback ───────────────────────────────
  const handleKYCVerified = useCallback(() => {
    setIsKYCVerified(true);
    setIsKYCModalOpen(false);
  }, []);

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
        <p className="text-slate-500">Please connect your wallet to view earnings.</p>
      </div>
    );
  }

  // --- Calculations ---

  // Base USDC
  const usdcFormatted =
    usdcBalance !== undefined ? Number(formatUnits(usdcBalance, 6)) : null;

  // EUR via Chainlink (Chainlink EUR/USD usually has 8 decimals)
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

  // INR via on-chain MockINRFeed (8 decimals, same as Chainlink)
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
        {/* ── Header row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Your Earnings</h2>
            {/* ── KYC Status Badge ────────────────────────────────────── */}
            {isKYCVerified ? (
              <Badge
                id="kyc-status-badge"
                variant="success"
                className="flex items-center gap-1.5 px-3 py-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                🛡️ ZK-KYC Verified (RBI &amp; GDPR Compliant)
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  id="kyc-status-badge"
                  variant="pending"
                  className="flex items-center gap-1.5 px-3 py-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  ⚠️ KYC Required (Withdrawals Locked)
                </Badge>
                <Button
                  id="verify-identity-btn"
                  variant="outline"
                  onClick={() => setIsKYCModalOpen(true)}
                  className="text-xs px-3 py-1 h-auto"
                >
                  Verify Identity
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Auto-updating every 30s</span>
            </div>
            {/* ── Withdraw CTA (guarded by KYC) ───────────────────────── */}
            <Button
              id="withdraw-to-bank-btn"
              onClick={handleWithdrawClick}
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Withdraw to Bank Account
            </Button>
          </div>
        </div>

        {/* ── Testnet simulation notice ────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <FlaskConical className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Testnet Environment.</strong> Balances shown are on{" "}
            {CHAIN.name ?? "a testnet"}. The &quot;Withdraw to Bank Account&quot; button
            opens a <strong>simulated off-ramp</strong> — no real money is
            transferred.
          </p>
        </div>

        {/* ── Earnings cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base USDC Card */}
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  Total Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {isUsdcLoading
                      ? "..."
                      : usdcFormatted !== null
                      ? usdcFormatted.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </span>
                  <span className="text-lg font-semibold text-slate-500">USDC</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">Native Wallet Balance</span>
              </div>
            </CardContent>
          </Card>

          {/* EUR (Chainlink Oracle) Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white shadow-sm border-indigo-100">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-indigo-700/80">
                    EUR Equivalent
                  </p>
                  <Badge
                    variant="default"
                    className="bg-indigo-100/50 text-indigo-700 border-indigo-200 gap-1.5 px-2 py-0.5 shadow-sm"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      On-Chain Rate
                    </span>
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-indigo-900">
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

              <div className="mt-4 pt-4 border-t border-indigo-100/50 flex items-center justify-between">
                {isEurDelayed ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Rate may be delayed
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                    <Clock className="w-3.5 h-3.5" />
                    {eurUpdatedAtDate
                      ? `Oracle updated: ${eurUpdatedAtDate.toLocaleTimeString()}`
                      : "Chainlink Oracle"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* INR (On-Chain) Card */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-slate-600">
                    INR Equivalent
                  </p>
                  <Badge
                    variant="default"
                    className="bg-indigo-50 text-indigo-600 gap-1.5 px-2 py-0.5"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      On-Chain Rate
                    </span>
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-800">
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

              {isInrDelayed ? (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rate may be delayed
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-indigo-400">
                  <Clock className="w-3.5 h-3.5" />
                  {inrUpdatedAtDate
                    ? `Oracle updated: ${inrUpdatedAtDate.toLocaleTimeString()}`
                    : "Reading oracle..."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Withdraw Modal ────────────────────────────────────────────────── */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        walletAddress={account.address}
        usdcBalance={usdcFormatted ?? 0}
        onWithdrawSuccess={() => refetchBalance()}
      />

      {/* ── KYC Verification Modal ─────────────────────────────────────────── */}
      <KYCModal
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        onVerified={handleKYCVerified}
        walletAddress={account.address}
      />
    </>
  );
}
