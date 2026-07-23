"use client";

import { useEffect, useState } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client, CHAIN, mockUsdcContract, CHAINLINK_FEEDS } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { formatUnits } from "viem";
import { Link as LinkIcon, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

// Setup Chainlink EUR/USD Feed Contract
const eurUsdFeedContract = getContract({
  client,
  chain: CHAIN,
  address: CHAINLINK_FEEDS.EUR_USD,
});

export function Earnings() {
  const account = useActiveAccount();
  const [inrRate, setInrRate] = useState<number | null>(null);
  const [inrLoading, setInrLoading] = useState(true);
  const [lastInrUpdate, setLastInrUpdate] = useState<Date | null>(null);

  // 1. Fetch USDC Balance
  const { data: usdcBalance, isLoading: isUsdcLoading } = useReadContract({
    contract: mockUsdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: account ? [account.address] : undefined,
    queryOptions: {
      enabled: !!account,
      refetchInterval: 30000, // 30 seconds
    },
  });

  // 2. Fetch Chainlink EUR/USD Rate
  const { data: latestRoundData, isLoading: isEurLoading } = useReadContract({
    contract: eurUsdFeedContract,
    method: "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    params: [],
    queryOptions: {
      refetchInterval: 30000, // 30 seconds
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
  const usdcFormatted = usdcBalance !== undefined ? Number(formatUnits(usdcBalance, 6)) : null;

  // EUR via Chainlink (Chainlink EUR/USD usually has 8 decimals)
  // EUR/USD = 1.08 => 1 EUR = 1.08 USD. 
  // To get EUR from USD: USD_Amount / 1.08
  let eurEquivalent: number | null = null;
  let isEurDelayed = false;
  let eurUpdatedAtDate: Date | null = null;

  if (usdcFormatted !== null && latestRoundData) {
    const answer = latestRoundData[1];
    const updatedAt = Number(latestRoundData[3]);
    
    // Check if older than 3 hours (10800 seconds)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    isEurDelayed = (nowInSeconds - updatedAt) > 10800;
    eurUpdatedAtDate = new Date(updatedAt * 1000);

    const eurUsdRate = Number(formatUnits(answer, 8));
    if (eurUsdRate > 0) {
      eurEquivalent = usdcFormatted / eurUsdRate;
    }
  }

  // INR via ER-API
  // ER-API USD/INR => 1 USD = 83.5 INR.
  // To get INR from USD: USD_Amount * 83.5
  let inrEquivalent: number | null = null;
  if (usdcFormatted !== null && inrRate !== null) {
    inrEquivalent = usdcFormatted * inrRate;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Your Earnings</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>Auto-updating every 30s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Base USDC Card */}
        <Card className="border-t-4 border-t-primary shadow-sm">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {isUsdcLoading ? "..." : (usdcFormatted !== null ? usdcFormatted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00")}
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
                <p className="text-sm font-medium text-indigo-700/80">EUR Equivalent</p>
                <Badge variant="outline" className="bg-indigo-100/50 text-indigo-700 border-indigo-200 gap-1.5 px-2 py-0.5 shadow-sm">
                  <LinkIcon className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">On-Chain Rate</span>
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-indigo-900">
                  €{isUsdcLoading || isEurLoading ? "..." : (eurEquivalent !== null ? eurEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00")}
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
                  {eurUpdatedAtDate ? `Oracle updated: ${eurUpdatedAtDate.toLocaleTimeString()}` : "Chainlink Oracle"}
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
                <p className="text-sm font-medium text-slate-600">INR Equivalent</p>
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 gap-1.5 px-2 py-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold">API Fallback</span>
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-slate-800">
                  ₹{isUsdcLoading || inrLoading && !inrRate ? "..." : (inrEquivalent !== null ? inrEquivalent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00")}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {lastInrUpdate ? `Last fetched: ${lastInrUpdate.toLocaleTimeString()}` : "Fetching..."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
