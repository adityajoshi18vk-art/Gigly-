"use client";

import { useState, useCallback, useEffect } from "react";
import { TransactionButton, useReadContract } from "thirdweb/react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { transfer } from "thirdweb/extensions/erc20";
import { getContract } from "thirdweb";
import { formatUnits } from "viem";
import { usdcContract, client, CHAIN, CHAINLINK_FEEDS } from "@/lib/config";
import {
  X,
  Building2,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Download,
  Loader2,
  IndianRupee,
  DollarSign,
  Euro,
  AlertTriangle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Currency = "INR" | "EUR" | "USD";

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  icon: React.ReactNode;
  payoutLabel: string;
  payoutPlaceholder: string;
  payoutHint: string;
  rail: string;
  fallbackRate: number;
}

const CURRENCIES: CurrencyConfig[] = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    icon: <IndianRupee className="w-4 h-4" />,
    payoutLabel: "UPI ID or Account + IFSC",
    payoutPlaceholder: "e.g. yourname@upi or 12345678 / SBIN0001234",
    payoutHint: "Instant settlement via UPI / IMPS rails",
    rail: "UPI / IMPS",
    fallbackRate: 87.2,
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    icon: <Euro className="w-4 h-4" />,
    payoutLabel: "IBAN",
    payoutPlaceholder: "e.g. DE89 3704 0044 0532 0130 00",
    payoutHint: "1-2 business days via SEPA transfer",
    rail: "SEPA",
    fallbackRate: 0.92,
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    icon: <DollarSign className="w-4 h-4" />,
    payoutLabel: "Routing + Account Number",
    payoutPlaceholder: "e.g. 021000021 / 123456789",
    payoutHint: "1-3 business days via wire transfer",
    rail: "Wire",
    fallbackRate: 1.0,
  },
];

// ─── Processing steps ────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  { label: "Verifying KYC & AML Compliance", delay: 800 },
  { label: "Burning / Locking USDC on Sepolia", delay: 700 },
  { label: "Routing fiat payout via banking rails", delay: 500 },
];

type ModalStep = "form" | "processing" | "success";

// ─── Component ───────────────────────────────────────────────────────────────

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

// On-chain INR/USD price feed (MockINRFeed on Sepolia)
const inrFeedContract = getContract({
  client,
  chain: CHAIN,
  address: CHAINLINK_FEEDS.INR_USD,
});

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  usdcBalance: number;
  onWithdrawSuccess?: () => void;
}

