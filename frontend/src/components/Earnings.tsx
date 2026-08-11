"use client";

import { useEffect, useState, useMemo } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client, CHAIN, mockUsdcContract, CHAINLINK_FEEDS } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import {
  Link as LinkIcon,
  RefreshCw,
  AlertTriangle,
  Clock,
  Building2,
  FlaskConical,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

// ─── Chainlink EUR/USD feed ───────────────────────────────────────────────────
const eurUsdFeedContract = getContract({
  client,
  chain: CHAIN,
  address: CHAINLINK_FEEDS.EUR_USD,
});

// ─── Transak Staging constants ────────────────────────────────────────────────
const TRANSAK_STAGING_BASE = "https://global-stg.transak.com/";
const TRANSAK_API_KEY =
  process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? "";

/**
 * Builds the Transak staging off-ramp URL for the connected wallet.
 * Targets Ethereum Sepolia USDC (Transak staging maps to "ethereum" network).
 */
function buildTransakUrl(walletAddress: string): string {
  const params = new URLSearchParams({
    apiKey: TRANSAK_API_KEY,
    productsAvailed: "SELL",          // Off-ramp only
    cryptoCurrencyCode: "USDC",
    network: "ethereum",              // Transak staging uses "ethereum" for Sepolia
    walletAddress,
    isAutoFillUserData: "true",       // Skip data-entry screens when possible
    disableWalletAddressForm: "true", // Lock wallet to connected address
    themeColor: "6366F1",             // Match Gigly's indigo brand
  });
  return `${TRANSAK_STAGING_BASE}?${params.toString()}`;
}

// ─── Transak modal ───────────────────────────────────────────────────────────

interface TransakWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

function TransakWithdrawModal({
  isOpen,
  onClose,
  walletAddress,
}: TransakWithdrawModalProps) {
  const transakUrl = useMemo(
    () => buildTransakUrl(walletAddress),
    [walletAddress]
  );

  if (!isOpen) return null;

  return (
    // Full-screen backdrop
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog — wider than the standard Modal to accommodate the widget */}
      <div className="relative z-50 w-full max-w-xl mx-4 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                Withdraw to Bank Account
              </h2>
              <p className="text-xs text-slate-500">Powered by Transak</p>
            </div>
          </div>
          <button
            id="transak-modal-close-btn"
            onClick={onClose}
            aria-label="Close Transak widget"
            className="rounded-full p-1.5 hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Testnet simulation banner */}
        <div className="flex items-start gap-2.5 px-5 py-3 bg-amber-50 border-b border-amber-100">
          <FlaskConical className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Sandbox / Testnet Mode.</strong> This is a simulated
            off-ramp for development purposes. No real funds will be moved.
            Use Transak&apos;s staging test credentials when prompted.
          </p>
        </div>

        {/* Missing API key fallback */}
        {!TRANSAK_API_KEY || TRANSAK_API_KEY === "your_transak_staging_api_key_here" ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1">
                API Key Not Configured
              </p>
              <p className="text-sm text-slate-500 max-w-xs">
                Set{" "}
                <code className="bg-slate-100 px-1 rounded text-xs font-mono">
                  NEXT_PUBLIC_TRANSAK_API_KEY
                </code>{" "}
                in your{" "}
                <code className="bg-slate-100 px-1 rounded text-xs font-mono">
                  .env.local
                </code>{" "}
                file to a valid Transak staging key.
              </p>
            </div>
          </div>
        ) : (
          /* Transak iframe */
          <iframe
            id="transak-offramp-iframe"
            src={transakUrl}
            title="Transak Off-Ramp — Withdraw USDC to Bank Account (Sandbox)"
            allow="camera; microphone; payment"
            className="w-full border-0"
            style={{ height: "560px" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Earnings component ──────────────────────────────────────────────────

export function Earnings() {
  const account = useActiveAccount();
  const [inrRate, setInrRate] = useState<number | null>(null);
  const [inrLoading, setInrLoading] = useState(true);
  const [lastInrUpdate, setLastInrUpdate] = useState<Date | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // 1. Fetch USDC Balance
  const { data: usdcBalance, isLoading: isUsdcLoading } = useReadContract({
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

  // 3. Fetch INR Rate from external API
  const fetchInrRate = async () => {
    try {
      setInrLoading(true);
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data && data.rates && data.rates.INR) {
        setInrRate(data.rates.INR);
        setLastInrUpdate(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch INR rate:", err);
    } finally {
      setInrLoading(false);
    }
  };

  useEffect(() => {
    fetchInrRate();
    const interval = setInterval(fetchInrRate, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // INR via ER-API
  let inrEquivalent: number | null = null;
  if (usdcFormatted !== null && inrRate !== null) {
    inrEquivalent = usdcFormatted * inrRate;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Header row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Earnings</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Auto-updating every 30s</span>
            </div>
            {/* ── Withdraw CTA ─────────────────────────────────────────── */}
            <Button
              id="withdraw-to-bank-btn"
              onClick={() => setIsWithdrawOpen(true)}
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
            opens a <strong>Transak sandbox</strong> widget — no real money is
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

          {/* INR (API Fallback) Card */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-slate-600">
                    INR Equivalent
                  </p>
                  <Badge
                    variant="default"
                    className="bg-slate-100 text-slate-500 gap-1.5 px-2 py-0.5"
                  >
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      API Fallback
                    </span>
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-800">
                    ₹
                    {isUsdcLoading || (inrLoading && !inrRate)
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

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {lastInrUpdate
                    ? `Last fetched: ${lastInrUpdate.toLocaleTimeString()}`
                    : "Fetching..."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Transak Off-Ramp Modal (portal outside card grid) ──────────── */}
      <TransakWithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        walletAddress={account.address}
      />
    </>
  );
}
