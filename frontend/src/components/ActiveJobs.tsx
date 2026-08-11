"use client";

import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { escrowContract } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatUnits } from "viem";
import { Link as LinkIcon } from "lucide-react";
import { useProgressUpdates } from "@/lib/useProgressUpdates";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { client as thirdwebClient } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

import { STATUS_MAP, STATUS_COLORS } from "@/lib/constants";

export interface JobData {
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

export function ActiveJobs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess?: () => void }) {
  const account = useActiveAccount();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const progressUpdates = useProgressUpdates(refreshCounter);
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  const [disputeModalJobId, setDisputeModalJobId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const handleApprove = async (jobId: number) => {
    try {
      setProcessingJobId(jobId);
      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function approveAndRelease(uint256 jobId)",
        params: [BigInt(jobId)],
      });
      const result = await sendTransaction(tx);
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      if (onInteractionSuccess) onInteractionSuccess();
    } catch (err) {
      console.error("Failed to approve job:", err);
      alert("Failed to approve and release funds.");
    } finally {
      setProcessingJobId(null);
    }
  };

  const submitDispute = async () => {
    if (!disputeModalJobId || disputeReason.trim().length < 5) return;
    try {
      setProcessingJobId(disputeModalJobId);
      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function raiseDispute(uint256 jobId, string reason)",
        params: [BigInt(disputeModalJobId), disputeReason],
      });
      const result = await sendTransaction(tx);
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      if (onInteractionSuccess) onInteractionSuccess();
      setDisputeModalJobId(null);
      setDisputeReason("");
    } catch (err) {
      console.error("Failed to raise dispute:", err);
      alert("Failed to raise dispute.");
    } finally {
      setProcessingJobId(null);
    }
  };

  const { data: jobCountData } = useReadContract({
    contract: escrowContract,
    method: "function jobCount() view returns (uint256)",
    params: []
  });

  useEffect(() => {
    async function fetchJobs() {
      if (!account || jobCountData === undefined) return;
      
      const count = Number(jobCountData);
      if (count === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Create an array of job IDs from 1 to count
        const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));
        
        // Fetch all jobs in parallel
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

        // Show all jobs (no address filter) — the contract enforces
        // client-only actions on-chain, so showing all jobs is safe.
        // This also handles the EOA↔smart-account address mismatch that
        // occurs when accountAbstraction is toggled.
        const activeJobs = allJobs.filter((job) => job.status < 4); // hide Released/Refunded

        // Sort descending (newest first)
        setJobs(activeJobs.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [account, jobCountData, refreshCounter]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Loading your jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No active jobs</h2>
        <p className="text-slate-500 mb-6">Create a job to start hiring freelancers.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{job.taskTitle || `Job #${job.id}`}</h3>
              <p className="text-sm text-slate-500 mb-2">
                Freelancer: {job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}
              </p>
              <div className="mt-2">
                {job.status >= 2 && (
                  job.submissionLink ? (
                    <a 
                      href={job.submissionLink.startsWith('http') ? job.submissionLink : `https://${job.submissionLink}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline bg-primary/5 px-2 py-1 rounded-md"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      View Work
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-slate-400 bg-slate-50 px-2 py-1 rounded-md italic">
                      No link submitted
                    </span>
                  )
                )}
                {job.status === 1 && progressUpdates[job.id] && (
                  <div className="mt-2 inline-flex flex-col text-sm bg-slate-50 border border-slate-100 rounded-md p-2 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-700">Progress: {progressUpdates[job.id].percent}%</span>
                      <span className="text-xs text-slate-400">
                        updated {Math.max(1, Math.floor((Date.now() / 1000 - progressUpdates[job.id].timestamp) / 60))}m ago
                      </span>
                    </div>
                    {progressUpdates[job.id].note && (
                      <p className="text-slate-600 italic">&quot;{progressUpdates[job.id].note}&quot;</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-lg">${formatUnits(job.amount, 6)} USDC</p>
                </div>
                <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                  {STATUS_MAP[job.status] || "Unknown"}
                </Badge>
              </div>
              
              {job.status === 2 && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDisputeModalJobId(job.id);
                      setDisputeReason("");
                    }} 
                    disabled={processingJobId === job.id}
                  >
                    Raise Dispute
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => handleApprove(job.id)} 
                    disabled={processingJobId === job.id}
                  >
                    Approve & Release
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Modal 
        isOpen={disputeModalJobId !== null} 
        onClose={() => setDisputeModalJobId(null)}
        title="Raise Dispute"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please provide a brief reason for raising this dispute. The arbiter will review this reason along with the submitted work.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="e.g. The submitted work does not meet the requirements..."
            className="w-full min-h-[100px] rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDisputeModalJobId(null)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={submitDispute}
              disabled={disputeReason.trim().length < 5 || processingJobId === disputeModalJobId}
            >
              {processingJobId === disputeModalJobId ? "Submitting..." : "Submit Dispute"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
