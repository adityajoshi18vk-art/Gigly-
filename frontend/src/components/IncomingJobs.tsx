"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { escrowContract, client as thirdwebClient } from "@/lib/config";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import { STATUS_MAP, STATUS_COLORS } from "@/lib/constants";
import { JobData } from "./ActiveJobs";
import { CheckCircle2, Clock, Link as LinkIcon, ArrowUpRight, Check, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function IncomingJobs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess: () => void }) {
  const account = useActiveAccount();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewWindowSeconds, setReviewWindowSeconds] = useState(86400); // Default 24h
  
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
    method: "function reviewWindow() view returns (uint256)",
    params: []
  });

  const formatWindow = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}-hour`;
    return `${minutes}-minute`;
  };
  const windowText = formatWindow(reviewWindowSeconds);

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
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-on-surface-variant text-sm font-medium tracking-wide">Syncing incoming tasks with smart contract...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 surface-card p-12 border-dashed border-glass-border rounded-2xl">
        <h2 className="font-display text-xl font-semibold text-on-surface mb-2">No incoming tasks assigned to you</h2>
        <p className="text-on-surface-variant text-sm max-w-sm mx-auto mb-6">
          Publish your profile or browse open gigs in the marketplace to get hired with escrow protection.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="surface-card-interactive rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group">
          {/* Top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-[11px] text-on-surface-variant font-mono tracking-widest uppercase bg-glass-light px-2.5 py-0.5 rounded-full border border-glass-border">
                  Job #{job.id}
                </span>
                <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                  {STATUS_MAP[job.status] || "Unknown"}
                </Badge>
              </div>
              <h3 className="font-display font-semibold text-on-surface text-xl mb-1 group-hover:text-accent-light transition-colors">
                {job.taskTitle || `Job #${job.id}`}
              </h3>
              <p className="text-xs text-on-surface-variant mb-3 flex items-center gap-1.5 font-mono">
                Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}
              </p>
              
              {job.submissionLink && job.status >= 2 && (
                <a 
                  href={job.submissionLink.startsWith('http') ? job.submissionLink : `https://${job.submissionLink}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent-light hover:text-white bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  View Submission
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 min-w-[220px]">
              <div className="text-left md:text-right">
                <p className="font-bold text-on-surface text-2xl font-mono">
                  ${formatUnits(job.amount, 6)} <span className="text-xs text-on-surface-variant font-sans">USDC</span>
                </p>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">Held in Escrow</p>
              </div>
              
              {/* Status Actions */}
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
                    className="text-xs py-2 px-3"
                  >
                    Log Progress
                  </Button>
                  <Button 
                    onClick={() => {
                      setSubmitModalJobId(job.id);
                      setWorkLinkInput("");
                    }}
                    disabled={processingJobId === job.id}
                    variant="primary"
                    className="text-xs py-2 px-4 shadow-glow-accent"
                  >
                    {processingJobId === job.id ? "Processing..." : "Submit Work"}
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
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-light bg-success/10 border border-success/25 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  Funds Released
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Submit Work Modal */}
      <Modal 
        isOpen={submitModalJobId !== null} 
        onClose={() => {
          if (!processingJobId) {
            setSubmitModalJobId(null);
          }
        }} 
        title="Submit Cryptographic Deliverable"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Deliverable Link / Repository</label>
            <input 
              type="text" 
              placeholder="https://github.com/organization/repo or PR link" 
              value={workLinkInput}
              onChange={(e) => setWorkLinkInput(e.target.value)}
              className="glass-input text-sm"
            />
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Upon submission, an immutable {windowText} review window timer begins. If client approves or remains unresponsive, funds are released to you.
            </p>
          </div>
          
          <div className="flex justify-end gap-2.5 pt-4 border-t border-glass-border">
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
              className="px-5 shadow-glow-accent"
            >
              {processingJobId === submitModalJobId ? "Submitting on-chain..." : "Submit Deliverable"}
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
        title="Log On-Chain Progress"
      >
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-on-surface">Milestone Progress</label>
              <span className="text-sm font-mono font-bold text-accent-light">{progressPercent}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={(e) => setProgressPercent(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Update Note (Stored on contract event)</label>
            <textarea 
              placeholder="What milestone did you complete today?" 
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              maxLength={200}
              className="glass-input text-sm resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2.5 pt-4 border-t border-glass-border">
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
              className="px-5 shadow-glow-accent"
            >
              {processingJobId === progressModalJobId ? "Logging..." : "Emit Progress Event"}
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
    const unlockTime = Number(job.submittedAt) + reviewWindowSeconds;
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = unlockTime - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    updateCountdown();
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
        className="text-xs py-2 px-4 shadow-glow-success bg-gradient-to-r from-success to-success-light"
      >
        {isProcessing ? "Releasing..." : "Claim Escrow Payment"}
      </Button>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  const timeString = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m ${seconds}s`;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-xl text-xs font-mono font-medium">
        <Clock className="w-3.5 h-3.5" />
        {timeString} review window
      </div>
      <Button disabled variant="outline" className="text-xs py-1.5 opacity-50">
        Claim payment
      </Button>
    </div>
  );
}
