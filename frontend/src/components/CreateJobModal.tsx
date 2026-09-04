"use client";

import { useState, useEffect, useCallback } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useSendTransaction, useReadContract, useActiveAccount } from "thirdweb/react";
import { usdcContract, escrowContract, CONTRACTS, client } from "@/lib/config";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Loader2,
  Wallet,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { parseUnits } from "viem";

export interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  freelancerName?: string;
  freelancerAddress?: string;
  suggestedRate?: number;
}

type Step =
  | "input"       // User fills in title + amount
  | "funding"     // Prompt to get USDC from Circle faucet
  | "approving"   // Waiting for USDC approval tx
  | "creating"    // Waiting for createJob tx
  | "success";    // Job created!

export function CreateJobModal({
  isOpen,
  onClose,
  onSuccess,
  freelancerName,
  freelancerAddress,
  suggestedRate,
}: CreateJobModalProps) {
  const account = useActiveAccount();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isOpen && suggestedRate && !amount) {
      setAmount(String(suggestedRate));
    }
  }, [isOpen, suggestedRate, amount]);

  const [step, setStep] = useState<Step>("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

  // ── Read USDC Balance & Allowance ─────────────────────────────────────────
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    contract: usdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: account
      ? [account.address]
      : ["0x0000000000000000000000000000000000000000"],
  });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    contract: usdcContract,
    method: "function allowance(address owner, address spender) view returns (uint256)",
    params: account
      ? [account.address, CONTRACTS.OptimisticEscrow]
      : ["0x0000000000000000000000000000000000000000", CONTRACTS.OptimisticEscrow],
  });

  useEffect(() => {
    if (isOpen && account) {
      refetchBalance();
      refetchAllowance();
    }
  }, [isOpen, account, refetchBalance, refetchAllowance]);

  const usdcBalance = balanceData ? Number(balanceData) / 1e6 : 0;

  let parsedAmount = BigInt(0);
  try {
    parsedAmount = amount ? parseUnits(amount, 6) : BigInt(0);
  } catch { /* ignore while typing */ }

  const hasInsufficientBalance =
    parsedAmount > BigInt(0) && BigInt(balanceData || 0) < parsedAmount;

  const targetAddress =
    freelancerAddress || "0x0000000000000000000000000000000000000000";

  const handleCopyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckBalance = useCallback(async () => {
    setIsRefreshing(true);
    await refetchBalance();
    await refetchAllowance();
    setIsRefreshing(false);
  }, [refetchBalance, refetchAllowance]);

  useEffect(() => {
    if (step !== "funding") return;
    if (!parsedAmount || parsedAmount === BigInt(0)) return;
    if (BigInt(balanceData || 0) >= parsedAmount) {
      executeJobCreation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceData, step]);

  const executeJobCreation = useCallback(async () => {
    if (!account || !title || !amount) return;
    setErrorMessage("");

    try {
      const withTimeout = (p: Promise<unknown>, ms: number, label: string) => {
        let h: NodeJS.Timeout;
        return Promise.race([
          p,
          new Promise((_, rej) => {
            h = setTimeout(() => rej(new Error(`${label} timed out`)), ms);
          }),
        ]).finally(() => clearTimeout(h));
      };

      const { data: freshAllowance } = await refetchAllowance();
      const needsApproval = BigInt(freshAllowance ?? 0) < parsedAmount;

      if (needsApproval) {
        setStep("approving");
        const approveTx = prepareContractCall({
          contract: usdcContract,
          method: "function approve(address spender, uint256 amount) returns (bool)",
          params: [CONTRACTS.OptimisticEscrow, parsedAmount],
        });
        const { transactionHash } = await sendTransaction(approveTx);
        await withTimeout(
          waitForReceipt({ client, chain: usdcContract.chain, transactionHash }),
          45000, "Approval"
        );
      }

      setStep("creating");
      const createTx = prepareContractCall({
        contract: escrowContract,
        method:
          "function createJob(address freelancer, uint256 amount, string taskTitle) returns (uint256)",
        params: [targetAddress.toLowerCase(), parsedAmount, title],
      });
      const { transactionHash } = await sendTransaction(createTx);
      await withTimeout(
        waitForReceipt({ client, chain: escrowContract.chain, transactionHash }),
        45000, "Create job"
      );

      setStep("success");
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg.length > 150 ? msg.slice(0, 150) + "…" : msg);
      setStep("input");
    }
  }, [account, title, amount, parsedAmount, targetAddress, sendTransaction, refetchAllowance, onSuccess]);

  const handleHire = () => {
    if (!account || !title || !amount) return;
    if (hasInsufficientBalance) {
      setStep("funding");
      return;
    }
    executeJobCreation();
  };

  const resetAndClose = () => {
    setTitle(""); setAmount(""); setErrorMessage("");
    setStep("input");
    onClose();
  };

  if (!isOpen) return null;

  const isProcessing = step === "approving" || step === "creating";

  const modalTitle =
    step === "funding" ? "Get Testnet USDC"
    : freelancerName ? `Fund Escrow: ${freelancerName}`
    : "Create Escrow Job";

  const neededAmount = parseFloat(amount) || 0;
  const shortfall = Math.max(0, neededAmount - usdcBalance).toFixed(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : resetAndClose}
      title={modalTitle}
    >
      {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success-light mb-4 shadow-glow-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-on-surface mb-2">
            Escrow Funded Successfully!
          </h3>
          <p className="text-body-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
            Your {amount} USDC is securely held in the smart contract escrow.{" "}
            {freelancerName
              ? `${freelancerName} can now begin work safely.`
              : "The gig is now open on the marketplace for freelancers."}
          </p>
          <Button onClick={resetAndClose} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* ── FUNDING SCREEN ───────────────────────────────────────────────── */}
      {step === "funding" && (
        <div className="flex flex-col gap-4">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-glass-light border border-glass-border rounded-xl p-3.5 text-center">
              <p className="text-xs text-slate-700 font-semibold mb-1">Your Balance</p>
              <p className="text-xl font-bold font-mono text-on-surface">{usdcBalance.toFixed(2)}</p>
              <p className="text-[11px] text-slate-700 font-mono font-bold">USDC</p>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-3.5 text-center">
              <p className="text-xs text-amber-800 font-semibold mb-1">Shortfall</p>
              <p className="text-xl font-bold font-mono text-warning">{shortfall}</p>
              <p className="text-[11px] text-amber-800 font-mono font-bold">USDC</p>
            </div>
          </div>

          {/* Step 1 — Circle Faucet */}
          <div className="rounded-xl border border-glass-border bg-glass-subtle overflow-hidden">
            <div className="bg-glass-light px-4 py-2.5 border-b border-glass-border flex items-center justify-between">
              <p className="text-xs font-semibold text-accent-light uppercase tracking-wider">
                Step 1 — Official Circle Faucet
              </p>
              <span className="text-[10px] text-slate-700 font-mono font-semibold">Ethereum Sepolia</span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-body-sm text-slate-700 font-medium leading-relaxed">
                Claim up to <strong>10 USDC</strong> per day from the official Circle faucet for Ethereum Sepolia testnet.
              </p>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                id="circle-faucet-link"
                className="btn-gradient-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Circle USDC Faucet
              </a>
            </div>
          </div>

          {/* Step 2 — Check Balance */}
          <div className="rounded-xl border border-glass-border bg-glass-subtle overflow-hidden">
            <div className="bg-glass-light px-4 py-2.5 border-b border-glass-border">
              <p className="text-xs font-semibold text-accent-light uppercase tracking-wider">
                Step 2 — Verify & Continue
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-body-sm text-on-surface-variant">
                Once claimed in your wallet, refresh below. Job creation will proceed automatically once your balance covers the escrow.
              </p>
              <button
                id="check-balance-btn"
                onClick={handleCheckBalance}
                disabled={isRefreshing}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-glass-light hover:bg-glass-medium transition-all py-3 text-sm font-medium text-on-surface disabled:opacity-50"
              >
                {isRefreshing ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-accent" />Checking balance…</>
                ) : (
                  <><RefreshCw className="w-4 h-4 text-accent" />Check Balance & Proceed</>
                )}
              </button>
            </div>
          </div>

          {/* Wallet address copy */}
          {account && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-accent-light" />
                <p className="text-xs font-semibold text-accent-light uppercase tracking-wider">
                  Target Deposit Address
                </p>
              </div>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-2 w-full text-left bg-glass-light border border-glass-border rounded-lg px-3 py-2 hover:border-accent/40 active:scale-[0.99] transition-all group"
              >
                <span className="flex-1 text-xs font-mono text-on-surface truncate">
                  {account.address}
                </span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success-light shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-accent-light shrink-0 transition-colors" />
                )}
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => setStep("input")}
            className="w-full flex items-center justify-center gap-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Details
          </Button>
        </div>
      )}

      {/* ── INPUT / APPROVING / CREATING ─────────────────────────────────── */}
      {(step === "input" || step === "approving" || step === "creating") && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Task Deliverable Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Web3 Staking Contract & Frontend"
              className="glass-input text-sm"
              disabled={step !== "input"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Escrow Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-on-surface-variant font-mono">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="glass-input pl-8 text-sm font-mono"
                disabled={step !== "input"}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2 px-1">
              <span>
                Available:{" "}
                <span className={usdcBalance === 0 ? "text-warning font-mono" : "font-mono text-on-surface"}>
                  {usdcBalance.toFixed(2)} USDC
                </span>
              </span>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-light hover:underline inline-flex items-center gap-1"
              >
                Circle Faucet <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Insufficient balance notification */}
          {hasInsufficientBalance && (
            <div className="flex items-start gap-2.5 bg-warning/10 text-warning p-3.5 rounded-xl border border-warning/20 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                You need <strong>{shortfall} more USDC</strong>.{" "}
                <button
                  onClick={() => setStep("funding")}
                  className="underline font-semibold hover:text-white transition-colors"
                >
                  Get free testnet USDC →
                </button>
              </p>
            </div>
          )}

          {/* Blockchain transaction active state indicators */}
          {step === "approving" && (
            <div className="flex items-center gap-3 bg-accent/10 border border-accent/25 p-4 rounded-xl text-accent-light text-xs">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-white">Step 1 of 2: Approving USDC</p>
                <p className="text-on-surface-variant mt-0.5">Authorizing the OptimisticEscrow contract to lock your funds...</p>
              </div>
            </div>
          )}

          {step === "creating" && (
            <div className="flex items-center gap-3 bg-accent/10 border border-accent/25 p-4 rounded-xl text-accent-light text-xs">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-white">Step 2 of 2: Creating Escrow Job</p>
                <p className="text-on-surface-variant mt-0.5">Deploying job to Ethereum Sepolia and locking funds...</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 bg-error/10 text-error p-3.5 rounded-xl border border-error/20 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <strong>Transaction Failed:</strong>
                <p className="mt-1 opacity-90 break-all">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2.5 border-t border-glass-border mt-6">
            <Button variant="ghost" onClick={resetAndClose} disabled={step !== "input"}>
              Cancel
            </Button>
            <Button
              onClick={handleHire}
              disabled={!title || !amount || step !== "input"}
              variant="primary"
              className="px-6"
            >
              {step === "approving" ? "Approving USDC…"
                : step === "creating" ? "Locking Escrow…"
                : hasInsufficientBalance ? "Get USDC & Create"
                : "Lock Funds in Escrow"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
