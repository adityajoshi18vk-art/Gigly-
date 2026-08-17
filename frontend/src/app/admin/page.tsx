"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction, useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { escrowContract, client as thirdwebClient, client, CHAIN, accountAbstraction } from "@/lib/config";
import { formatUnits, parseUnits } from "viem";
import { useDisputeReasons } from "@/lib/useDisputeReasons";
import { Link as LinkIcon } from "lucide-react";
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

  // Read arbiter address
  const { data: arbiterAddress, isLoading: arbiterLoading } = useReadContract({
    contract: escrowContract,
    method: "function arbiter() view returns (address)",
    params: []
  });

  const isArbiter = account && arbiterAddress && account.address.toLowerCase() === arbiterAddress.toLowerCase();

  if (arbiterLoading) {
    return <div className="p-8 font-sans">Loading admin data...</div>;
  }

  if (!account) {
    return (
      <div className="p-8 font-sans max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-slate-900">Admin Dashboard</h1>
        <p className="mb-4 text-slate-600">Please connect your wallet.</p>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <CustomConnectButton />
          <span className="text-slate-400">or</span>
          <button 
            onClick={handleAdminEmailLogin}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Sign in as gigilytest3@yopmail.com
          </button>
        </div>
      </div>
    );
  }

  if (!isArbiter) {
    return (
      <div className="p-8 font-sans max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-slate-900">Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          Access Denied. Your connected wallet ({account.address}) is not the authorized arbiter.
        </div>
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm">
          <p className="font-bold mb-2">How to become Arbiter:</p>
          <p className="mb-2">The deployer of the contract must run the following command in the <code>contracts</code> directory:</p>
          <code className="bg-blue-100 px-2 py-1 rounded block whitespace-pre overflow-x-auto">
            $env:NEW_ARBITER=&quot;{account.address}&quot;; npx hardhat run scripts/set_arbiter.ts --network sepolia
          </code>
        </div>
      </div>
    );
  }

  return <AdminDisputes />
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

        // Filter for Disputed jobs (status === 3)
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
    <div className="p-8 font-sans max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Disputed Jobs Resolution</h1>
        <CustomConnectButton />
      </div>
      
      {loading ? (
        <div className="text-slate-500">Loading disputed jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-slate-500">
          No disputed jobs at this time. All clear!
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
      alert("Invalid amount.");
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
      alert("Failed to resolve dispute. See console.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border border-slate-200 p-5 rounded-lg bg-white flex flex-col gap-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-slate-800 text-lg">Job #{job.id}: {job.taskTitle || "Untitled"}</h3>
            <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
              {STATUS_MAP[job.status] || "Unknown"}
            </Badge>
          </div>
          <div className="text-sm text-slate-600 mt-1 font-mono">Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}</div>
          <div className="text-sm text-slate-600 font-mono">Freelancer: {job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</div>
        </div>
        <div className="text-left sm:text-right">
          <div className="font-bold text-slate-900 text-xl">{maxAmount} USDC</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Locked Amount</div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-4 rounded-md flex flex-col sm:flex-row gap-4 sm:gap-8 mt-2 mb-2 text-sm">
        <div className="flex-1">
          <p className="font-semibold text-slate-700 mb-1">Freelancer&apos;s Submission:</p>
          {submissionLink ? (
            <a 
              href={submissionLink.startsWith('http') ? submissionLink : `https://${submissionLink}`}
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              View Work
            </a>
          ) : (
            <span className="text-slate-400 italic">No link available</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-700 mb-1">Client&apos;s Dispute Reason:</p>
          {disputeReason ? (
            <p className="text-slate-600 whitespace-pre-wrap">{disputeReason}</p>
          ) : (
            <span className="text-slate-400 italic">No reason provided</span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-end gap-4 mt-2">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold mb-1.5 text-slate-700">
            Amount to Freelancer (USDC)
            <span className="text-slate-500 ml-2 font-normal">(Max: {maxAmount} USDC)</span>
          </label>
          <input 
            type="number" 
            max={maxAmount}
            min={0}
            step="0.01"
            className="border border-slate-300 p-2.5 rounded w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={amountInput}
            onChange={(e) => {
              const val = Number(e.target.value);
              // Client-side validation: cap at maxAmount
              if (val > maxAmount) {
                setAmountInput(maxAmount.toString());
              } else {
                setAmountInput(e.target.value);
              }
            }}
            placeholder="0.00"
          />
        </div>
        <Button 
          onClick={handleResolve}
          disabled={processing || amountInput === ""}
          className="w-full md:w-auto"
        >
          {processing ? "Resolving..." : "Resolve"}
        </Button>
      </div>
    </div>
  );
}
