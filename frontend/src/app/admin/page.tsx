"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction, useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { escrowContract, client as thirdwebClient, client, CHAIN, accountAbstraction } from "@/lib/config";
import { formatUnits, parseUnits } from "viem";
import { useDisputeReasons } from "@/lib/useDisputeReasons";
import { Link as LinkIcon, ShieldAlert, ShieldCheck, Scale, ArrowUpRight, CheckCircle2, Lock } from "lucide-react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { STATUS_MAP, STATUS_COLORS } from "@/lib/constants";

interface JobData {
  id: number;
  client: string;
  freelancer: string;
  amount: bigint;
  releasedAmount: bigint;
  submittedAt: bigint;
  status: number;
  taskTitle: string;
  submissionLink: string;
}

export default function AdminDashboard() {
  const account = useActiveAccount();
  const { connect } = useConnect();
  
  const handleAdminEmailLogin = () => {
    const wallet = inAppWallet({
      executionMode: { mode: "EIP4337" as const, smartAccount: accountAbstraction }
    });
    connect(async () => {
      // @ts-expect-error - Gigly hack for quick admin login
      await wallet.connect({
        client,
        chain: CHAIN,
        strategy: "email",
        email: "gigilytest3@yopmail.com",
      });
      return wallet;
    });
  };

  const { data: arbiterAddress, isLoading: arbiterLoading } = useReadContract({
    contract: escrowContract,
    method: "function arbiter() view returns (address)",
    params: []
  });

  const isArbiter = account && arbiterAddress && account.address.toLowerCase() === arbiterAddress.toLowerCase();

  if (arbiterLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant text-sm font-mono">Authenticating with Arbiter contract...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen py-16 px-6 max-w-4xl mx-auto flex flex-col justify-center">
        <div className="surface-card rounded-3xl p-8 sm:p-12 shadow-level-2 max-w-xl mx-auto w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border flex items-center justify-center mx-auto mb-6 text-accent-light shadow-glow-accent">
            <Scale className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface mb-2">Decentralized Arbiter Portal</h1>
          <p className="text-body-sm text-on-surface-variant mb-8 max-w-sm mx-auto">
            Connect your designated Arbiter smart account to arbitrate disputed contracts and distribute escrow allocations.
          </p>
          <div className="flex flex-col gap-4 items-center justify-center">
            <CustomConnectButton />
            <span className="text-xs text-slate-600 font-mono uppercase tracking-wider font-semibold">or direct smart wallet</span>
            <button 
              onClick={handleAdminEmailLogin}
              className="text-xs font-semibold py-2.5 px-5 rounded-xl border border-glass-border bg-glass-light hover:bg-glass-medium text-on-surface transition-all"
            >
              Sign in as Demo Arbiter (gigilytest3@yopmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isArbiter) {
    return (
      <div className="min-h-screen py-16 px-6 max-w-3xl mx-auto">
        <div className="surface-card rounded-3xl p-8 sm:p-10 shadow-level-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-glass-border pb-5">
            <div className="w-10 h-10 rounded-xl bg-error/15 border border-error/30 flex items-center justify-center text-error">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">Arbiter Access Required</h1>
              <p className="text-xs text-on-surface-variant font-mono">Restricted Smart Contract Function</p>
            </div>
          </div>

          <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-xs leading-relaxed">
            <strong>Access Denied:</strong> Connected wallet <code className="font-mono">{account.address}</code> is not registered as the authorized arbiter on contract <code className="font-mono">{escrowContract.address}</code>.
          </div>

          <div className="bg-glass-subtle border border-glass-border text-on-surface p-5 rounded-2xl text-xs space-y-3">
            <p className="font-semibold text-accent-light uppercase tracking-wider">How to assign this wallet as Arbiter:</p>
            <p className="text-on-surface-variant">Run the following command from the <code className="font-mono">contracts/</code> directory with deployer credentials:</p>
            <code className="bg-surface-container-lowest border border-glass-border p-3 rounded-xl block font-mono text-accent-light text-[11px] overflow-x-auto select-all">
              $env:NEW_ARBITER=&quot;{account.address}&quot;; npx hardhat run scripts/set_arbiter.ts --network sepolia
            </code>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDisputes />;
}

function AdminDisputes() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const disputeReasons = useDisputeReasons(refreshCounter);

  const { data: jobCountData } = useReadContract({
    contract: escrowContract,
    method: "function jobCount() view returns (uint256)",
    params: []
  });

  useEffect(() => {
    async function fetchDisputedJobs() {
      if (jobCountData === undefined) return;
      
      const count = Number(jobCountData);
      if (count === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));
        
        const allJobs = await Promise.all(
          jobIds.map(async (id) => {
            const data = await readContract({
              contract: escrowContract,
              method: "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 releasedAmount, uint256 submittedAt, uint8 status, string taskTitle, string submissionLink)",
              params: [id],
            });
            return {
              id: Number(id),
              client: data[0],
              freelancer: data[1],
              amount: data[2],
              releasedAmount: data[3],
              submittedAt: data[4],
              status: data[5],
              taskTitle: data[6],
              submissionLink: data[7],
            } as JobData;
          })
        );

        const disputedJobs = allJobs.filter((job) => job.status === 3);
        setJobs(disputedJobs.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDisputedJobs();
  }, [jobCountData, refreshCounter]);

  return (
    <div className="py-8 px-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 surface-card p-6 rounded-3xl shadow-level-1">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-error to-error/80 flex items-center justify-center text-white shadow-glow-accent">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-on-surface">Arbiter Dispute Panel</h1>
            <p className="text-xs text-on-surface-variant">Cryptographic split &amp; settlement resolution</p>
          </div>
        </div>
        <CustomConnectButton />
      </div>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant text-sm font-mono">Fetching disputed contracts from Ethereum Sepolia...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="surface-card p-12 rounded-3xl border-dashed border-glass-border text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border flex items-center justify-center mx-auto text-success-light">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="font-display text-lg font-bold text-on-surface">Zero Pending Disputes</h2>
          <p className="text-on-surface-variant text-xs max-w-sm mx-auto">
            All escrow jobs are executing normally without conflict. Any job with a raised dispute will appear here for adjudication.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <DisputeRow 
              key={job.id} 
              job={job} 
              onResolved={() => setRefreshCounter(c => c + 1)} 
              submissionLink={job.submissionLink}
              disputeReason={disputeReasons[job.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeRow({ job, onResolved, submissionLink, disputeReason }: { job: JobData, onResolved: () => void, submissionLink?: string, disputeReason?: string }) {
  const [amountInput, setAmountInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

  const maxAmount = Number(formatUnits(job.amount, 6));

  const handleResolve = async () => {
    const val = Number(amountInput);
    if (isNaN(val) || val < 0 || val > maxAmount) {
      alert("Invalid allocation amount.");
      return;
    }

    try {
      setProcessing(true);
      const amountToFreelancer = parseUnits(amountInput, 6);
      
      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function resolveDispute(uint256 jobId, uint256 amountToFreelancer)",
        params: [BigInt(job.id), amountToFreelancer],
      });

      const result = await sendTransaction(tx);
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      onResolved();
    } catch (err) {
      console.error("Failed to resolve dispute:", err);
      alert("Failed to resolve dispute.");
    } finally {
      setProcessing(false);
    }
  };

  const freelancerShare = Number(amountInput) || 0;
  const clientRefund = Math.max(0, maxAmount - freelancerShare);

  return (
    <div className="surface-card-interactive rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group">
      {/* Top red accent highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-error/40 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-glass-border pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[11px] text-on-surface-variant font-mono tracking-widest uppercase bg-glass-light px-2.5 py-0.5 rounded-full border border-glass-border">
              Job #{job.id}
            </span>
            <Badge variant="danger">
              Disputed
            </Badge>
          </div>
          <h3 className="font-display font-semibold text-on-surface text-xl">
            {job.taskTitle || `Job #${job.id}`}
          </h3>
          <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-on-surface-variant">
            <span>Client: <span className="text-on-surface">{job.client.slice(0, 6)}...{job.client.slice(-4)}</span></span>
            <span>Freelancer: <span className="text-on-surface">{job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</span></span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[11px] text-slate-700 uppercase font-mono tracking-wider font-bold">Locked in Escrow</p>
          <div className="font-display font-bold text-on-surface text-2xl font-mono text-gradient-warm">
            {maxAmount.toFixed(2)} USDC
          </div>
        </div>
      </div>

      {/* Evidence & Submission Panels */}
      <div className="grid sm:grid-cols-2 gap-4 my-4">
        <div className="bg-glass-subtle border border-glass-border p-4 rounded-xl space-y-1.5">
          <p className="text-xs font-semibold text-accent-light uppercase tracking-wider">Freelancer Deliverable:</p>
          {submissionLink ? (
            <a 
              href={submissionLink.startsWith('http') ? submissionLink : `https://${submissionLink}`}
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent-light hover:text-white underline font-mono break-all"
            >
              <LinkIcon className="w-3.5 h-3.5 shrink-0" />
              {submissionLink}
              <ArrowUpRight className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="text-xs text-slate-600 italic font-mono font-medium">No link attached</span>
          )}
        </div>

        <div className="bg-glass-subtle border border-glass-border p-4 rounded-xl space-y-1.5">
          <p className="text-xs font-semibold text-error uppercase tracking-wider">Client Dispute Claim:</p>
          {disputeReason ? (
            <p className="text-xs text-on-surface-variant leading-relaxed">{disputeReason}</p>
          ) : (
            <span className="text-xs text-slate-600 italic font-mono font-medium">No statement provided</span>
          )}
        </div>
      </div>

      {/* Split & Adjudication Controls */}
      <div className="bg-surface-container-lowest border border-glass-border p-4 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <label className="font-semibold text-on-surface uppercase tracking-wider">
                Allocation to Freelancer (USDC)
              </label>
              <span className="text-on-surface-variant font-mono">Max: {maxAmount} USDC</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-on-surface-variant font-mono text-sm">$</span>
              <input 
                type="number" 
                max={maxAmount}
                min={0}
                step="0.01"
                className="glass-input pl-8 text-sm font-mono"
                value={amountInput}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > maxAmount) {
                    setAmountInput(maxAmount.toString());
                  } else {
                    setAmountInput(e.target.value);
                  }
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <Button 
            onClick={handleResolve}
            disabled={processing || amountInput === ""}
            variant="primary"
            className="w-full sm:w-auto px-6 py-3 text-xs font-semibold uppercase tracking-wider shadow-glow-accent"
          >
            {processing ? "Executing on-chain..." : "Resolve & Execute Settlement"}
          </Button>
        </div>

        {/* Settlement Summary preview */}
        {amountInput !== "" && (
          <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-glass-border text-on-surface-variant font-mono">
            <span>Freelancer Receives: <strong className="text-success-light">${freelancerShare.toFixed(2)} USDC</strong></span>
            <span>Client Refund: <strong className="text-accent-light">${clientRefund.toFixed(2)} USDC</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
