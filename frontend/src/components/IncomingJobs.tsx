"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { escrowContract, client as thirdwebClient } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import { STATUS_MAP, STATUS_COLORS } from "@/lib/constants";
import { JobData } from "./ActiveJobs";
import { AlertCircle, CheckCircle2, Clock, Link as LinkIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useSubmissionLinks } from "@/lib/useSubmissionLinks";

export function IncomingJobs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess: () => void }) {
  const account = useActiveAccount();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewWindowSeconds, setReviewWindowSeconds] = useState(86400); // Default 24h
  
  // Track currently processing transactions
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  // Submit modal state
  const [submitModalJobId, setSubmitModalJobId] = useState<number | null>(null);
  const [workLinkInput, setWorkLinkInput] = useState("");
  
  // Work links state (on-chain via events)
  const workLinks = useSubmissionLinks(refreshCounter);

  const { mutateAsync: sendTransaction } = useSendTransaction();

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

  useEffect(() => {
    if (reviewWindowData !== undefined) {
      setReviewWindowSeconds(Number(reviewWindowData));
    }
  }, [reviewWindowData]);

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
        const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));
        
        const allJobs = await Promise.all(
          jobIds.map(async (id) => {
            const data = await readContract({
              contract: escrowContract,
              method: "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 releasedAmount, uint256 submittedAt, uint8 status, string taskTitle)",
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
              taskTitle: data[6]
            } as JobData;
          })
        );

        // Filter jobs belonging to the connected freelancer
        const freelancerJobs = allJobs.filter(
          (job) => job.freelancer.toLowerCase() === account.address.toLowerCase()
        );
        
        setJobs(freelancerJobs.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [account, jobCountData, refreshCounter]);

  const handleSubmitWork = async () => {
    if (submitModalJobId === null) return;
    const jobId = submitModalJobId;
    
    try {
      setProcessingJobId(jobId);

      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function submitWork(uint256 jobId, string submissionLink)",
        params: [BigInt(jobId), workLinkInput.trim()],
      });
      const result = await sendTransaction(tx);
      
      // Close modal while waiting
      setSubmitModalJobId(null);
      setWorkLinkInput("");
      
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      onInteractionSuccess();
    } catch (err) {
      console.error("Failed to submit work:", err);
      // Ensure modal is closed on failure too so it doesn't hang
      setSubmitModalJobId(null);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleClaimPayment = async (jobId: number) => {
    try {
      setProcessingJobId(jobId);
      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function claimAfterWindow(uint256 jobId)",
        params: [BigInt(jobId)],
      });
      const result = await sendTransaction(tx);
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      onInteractionSuccess();
    } catch (err) {
      console.error("Failed to claim payment:", err);
    } finally {
      setProcessingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Loading your gigs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No incoming tasks</h2>
        <p className="text-slate-500 mb-6">Clients will hire you through your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-900 text-lg">{job.taskTitle || `Job #${job.id}`}</h3>
                  <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                    {STATUS_MAP[job.status] || "Unknown"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}
                </p>
                {workLinks[job.id] && job.status >= 2 && (
                  <a 
                    href={workLinks[job.id].startsWith('http') ? workLinks[job.id] : `https://${workLinks[job.id]}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline bg-primary/5 px-2 py-1 rounded-md"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    View Work
                  </a>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-lg">${formatUnits(job.amount, 6)} USDC</p>
                </div>
                
                {/* Status-specific actions */}
                {job.status === 1 && ( // Funded
                  <Button 
                    onClick={() => {
                      setSubmitModalJobId(job.id);
                      setWorkLinkInput("");
                    }}
                    disabled={processingJobId === job.id}
                  >
                    {processingJobId === job.id ? "Submitting..." : "Submit work"}
                  </Button>
                )}
                
                {job.status === 2 && ( // Submitted
                  <CountdownAction 
                    job={job}
                    reviewWindowSeconds={reviewWindowSeconds}
                    onClaim={() => handleClaimPayment(job.id)}
                    isProcessing={processingJobId === job.id}
                  />
                )}
                
                {job.status === 4 && ( // Released
                  <div className="flex items-center gap-2 text-status-success font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    Paid
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Submit Work Modal */}
      <Modal 
        isOpen={submitModalJobId !== null} 
        onClose={() => {
          if (!processingJobId) {
            setSubmitModalJobId(null);
          }
        }} 
        title="Submit your work"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link to your work (optional)</label>
            <input 
              type="text" 
              placeholder="https://github.com/..." 
              value={workLinkInput}
              onChange={(e) => setWorkLinkInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">This will be shared with the client so they can review your work.</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={() => setSubmitModalJobId(null)}
              disabled={processingJobId === submitModalJobId}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitWork}
              disabled={processingJobId === submitModalJobId}
            >
              {processingJobId === submitModalJobId ? "Submitting on-chain..." : "Submit Work"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CountdownAction({ 
  job, 
  reviewWindowSeconds, 
  onClaim, 
  isProcessing 
}: { 
  job: JobData, 
  reviewWindowSeconds: number,
  onClaim: () => void,
  isProcessing: boolean
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Calculate unlock time: submittedAt + REVIEW_WINDOW
    const unlockTime = Number(job.submittedAt) + reviewWindowSeconds;
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = unlockTime - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    // Initial run
    updateCountdown();

    // Set up interval
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [job.submittedAt, reviewWindowSeconds]);

  const canClaim = timeLeft === 0;

  if (canClaim) {
    return (
      <Button 
        onClick={onClaim}
        disabled={isProcessing}
        variant="primary"
      >
        {isProcessing ? "Claiming..." : "Claim payment"}
      </Button>
    );
  }

  // Format time remaining
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  const timeString = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m ${seconds}s`;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium">
        <Clock className="w-4 h-4" />
        {timeString} left
      </div>
      <Button disabled variant="outline">
        Claim payment
      </Button>
    </div>
  );
}
