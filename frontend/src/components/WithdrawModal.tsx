"use client";

import { useState, useCallback, useEffect } from "react";
import { TransactionButton, useReadContract } from "thirdweb/react";
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
    payoutPlaceholder: "e.g. freelancer@upi or 12345678 / SBIN0001234",
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

const PROCESSING_STEPS = [
  { label: "Verifying ZK-KYC & AML Compliance", delay: 800 },
  { label: "Burning / Locking USDC on Ethereum Sepolia", delay: 700 },
  { label: "Routing fiat payout via banking rails", delay: 500 },
];

type ModalStep = "form" | "processing" | "success";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  const currencyConfig = CURRENCIES.find((c) => c.code === currency)!;

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
        className="fixed inset-0 bg-background/70 backdrop-blur-md"
        onClick={step === "processing" ? undefined : handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-lg mx-4 rounded-2xl border border-glass-border bg-surface backdrop-blur-xl shadow-level-3 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-glass-light border border-glass-border flex items-center justify-center text-accent-light">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-on-surface leading-tight">
                {step === "success"
                  ? "Transfer Complete"
                  : "Withdraw to Bank Account"}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {step === "success"
                  ? "Settlement confirmed"
                  : "Zero-slippage off-ramp USDC → Fiat"}
              </p>
            </div>
          </div>
          {step !== "processing" && (
            <button
              onClick={handleClose}
              aria-label="Close"
              className="rounded-lg p-1.5 hover:bg-glass-light text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Sandbox notice */}
        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-glass-subtle border-b border-glass-border shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
          <p className="text-[11px] text-on-surface-variant">
            <strong>Testnet Sandbox:</strong> Simulated settlement on Sepolia. No real funds transferred.
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5">
          {/* STEP 1: FORM */}
          {step === "form" && (
            <div className="space-y-4">
              {/* Currency Selector */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Payout Currency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        currency === c.code
                          ? "border-accent/50 bg-accent/15 text-white shadow-glow-accent"
                          : "border-glass-border bg-glass-light text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {c.icon}
                      {c.code}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-on-surface-variant/70 mt-1.5 font-mono">
                  {currencyConfig.rail} • {currencyConfig.payoutHint}
                </p>
              </div>

              {/* Live Rate */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-glass-light border border-glass-border">
                <Zap className="w-3.5 h-3.5 text-accent-light" />
                <span className="text-xs font-mono font-medium text-on-surface">
                  {(ratesLoading && !isInrOnChain) || (currency === "INR" && inrOnChainLoading) ? "Fetching oracle rate…" : (
                    <>1 USDC = {currencyConfig.symbol}{liveRate.toFixed(2)} {currency}</>
                  )}
                </span>
                <span className="text-[10px] text-on-surface-variant/70 ml-auto font-mono">
                  {rateSource === "onchain"
                    ? "🔗 On-Chain Feed"
                    : rateSource === "api"
                      ? "🟢 Live Oracle"
                      : "⚠️ Fallback Rate"}
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Amount to Withdraw (USDC)
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
                    className="glass-input pr-16 text-base font-mono"
                  />
                  <button
                    onClick={() => setAmount(usdcBalance.toFixed(2))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-light bg-accent/15 hover:bg-accent/25 rounded-lg border border-accent/20 transition-colors"
                  >
                    Max
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant/70 mt-1 font-mono">
                  Available in Smart Wallet: {usdcBalance.toFixed(2)} USDC
                </p>
              </div>

              {/* Fiat Conversion Preview */}
              {numAmount > 0 && (
                <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Estimated Payout</span>
                    <span className="font-bold text-accent-light text-lg font-mono">
                      {currencyConfig.symbol}
                      {netFiat.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-on-surface-variant/70 font-mono">
                    <span>Protocol off-ramp fee (0.4%)</span>
                    <span>
                      -{currencyConfig.symbol}{fiatFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Payout Details */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  {currencyConfig.payoutLabel}
                </label>
                <input
                  id="payout-details"
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={currencyConfig.payoutPlaceholder}
                  className="glass-input text-sm"
                />
              </div>

              {/* Submit */}
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
                className="btn-gradient-primary w-full py-3.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-accent disabled:opacity-40 disabled:pointer-events-none"
              >
                <Shield className="w-4 h-4" />
                Confirm Withdrawal
                <ArrowRight className="w-4 h-4" />
              </TransactionButton>
            </div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "processing" && (
            <div className="py-6 space-y-5">
              <div className="text-center mb-6">
                <Loader2 className="w-10 h-10 text-accent-light animate-spin mx-auto mb-3" />
                <p className="font-display text-base font-semibold text-on-surface">
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
                          ? "bg-success/10 border-success/30 text-success-light"
                          : isCurrent
                          ? "bg-accent/10 border-accent/30 text-accent-light shadow-glow-accent"
                          : "bg-glass-light border-glass-border text-on-surface-variant/40"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-success-light shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-accent-light animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-glass-border shrink-0" />
                      )}
                      <span className="text-xs font-medium">
                        {i + 1}. {s.label}
                        {isDone ? " ✓" : isCurrent ? "…" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && (
            <div className="py-4 space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-3 shadow-glow-success">
                  <CheckCircle2 className="w-8 h-8 text-success-light" />
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Transfer Settled Successfully
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Settlement dispatched via {currencyConfig.rail}
                </p>
              </div>

              <div className="rounded-xl border border-glass-border bg-glass-subtle divide-y divide-glass-border text-xs">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-on-surface-variant">Amount Received</span>
                  <span className="font-bold text-success-light font-mono">
                    {currencyConfig.symbol}
                    {netFiat.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currency}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-on-surface-variant">USDC Burned</span>
                  <span className="font-semibold text-on-surface font-mono">
                    {numAmount.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-on-surface-variant">Destination</span>
                  <span className="font-mono text-on-surface truncate max-w-[200px]">
                    {payoutDetails}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-on-surface-variant">Reference ID</span>
                  <span className="font-mono text-accent-light">
                    {txRef}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="download-receipt-btn"
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-glass-border bg-glass-light hover:bg-glass-medium text-xs font-semibold text-on-surface transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <button
                  id="withdraw-close-btn"
                  onClick={handleClose}
                  className="btn-gradient-primary flex-1 py-3 text-xs font-semibold shadow-glow-accent"
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
