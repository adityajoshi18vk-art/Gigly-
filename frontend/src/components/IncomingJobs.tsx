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
import { CheckCircle2, Clock, Link as LinkIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

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

  // Progress modal state
  const [progressModalJobId, setProgressModalJobId] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressNote, setProgressNote] = useState("");

  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

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

  const handleUpdateProgress = async () => {
    if (progressModalJobId === null) return;
    const jobId = progressModalJobId;
    
    try {
      setProcessingJobId(jobId);

      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function logProgress(uint256 jobId, uint8 percent, string note)",
        params: [BigInt(jobId), progressPercent, progressNote.trim()],
      });
      const result = await sendTransaction(tx);
      
      setProgressModalJobId(null);
      setProgressPercent(0);
      setProgressNote("");
      
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      onInteractionSuccess();
    } catch (err) {
      console.error("Failed to log progress:", err);
      setProgressModalJobId(null);
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
      <div className="max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-on-surface-variant font-medium tracking-wide text-sm">Loading your gigs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 surface-card p-12 border-dashed border-outline-variant mt-8">
        <h2 className="text-xl font-semibold text-on-surface mb-2">No incoming tasks</h2>
        <p className="text-on-surface-variant mb-6">Clients will hire you through your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="transition-colors group">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-on-surface-variant font-mono tracking-widest uppercase">Job #{job.id}</span>
                  <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                    {STATUS_MAP[job.status] || "Unknown"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-on-surface text-xl mb-1 group-hover:text-primary transition-colors">{job.taskTitle || `Job #${job.id}`}</h3>
                <p className="text-sm text-on-surface-variant mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Client: <span className="font-mono text-on-surface">{job.client.slice(0, 6)}...{job.client.slice(-4)}</span>
                </p>
                {job.submissionLink && job.status >= 2 && (
                  <a 
                    href={job.submissionLink.startsWith('http') ? job.submissionLink : `https://${job.submissionLink}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    View Work Submission
                  </a>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 min-w-[200px]">
                <div className="text-left md:text-right">
                  <p className="font-bold text-on-surface text-2xl font-mono">${formatUnits(job.amount, 6)} <span className="text-sm text-on-surface-variant font-medium font-sans">USDC</span></p>
                </div>
                
                {/* Status-specific actions */}
                {job.status === 1 && ( // Funded
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setProgressModalJobId(job.id);
                        setProgressPercent(0);
                        setProgressNote("");
                      }}
                      disabled={processingJobId === job.id}
                    >
                      Update Progress
                    </Button>
                    <Button 
                      onClick={() => {
                        setSubmitModalJobId(job.id);
                        setWorkLinkInput("");
                      }}
                      disabled={processingJobId === job.id}
                      variant="primary"
                    >
                      {processingJobId === job.id ? "Processing..." : "Submit work"}
                    </Button>
                  </div>
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
                  <div className="flex items-center gap-2 text-emerald-700 font-medium bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg">
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
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Link to your work (optional)</label>
            <input 
              type="text" 
              placeholder="https://github.com/..." 
              value={workLinkInput}
              onChange={(e) => setWorkLinkInput(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface transition-all shadow-sm"
            />
            <p className="text-xs text-on-surface-variant mt-1">This will be shared with the client so they can review your work.</p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
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
              variant="primary"
            >
              {processingJobId === submitModalJobId ? "Submitting on-chain..." : "Submit Work"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Progress Modal */}
      <Modal 
        isOpen={progressModalJobId !== null} 
        onClose={() => {
          if (!processingJobId) {
            setProgressModalJobId(null);
          }
        }} 
        title="Update Progress"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Completion Percentage: {progressPercent}%</label>
            <input 
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={(e) => setProgressPercent(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Note (optional, max 200 chars)</label>
            <textarea 
              placeholder="What have you completed so far?" 
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface transition-all shadow-sm"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setProgressModalJobId(null)}
              disabled={processingJobId === progressModalJobId}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProgress}
              disabled={processingJobId === progressModalJobId}
              variant="primary"
            >
              {processingJobId === progressModalJobId ? "Logging..." : "Log Progress"}
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
      <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium">
        <Clock className="w-4 h-4" />
        {timeString} left
      </div>
      <Button disabled variant="outline">
        Claim payment
      </Button>
    </div>
  );
}
