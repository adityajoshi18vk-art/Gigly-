"use client";

import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { escrowContract } from "@/lib/config";
import { upload } from "thirdweb/storage";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatUnits } from "viem";
import { Link as LinkIcon, ChevronDown, ChevronUp, Eye, Clock } from "lucide-react";
import { DeliverableViewer, toDeliverableStatus } from "@/components/DeliverableViewer";
import { useProgressUpdates } from "@/lib/useProgressUpdates";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { client as thirdwebClient } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";

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
  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  const [disputeModalJobId, setDisputeModalJobId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  const handleApprove = async (job: JobData) => {
    try {
      setProcessingJobId(job.id);

      // Generate SBT Metadata
      let metadataURI = "";
      try {
        const metadata = {
          name: `Completed Gig: ${job.taskTitle || "Job #" + job.id}`,
          description: "Verifiable Proof of Work issued by Gigly Escrow.",
          attributes: [
            { trait_type: "Amount", value: `${formatUnits(job.amount, 6)} USDC` },
            { trait_type: "Client", value: job.client }
          ]
        };

        // Upload to IPFS using Thirdweb Storage
        metadataURI = await upload({
          client: thirdwebClient,
          files: [new File([JSON.stringify(metadata)], "metadata.json", { type: "application/json" })],
        });
      } catch (uploadErr) {
        console.warn("IPFS upload failed, proceeding without credential:", uploadErr);
        // Continue with empty URI — contract skips mint when URI is empty
      }

      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function approveAndRelease(uint256 jobId, string metadataURI)",
        params: [BigInt(job.id), metadataURI],
      });
      const result = await sendTransaction(tx);
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      if (onInteractionSuccess) onInteractionSuccess();
    } catch (err: any) {
      console.error("Failed to approve job:", err);
      const msg = err?.message || "Unknown error";
      if (msg.includes("Reverted") || msg.includes("reverted")) {
        alert(
          "Transaction reverted. This usually means the connected wallet is not the original client for this job. " +
          "The on-chain client address must match your current wallet/smart-account address.\n\n" +
          `Your address: ${account?.address}\nJob client: ${job.client}`
        );
      } else {
        alert("Failed to approve and release funds: " + msg);
      }
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

  const { data: reviewWindowData } = useReadContract({
    contract: escrowContract,
    method: "function REVIEW_WINDOW() view returns (uint256)",
    params: []
  });

  const reviewWindowSeconds = reviewWindowData ? Number(reviewWindowData) : 86400;

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
        const activeJobs = allJobs.filter((job) => job !== null);

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
      <div className="max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full mb-6"
        />
        <p className="text-on-surface-variant font-medium tracking-wide text-sm">Loading your workspace...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto text-center py-20 surface-card p-12 border-dashed border-outline-variant"
      >
        <div className="w-16 h-16 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <h2 className="text-xl font-semibold text-on-surface mb-2">No active jobs</h2>
        <p className="text-on-surface-variant">Create a job to start hiring top-tier freelancers.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <AnimatePresence>
        {jobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 shadow-xl hover:border-primary/50 transition-all duration-300 group overflow-hidden flex flex-col gap-4">
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 pointer-events-none" />
              
              <div className="flex-1 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 font-mono tracking-widest uppercase bg-white/5 px-2 py-1 rounded-md border border-white/10">Job #{job.id}</span>
                    <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                      {STATUS_MAP[job.status] || "Unknown"}
                    </Badge>
                    {job.status === 2 && (
                      <ReviewCountdown 
                        submittedAt={Number(job.submittedAt)} 
                        reviewWindowSeconds={reviewWindowSeconds} 
                      />
                    )}
                  </div>
                  <p className="font-bold text-white text-2xl font-mono">${formatUnits(job.amount, 6)} <span className="text-sm text-white/40 font-medium font-sans">USDC</span></p>
                </div>
                <h3 className="font-bold text-white text-xl mb-2 group-hover:text-primary transition-colors">{job.taskTitle || `Job #${job.id}`}</h3>
                <p className="text-sm text-white/50 flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Freelancer: <span className="font-mono text-white/80">{job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</span>
                </p>
                
                <div>
                  {job.status >= 2 && job.submissionLink && (() => {
                    const isExpanded = expandedJobId === job.id;
                    return (
                      <button
                        onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Review Deliverables
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })()}
                  {job.status >= 2 && !job.submissionLink && (
                    <span className="inline-flex items-center gap-2 text-sm text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 italic">
                      No link submitted
                    </span>
                  )}
                  {job.status === 1 && progressUpdates[job.id] && (
                    <div className="mt-4 inline-flex flex-col text-sm bg-black/20 border border-white/10 rounded-xl p-4 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                          Progress: {progressUpdates[job.id].percent}%
                        </span>
                        <span className="text-xs text-white/40 font-medium tracking-wide">
                          UPDATED {Math.max(1, Math.floor((Date.now() / 1000 - progressUpdates[job.id].timestamp) / 60))}M AGO
                        </span>
                      </div>
                      {progressUpdates[job.id].note && (
                        <p className="text-white/60 italic bg-white/5 p-3 rounded-lg border border-white/5">&quot;{progressUpdates[job.id].note}&quot;</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Expandable deliverable drawer ── */}
              {expandedJobId === job.id && job.submissionLink && (() => {
                const parts = job.submissionLink.split("|");
                const previewUrl = parts[0] || "";
                const rawUrl = parts[1] || "";
                const status = toDeliverableStatus(job.status);
                return (
                  <div className="w-full relative z-10 border-t border-white/10 pt-4 mt-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <DeliverableViewer
                          previewUrl={previewUrl}
                          rawDeliverableUrl={status === "Completed" ? (rawUrl || previewUrl) : undefined}
                          jobStatus={status}
                          jobTitle={job.taskTitle || `Job #${job.id}`}
                        />
                      </div>
                      {job.status === 2 && (
                        <div className="flex flex-col gap-2 lg:w-52 shrink-0">
                          <Button 
                            variant="primary" 
                            onClick={() => handleApprove(job)} 
                            disabled={processingJobId === job.id}
                            className="w-full shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            {processingJobId === job.id ? "Approving..." : "Approve & Release"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setDisputeModalJobId(job.id);
                              setDisputeReason("");
                            }} 
                            disabled={processingJobId === job.id}
                            className="w-full text-error hover:text-error hover:bg-error/10 border-white/10 hover:border-error/30 transition-all"
                          >
                            Raise Dispute
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Modal 
        isOpen={disputeModalJobId !== null} 
        onClose={() => setDisputeModalJobId(null)}
        title="Raise Dispute"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Please provide a detailed reason for raising this dispute. The decentralized arbiter will review this reason along with the submitted work.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="e.g. The submitted work does not meet the technical requirements..."
            className="w-full min-h-[120px] rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDisputeModalJobId(null)}>Cancel</Button>
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

function ReviewCountdown({ 
  submittedAt, 
  reviewWindowSeconds, 
}: { 
  submittedAt: number, 
  reviewWindowSeconds: number,
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Calculate unlock time: submittedAt + REVIEW_WINDOW
    const unlockTime = submittedAt + reviewWindowSeconds;
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = unlockTime - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [submittedAt, reviewWindowSeconds]);

  if (timeLeft === 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-md">
        <Clock className="w-3.5 h-3.5" />
        Time expired
      </span>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  const timeString = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m ${seconds}s`;

  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-md">
      <Clock className="w-3.5 h-3.5" />
      {timeString} left to review
    </span>
  );
}
