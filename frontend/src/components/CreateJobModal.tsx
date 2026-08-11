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
} from "lucide-react";
import { parseUnits } from "viem";

export interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  freelancerName?: string;
  freelancerAddress?: string;
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
}: CreateJobModalProps) {
  const account = useActiveAccount();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { mutateAsync: sendTransaction } = useSendTransaction();

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

  // Copy smart wallet address to clipboard
  const handleCopyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Check balance on the funding screen then auto-proceed ─────────────────
  const handleCheckBalance = useCallback(async () => {
    setIsRefreshing(true);
    await refetchBalance();
    await refetchAllowance();
    setIsRefreshing(false);
  }, [refetchBalance, refetchAllowance]);

  // Watch balance while on funding screen — proceed when sufficient
  useEffect(() => {
    if (step !== "funding") return;
    if (!parsedAmount || parsedAmount === BigInt(0)) return;
    if (BigInt(balanceData || 0) >= parsedAmount) {
      // Balance is now sufficient — proceed automatically
      executeJobCreation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceData, step]);

  // ── Core job-creation logic ───────────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, title, amount, parsedAmount, targetAddress, allowanceData, sendTransaction, refetchAllowance, onSuccess]);

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
    : freelancerName ? `Hire ${freelancerName}`
    : "Post an Open Job";

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
          <CheckCircle2 className="w-16 h-16 text-status-success mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Job Created Successfully!
          </h3>
          <p className="text-slate-500 mb-6">
            The USDC has been locked in escrow and{" "}
            {freelancerName
              ? `${freelancerName} has been notified`
              : "the job is now open for freelancers to claim"}
            .
          </p>
          <Button onClick={resetAndClose} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* ── FUNDING SCREEN — Guide user to Circle Faucet ─────────────────── */}
      {step === "funding" && (
        <div className="flex flex-col gap-4">

          {/* Status: current vs needed */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Your balance</p>
              <p className="text-lg font-bold text-slate-900">{usdcBalance.toFixed(2)}</p>
              <p className="text-xs text-slate-400">USDC</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <p className="text-xs text-rose-600 mb-1">Still need</p>
              <p className="text-lg font-bold text-rose-700">{shortfall}</p>
              <p className="text-xs text-rose-400">USDC</p>
            </div>
          </div>

          {/* Step 1 — Circle faucet */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Step 1 — Get Testnet USDC
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">
                Visit the <strong>Circle Testnet Faucet</strong> to claim up to{" "}
                <strong>10 USDC</strong> per day for free. Make sure your{" "}
                <strong>Ethereum Sepolia</strong> wallet is connected.
              </p>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                id="circle-faucet-link"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#0066CC] hover:bg-[#0055AA] active:scale-[0.98] transition-all text-white font-semibold py-3 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open Circle Faucet
              </a>
            </div>
          </div>

          {/* Step 2 — Check balance */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Step 2 — Refresh & Proceed
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">
                After claiming, click below to check your updated balance. Job
                creation will start automatically once you have enough USDC.
              </p>
              <button
                id="check-balance-btn"
                onClick={handleCheckBalance}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 active:scale-[0.98] transition-all py-3 text-sm font-semibold text-primary disabled:opacity-60 disabled:pointer-events-none"
              >
                {isRefreshing
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Checking…</>
                  : <><RefreshCw className="w-4 h-4" />Check Balance & Proceed</>
                }
              </button>
            </div>
          </div>

          {/* ── Smart wallet address — copy to fund it ──────────────────── */}
          {account && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-primary/10 flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Your Gigly Smart Wallet Address
                </p>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-slate-500">
                  ⚠️ This is <strong>not</strong> your MetaMask address. Send Circle
                  USDC to <strong>this address</strong> on Sepolia.
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 w-full text-left bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-primary/40 active:scale-[0.99] transition-all group"
                >
                  <span className="flex-1 text-xs font-mono text-slate-700 truncate">
                    {account.address}
                  </span>
                  {copied
                    ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary shrink-0 transition-colors" />
                  }
                </button>
                {copied && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Copied to clipboard</p>
                )}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => setStep("input")}
            className="w-full flex items-center justify-center gap-2"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design Landing Page"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={step !== "input"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={step !== "input"}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>
                Available:{" "}
                <span className={usdcBalance === 0 ? "text-amber-600 font-medium" : "font-medium"}>
                  {usdcBalance.toFixed(2)} USDC
                </span>
              </span>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Get USDC <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* Insufficient balance */}
          {hasInsufficientBalance && (
            <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                You need <strong>{shortfall} more USDC</strong>.{" "}
                <button
                  onClick={() => setStep("funding")}
                  className="underline font-medium hover:text-amber-900 transition-colors"
                >
                  Get testnet USDC →
                </button>
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong>Transaction Failed</strong>
                <p className="mt-1 opacity-90 break-all">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <Button variant="ghost" onClick={resetAndClose} disabled={step !== "input"}>
              Cancel
            </Button>
            <Button
              onClick={handleHire}
              disabled={!title || !amount || step !== "input"}
            >
              {step === "approving" ? "Approving USDC…"
                : step === "creating" ? "Creating Job…"
                : hasInsufficientBalance ? "Get USDC & Create Job"
                : "Create Job"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
