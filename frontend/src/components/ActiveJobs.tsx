"use client";

import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { escrowContract, votingDisputeContract as votingContract, CONTRACTS } from "@/lib/config";
import { Badge } from "@/components/ui/Badge";
import { formatUnits } from "viem";
import { Link as LinkIcon, AlertCircle, ArrowUpRight, Clock, Users, ShieldAlert } from "lucide-react";
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

/** Returns true if VotingDispute contract is deployed (non-zero address) */
function isVotingContractDeployed(): boolean {
  const addr = CONTRACTS.VotingDispute;
  return !!addr && addr !== "0x0000000000000000000000000000000000000000";
}

export function ActiveJobs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess?: () => void }) {
  const account = useActiveAccount();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const progressUpdates = useProgressUpdates(refreshCounter);
  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  // Admin dispute modal state
  const [disputeModalJobId, setDisputeModalJobId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  // Voting dispute modal state
  const [votingModalJobId, setVotingModalJobId] = useState<number | null>(null);
  const [votingReason, setVotingReason] = useState("");

  const handleApprove = async (jobId: number) => {
    try {
      setProcessingJobId(jobId);
      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function approveAndRelease(uint256 jobId, string metadataURI)",
        params: [BigInt(jobId), ""],
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

  // ── Admin dispute (existing flow) ────────────────────────────────
  const submitAdminDispute = async () => {
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
      console.error("Failed to raise admin dispute:", err);
      alert("Failed to raise dispute.");
    } finally {
      setProcessingJobId(null);
    }
  };

  // ── Voting dispute (community jury flow) ─────────────────────────
  const submitVotingDispute = async () => {
    if (!votingModalJobId || votingReason.trim().length < 5) return;
    try {
      setProcessingJobId(votingModalJobId);
      const tx = prepareContractCall({
        contract: votingContract,
        method: "function raiseVotingDispute(uint256 jobId, string reason)",
        params: [BigInt(votingModalJobId), votingReason],
      });
      const result = await sendTransaction(tx);
      await waitForReceipt({
        client: thirdwebClient,
        chain: votingContract.chain,
        transactionHash: result.transactionHash,
      });
      if (onInteractionSuccess) onInteractionSuccess();
      setVotingModalJobId(null);
      setVotingReason("");
    } catch (err) {
      console.error("Failed to raise voting dispute:", err);
      alert("Failed to raise voting dispute. Ensure the VotingDispute contract is deployed and has ≥3 registered jurors.");
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

        const activeJobs = allJobs.filter((job) => job.status < 4); // hide Released/Refunded
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
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant text-sm font-medium tracking-wide">Querying on-chain escrow state...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto text-center py-20 surface-card p-12 border-dashed border-glass-border"
      >
        <div className="w-16 h-16 bg-glass-light border border-glass-border rounded-2xl flex items-center justify-center mx-auto mb-6 text-on-surface-variant">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-on-surface mb-2">No active escrow jobs</h2>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">Create a job to start funding verified freelancers through optimistic smart escrow.</p>
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
            <div className="relative surface-card-interactive rounded-2xl p-6 shadow-level-1 hover:shadow-level-2 transition-all duration-300 group overflow-hidden h-full flex flex-col md:flex-row justify-between gap-6">
              {/* Top edge highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] text-on-surface-variant font-mono tracking-widest uppercase bg-glass-light px-2.5 py-0.5 rounded-full border border-glass-border">Job #{job.id}</span>
                  <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                    {STATUS_MAP[job.status] || "Unknown"}
                  </Badge>
                </div>
                <h3 className="font-display font-semibold text-on-surface text-xl mb-2 group-hover:text-accent-light transition-colors">{job.taskTitle || `Job #${job.id}`}</h3>
                <p className="text-sm text-on-surface-variant flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Freelancer: <span className="font-mono text-on-surface">{job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</span>
                </p>
                
                <div>
                  {job.status >= 2 && (
                    job.submissionLink ? (
                      <a 
                        href={job.submissionLink.startsWith('http') ? job.submissionLink : `https://${job.submissionLink}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-accent-light hover:text-white bg-accent/10 hover:bg-accent/20 px-3.5 py-1.5 rounded-xl border border-accent/25 transition-all"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View Work Submission
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-on-surface-variant/50 bg-glass-subtle px-3 py-1.5 rounded-xl border border-glass-border italic">
                        No external link provided
                      </span>
                    )
                  )}

                  {/* 24-hour review window active notice */}
                  {job.status === 2 && (
                    <div className="mt-3 inline-flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-xl">
                      <Clock className="w-3.5 h-3.5" />
                      <span>24-Hour Review Window Active — Auto-claimable if unresponsive</span>
                    </div>
                  )}

                  {job.status === 1 && progressUpdates[job.id] && (
                    <div className="mt-4 inline-flex flex-col text-sm bg-glass-subtle border border-glass-border rounded-xl p-4 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-on-surface flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                          Progress: {progressUpdates[job.id].percent}%
                        </span>
                        <span className="text-[10px] text-on-surface-variant/60 font-mono tracking-wider uppercase">
                          UPDATED {Math.max(1, Math.floor((Date.now() / 1000 - progressUpdates[job.id].timestamp) / 60))}M AGO
                        </span>
                      </div>
                      {progressUpdates[job.id].note && (
                        <p className="text-on-surface-variant italic bg-glass-light p-3 rounded-lg border border-glass-border text-xs">&quot;{progressUpdates[job.id].note}&quot;</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-6 min-w-[220px] relative z-10">
                <div className="text-left md:text-right">
                  <p className="font-bold text-on-surface text-3xl font-mono">${formatUnits(job.amount, 6)} <span className="text-sm text-on-surface-variant font-sans font-medium">USDC</span></p>
                  <p className="text-[11px] text-on-surface-variant/60 mt-1">Escrowed On-Chain</p>
                </div>
                
                {job.status === 2 && (
                  <div className="flex flex-col gap-2.5 w-full">
                    <Button 
                      variant="primary" 
                      onClick={() => handleApprove(job.id)} 
                      disabled={processingJobId === job.id}
                      className="w-full text-xs font-semibold py-2.5 shadow-glow-accent"
                    >
                      {processingJobId === job.id ? "Approving..." : "Approve & Release"}
                    </Button>

                    {/* ── Dispute options ── */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setDisputeModalJobId(job.id);
                          setDisputeReason("");
                        }} 
                        disabled={processingJobId === job.id}
                        className="text-[11px] font-semibold py-2 text-error hover:bg-error/10 border-glass-border hover:border-error/40 flex items-center justify-center gap-1"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        Dispute – Admin
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setVotingModalJobId(job.id);
                          setVotingReason("");
                        }} 
                        disabled={processingJobId === job.id}
                        className="text-[11px] font-semibold py-2 text-amber-400 hover:bg-amber-400/10 border-glass-border hover:border-amber-400/40 flex items-center justify-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        Dispute – Jury
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Admin Dispute Modal (existing arbiter flow) ── */}
      <Modal 
        isOpen={disputeModalJobId !== null} 
        onClose={() => setDisputeModalJobId(null)}
        title="Raise Dispute — Admin"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-error/10 border border-error/20 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-error mt-0.5 shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This dispute will be reviewed by the platform arbiter. Provide a detailed reason — the arbiter will manually split the escrow based on their judgement.
            </p>
          </div>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="e.g. The submitted deliverable does not match the agreed contract requirements..."
            className="glass-input min-h-[120px] text-sm resize-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDisputeModalJobId(null)}>Cancel</Button>
            <Button 
              variant="danger" 
              onClick={submitAdminDispute}
              disabled={disputeReason.trim().length < 5 || processingJobId === disputeModalJobId}
            >
              {processingJobId === disputeModalJobId ? "Submitting..." : "Confirm Admin Dispute"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Voting Dispute Modal (community jury flow) ── */}
      <Modal 
        isOpen={votingModalJobId !== null} 
        onClose={() => setVotingModalJobId(null)}
        title="Raise Dispute — Community Jury"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl">
            <Users className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-on-surface-variant leading-relaxed space-y-1">
              <p className="font-semibold text-amber-400">How community voting works:</p>
              <p>3 jurors (NFT holders) will be randomly assigned. Each independently reviews the submission and votes anonymously.</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong className="text-on-surface">≥ 2/3 votes: project good</strong> → full payment to freelancer</li>
                <li><strong className="text-on-surface">1/3 votes: project good</strong> → 70% to freelancer, 30% refunded</li>
                <li><strong className="text-on-surface">0/3 votes: project good</strong> → full refund + free platform fee on your next job</li>
              </ul>
              <p className="mt-2 text-amber-400/80">Jurors who vote earn a <strong>+Contributor NFT</strong> on their profile.</p>
            </div>
          </div>
          <textarea
            value={votingReason}
            onChange={(e) => setVotingReason(e.target.value)}
            placeholder="e.g. The submitted deliverable does not match the agreed contract requirements..."
            className="glass-input min-h-[120px] text-sm resize-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setVotingModalJobId(null)}>Cancel</Button>
            <Button 
              onClick={submitVotingDispute}
              disabled={votingReason.trim().length < 5 || processingJobId === votingModalJobId}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2 rounded-xl transition-all"
            >
              {processingJobId === votingModalJobId ? "Submitting..." : "Start Community Jury"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
