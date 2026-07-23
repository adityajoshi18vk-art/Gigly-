"use client";

import { useState, useEffect } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useSendTransaction, useReadContract, useActiveAccount } from "thirdweb/react";
import { mockUsdcContract, escrowContract, CONTRACTS, client } from "@/lib/config";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { parseUnits } from "viem";

export interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  freelancerName?: string;
  freelancerAddress?: string;
}

export function CreateJobModal({ isOpen, onClose, onSuccess, freelancerName, freelancerAddress }: CreateJobModalProps) {
  const account = useActiveAccount();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approving" | "creating" | "success">("input");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutateAsync: sendTransaction } = useSendTransaction();

  // Read USDC Balance and Allowance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    contract: mockUsdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: account ? [account.address] : ["0x0000000000000000000000000000000000000000"],
  });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    contract: mockUsdcContract,
    method: "function allowance(address owner, address spender) view returns (uint256)",
    params: account ? [account.address, CONTRACTS.OptimisticEscrow] : ["0x0000000000000000000000000000000000000000", CONTRACTS.OptimisticEscrow],
  });

  // Refetch data when modal opens
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
  } catch {
    // catch parse errors
  }

  const hasInsufficientBalance = parsedAmount > BigInt(0) && BigInt(balanceData || 0) < parsedAmount;
  const needsApproval = allowanceData !== undefined && BigInt(allowanceData) < parsedAmount;

  const targetAddress = freelancerAddress || "0x0000000000000000000000000000000000000000";

  const handleHire = async () => {
    if (!account || !title || !amount || hasInsufficientBalance) return;

    setErrorMessage("");
    console.log("=== JOB CREATION STARTED ===");
    console.log("Freelancer:", targetAddress.toLowerCase());
    console.log("Amount:", amount, "USDC");
    console.log("Parsed Amount (decimals=6):", parsedAmount.toString());

    try {
      // Helper for transaction timeout
      const withTimeout = (promise: Promise<any>, timeoutMs: number, operationName: string) => {
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`${operationName} timed out after ${timeoutMs / 1000}s`));
          }, timeoutMs);
        });

        return Promise.race([
          promise,
          timeoutPromise
        ]).finally(() => clearTimeout(timeoutHandle));
      };

      if (needsApproval) {
        console.log("Stage 1/2: Requesting USDC approval...");
        setStep("approving");
        
        const approveTx = prepareContractCall({
          contract: mockUsdcContract,
          method: "function approve(address spender, uint256 amount) returns (bool)",
          params: [CONTRACTS.OptimisticEscrow, parsedAmount],
        });
        
        const approveResult = await sendTransaction(approveTx);
        console.log("Approval TX Hash:", approveResult.transactionHash);
        
        console.log("Waiting for approval receipt...");
        await withTimeout(
          waitForReceipt({
            client,
            chain: mockUsdcContract.chain,
            transactionHash: approveResult.transactionHash,
          }),
          45000, 
          "Approval transaction"
        );
        console.log("Approval confirmed!");
      } else {
        console.log("Stage 1/2: Sufficient allowance already exists. Skipping approval.");
      }

      console.log("Stage 2/2: Creating job on escrow contract...");
      setStep("creating");
      const createJobTx = prepareContractCall({
        contract: escrowContract,
        method: "function createJob(address freelancer, uint256 amount, string taskTitle) returns (uint256)",
        params: [targetAddress.toLowerCase(), parsedAmount, title],
      });
      
      const createResult = await sendTransaction(createJobTx);
      console.log("Create Job TX Hash:", createResult.transactionHash);
      
      console.log("Waiting for create job receipt...");
      await withTimeout(
        waitForReceipt({
          client,
          chain: escrowContract.chain,
          transactionHash: createResult.transactionHash,
        }),
        45000,
        "Create job transaction"
      );
      
      console.log("=== JOB CREATION SUCCESSFUL ===");
      setStep("success");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("=== JOB CREATION FAILED ===");
      console.error("Error details:", error);
      
      const errString = error?.message || String(error);
      setErrorMessage(errString.length > 150 ? errString.substring(0, 150) + "..." : errString);
      setStep("input");
    }
  };

  const resetAndClose = () => {
    setTitle("");
    setAmount("");
    setErrorMessage("");
    setStep("input");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={step === "input" || step === "success" ? resetAndClose : () => {}} title={freelancerName ? `Hire ${freelancerName}` : "Post an Open Job"}>
      {step === "success" ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-status-success mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Job Created Successfully!</h3>
          <p className="text-slate-500 mb-6">
            The USDC has been locked in escrow and {freelancerName ? `${freelancerName} has been notified` : "the job is now open for freelancers to claim"}.
          </p>
          <Button onClick={resetAndClose} className="w-full">Back to Dashboard</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (USDC)</label>
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
            <p className="text-xs text-slate-500 mt-1">Available balance: {usdcBalance.toFixed(2)} USDC</p>
          </div>

          {hasInsufficientBalance && (
            <div className="flex items-start gap-2 bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                Insufficient balance. You need to fund your smart account with MockUSDC before hiring.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 mt-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong>Transaction Failed</strong>
                <p className="mt-1 opacity-90 break-all">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <Button variant="ghost" onClick={resetAndClose} disabled={step !== "input"}>Cancel</Button>
            <Button 
              onClick={handleHire} 
              disabled={!title || !amount || hasInsufficientBalance || step !== "input"}
            >
              {step === "approving" ? "Approving USDC..." : 
               step === "creating" ? "Creating Job..." : "Create Job"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