export function WithdrawModal({
  isOpen,
  onClose,
  walletAddress,
  usdcBalance,
  onWithdrawSuccess,
}: WithdrawModalProps) {
  const [step, setStep] = useState<ModalStep>("form");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [amount, setAmount] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [txRef, setTxRef] = useState("");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // ── On-chain INR/USD rate from MockINRFeed ──────────────────────────────
  const { data: inrRoundData, isLoading: inrOnChainLoading } = useReadContract({
    contract: inrFeedContract,
    method:
      "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    params: [],
    queryOptions: {
      refetchInterval: 30000,
    },
  });

  const onChainInrRate = inrRoundData
    ? Number(formatUnits(inrRoundData[1], 8))
    : null;

  // ── API rates for EUR / USD (fallback for INR too) ─────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setRatesLoading(true);
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch(() => {
        // Silently fall back to hardcoded rates
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  const currencyConfig = CURRENCIES.find((c) => c.code === currency)!;

  // For INR: prefer on-chain rate. For EUR/USD: use API rate.
  const isInrOnChain = currency === "INR" && onChainInrRate !== null && onChainInrRate > 0;
  const liveRate = isInrOnChain
    ? onChainInrRate
    : (exchangeRates?.[currency] ?? currencyConfig.fallbackRate);
  const rateSource: "onchain" | "api" | "fallback" = isInrOnChain
    ? "onchain"
    : exchangeRates !== null && currency in (exchangeRates || {})
      ? "api"
      : "fallback";

  const numAmount = parseFloat(amount) || 0;
  const fiatAmount = numAmount * liveRate;
  const fee = numAmount * 0.004; // 0.4% fee
  const fiatFee = fee * liveRate;
  const netFiat = fiatAmount - fiatFee;

  const isFormValid =
    numAmount > 0 && numAmount <= usdcBalance && payoutDetails.trim().length > 3;

  const resetModal = useCallback(() => {
    setStep("form");
    setAmount("");
    setPayoutDetails("");
    setProcessingIndex(-1);
    setTxRef("");
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [onClose, resetModal]);

  const runProcessingAnimation = useCallback(async (txHash?: string) => {
    setStep("processing");
    setProcessingIndex(0);

    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setProcessingIndex(i);
      await new Promise((r) => setTimeout(r, PROCESSING_STEPS[i].delay));
    }

    // Use the real tx hash or generate a reference
    const ref = txHash
      ? `${txHash.slice(0, 10)}…${txHash.slice(-6)}`
      : `GIG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setTxRef(ref);
    setStep("success");
    onWithdrawSuccess?.();
  }, [onWithdrawSuccess]);

  const handleDownloadReceipt = useCallback(() => {
    const receipt = [
      "═══════════════════════════════════════════",
      "       GIGLY - WITHDRAWAL RECEIPT          ",
      "═══════════════════════════════════════════",
      "",
      `Date:            ${new Date().toLocaleString()}`,
      `Reference:       ${txRef}`,
      `Network:         Ethereum Sepolia (Testnet)`,
      "",
      "── Transaction Details ─────────────────────",
      `USDC Withdrawn:  ${numAmount.toFixed(2)} USDC`,
      `Exchange Rate:   1 USDC = ${currencyConfig.symbol}${liveRate.toFixed(2)}`,
      `Gross Amount:    ${currencyConfig.symbol}${fiatAmount.toFixed(2)} ${currency}`,
      `Platform Fee:    ${currencyConfig.symbol}${fiatFee.toFixed(2)} (0.4%)`,
      `Net Received:    ${currencyConfig.symbol}${netFiat.toFixed(2)} ${currency}`,
      "",
      "── Payout Details ─────────────────────────",
      `Currency:        ${currency} via ${currencyConfig.rail}`,
      `Destination:     ${payoutDetails}`,
      `Wallet:          ${walletAddress}`,
      "",
      "── Fee Comparison ─────────────────────────",
      `Gigly Fee:       0.4% (${currencyConfig.symbol}${fiatFee.toFixed(2)})`,
      `Traditional:     5-10% (${currencyConfig.symbol}${(fiatAmount * 0.075).toFixed(2)} avg)`,
      `You Save:        ~${currencyConfig.symbol}${(fiatAmount * 0.075 - fiatFee).toFixed(2)}`,
      "",
      "═══════════════════════════════════════════",
      "   ⚠ TESTNET — No real funds transferred   ",
      "═══════════════════════════════════════════",
    ].join("\n");

    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gigly-receipt-${txRef}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [txRef, numAmount, currency, currencyConfig, liveRate, fiatAmount, fiatFee, netFiat, payoutDetails, walletAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={step === "processing" ? undefined : handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-lg mx-4 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                {step === "success"
                  ? "Transfer Complete"
                  : "Withdraw to Bank Account"}
              </h2>
              <p className="text-xs text-slate-500">
                {step === "success"
                  ? "Settlement confirmed"
                  : "Off-ramp USDC → Fiat"}
              </p>
            </div>
          </div>
          {step !== "processing" && (
            <button
              onClick={handleClose}
              aria-label="Close"
              className="rounded-full p-1.5 hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── Sandbox notice ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-amber-50 border-b border-amber-100 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-700">
            <strong>Testnet Sandbox</strong> — Simulated settlement. No real funds transferred.
          </p>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto p-5">
          {/* ═══ STEP 1: FORM ═══════════════════════════════════════════════ */}
          {step === "form" && (
            <div className="space-y-5">
              {/* Currency Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Payout Currency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        currency === c.code
                          ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                          : "border-gray-200 bg-white text-slate-600 hover:border-gray-300"
                      }`}
                    >
                      {c.icon}
                      {c.code}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {currencyConfig.rail} • {currencyConfig.payoutHint}
                </p>
              </div>

              {/* Live Rate */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-slate-600">
                  {(ratesLoading && !isInrOnChain) || (currency === "INR" && inrOnChainLoading) ? "Fetching rate…" : (
                    <>1 USDC = {currencyConfig.symbol}{liveRate.toFixed(2)} {currency}</>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">
                  {rateSource === "onchain"
                    ? "🔗 On-Chain Rate"
                    : rateSource === "api"
                      ? "🟢 Live Market Rate"
                      : "⚠️ Fallback Rate"}
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    max={usdcBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 pr-20 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-lg font-semibold text-slate-800 transition-all"
                  />
                  <button
                    onClick={() => setAmount(usdcBalance.toFixed(2))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    Max
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Available: {usdcBalance.toFixed(2)} USDC
                </p>
              </div>

              {/* Fiat Conversion Preview */}
              {numAmount > 0 && (
                <div className="rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">You will receive</span>
                    <span className="font-bold text-teal-700 text-lg">
                      {currencyConfig.symbol}
                      {netFiat.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Platform fee (0.4%)</span>
                    <span>
                      -{currencyConfig.symbol}{fiatFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Payout Details */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  {currencyConfig.payoutLabel}
                </label>
                <input
                  id="payout-details"
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={currencyConfig.payoutPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm text-slate-800 transition-all"
                />
              </div>

              {/* Submit — real on-chain USDC transfer */}
              <TransactionButton
                transaction={() =>
                  transfer({
                    contract: usdcContract,
                    to: BURN_ADDRESS,
                    amount: numAmount.toString(),
                  })
                }
                onTransactionConfirmed={(receipt) => {
                  runProcessingAnimation(receipt.transactionHash);
                }}
                onError={(err) => {
                  console.error("Withdrawal tx failed:", err);
                }}
                disabled={!isFormValid}
                unstyled
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Shield className="w-4 h-4" />
                Confirm Withdrawal
                <ArrowRight className="w-4 h-4" />
              </TransactionButton>
            </div>
          )}

          {/* ═══ STEP 2: PROCESSING ═════════════════════════════════════════ */}
          {step === "processing" && (
            <div className="py-6 space-y-5">
              <div className="text-center mb-6">
                <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  Processing your withdrawal…
                </p>
              </div>

              <div className="space-y-3">
                {PROCESSING_STEPS.map((s, i) => {
                  const isDone = i < processingIndex;
                  const isCurrent = i === processingIndex;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                        isDone
                          ? "bg-emerald-50 border-emerald-200"
                          : isCurrent
                          ? "bg-teal-50 border-teal-300 shadow-sm"
                          : "bg-gray-50 border-gray-200 opacity-50"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-teal-500 animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isDone
                            ? "text-emerald-700"
                            : isCurrent
                            ? "text-teal-700"
                            : "text-slate-400"
                        }`}
                      >
                        {i + 1}. {s.label}
                        {isDone ? " ✓" : isCurrent ? "…" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: SUCCESS ════════════════════════════════════════════ */}
          {step === "success" && (
            <div className="py-4 space-y-5">
              {/* Success badge */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Transfer Settled Successfully
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your funds are on their way
                </p>
              </div>

              {/* Payout details */}
              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Amount Received</span>
                  <span className="font-bold text-emerald-700">
                    {currencyConfig.symbol}
                    {netFiat.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currency}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">USDC Burned</span>
                  <span className="font-semibold text-slate-700">
                    {numAmount.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Destination</span>
                  <span className="font-medium text-slate-700 text-right max-w-[200px] truncate">
                    {payoutDetails}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Reference ID</span>
                  <span className="font-mono text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    {txRef}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Rail</span>
                  <span className="font-medium text-slate-700">
                    {currencyConfig.rail}
                  </span>
                </div>
              </div>

              {/* Fee comparison */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4">
                <p className="text-xs font-semibold text-emerald-800 mb-2">
                  💰 Fee Comparison
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                      Gigly Fee
                    </p>
                    <p className="text-lg font-bold text-emerald-700">0.4%</p>
                    <p className="text-[11px] text-slate-500">
                      {currencyConfig.symbol}{fiatFee.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-[10px] font-bold uppercase text-red-400 tracking-wider">
                      Traditional
                    </p>
                    <p className="text-lg font-bold text-red-400 line-through">
                      5-10%
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ~{currencyConfig.symbol}
                      {(fiatAmount * 0.075).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  id="download-receipt-btn"
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <button
                  id="withdraw-close-btn"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
