"use client";

import { useState, useMemo } from "react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { escrowContract, client as thirdwebClient } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import { JobData } from "./ActiveJobs";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useJobs, clearJobsCache } from "@/lib/useJobs";

export function BrowseGigs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess: () => void }) {
  const account = useActiveAccount();
  const { jobs: allJobs, loading } = useJobs(refreshCounter);
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  const jobs = useMemo(() => {
    return allJobs
      .filter((job) => job.freelancer === "0x0000000000000000000000000000000000000000" && job.status === 1)
      .sort((a, b) => b.id - a.id);
  }, [allJobs]);

  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

  const handleAcceptJob = async (jobId: number, jobClient: string) => {
    if (!account) return;
    
    if (account.address.toLowerCase() === jobClient.toLowerCase()) {
      alert("You cannot accept a job you posted yourself.");
      return;
    }

    try {
      setProcessingJobId(jobId);
      const tx = prepareContractCall({
        contract: escrowContract,
        method: "function acceptJob(uint256 jobId)",
        params: [BigInt(jobId)],
      });
      
      const result = await sendTransaction(tx);
      
      await waitForReceipt({
        client: thirdwebClient,
        chain: escrowContract.chain,
        transactionHash: result.transactionHash,
      });
      
      clearJobsCache();
      onInteractionSuccess();
    } catch (err) {
      console.error("Failed to accept job:", err);
      alert("Failed to accept job. It might have already been taken.");
    } finally {
      setProcessingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium tracking-wide text-sm">Scanning Ethereum Sepolia for open escrow bounties...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto text-center py-20 surface-card p-12 border-dashed border-glass-border rounded-2xl"
      >
        <div className="w-14 h-14 bg-glass-light border border-glass-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
          <Sparkles className="w-6 h-6 text-accent-light" />
        </div>
        <h2 className="font-display text-xl font-semibold text-on-surface mb-2">No open gigs available right now</h2>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
          Clients post open escrow jobs regularly. Check back soon or share your profile link to get hired directly.
        </p>
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
            <div className="surface-card-interactive rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group">
              {/* Top accent highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-accent/15 border border-accent/30 text-accent-light tracking-wide uppercase">
                      Open Escrow Gig
                    </span>
                    <span className="text-xs text-slate-700 font-mono font-bold">#{job.id}</span>
                  </div>
                  <h3 className="font-display font-semibold text-on-surface text-xl mb-2 group-hover:text-accent-light transition-colors">
                    {job.taskTitle || `Job #${job.id}`}
                  </h3>
                  <p className="text-xs text-slate-700 flex items-center gap-1.5 font-mono font-medium">
                    Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}
                  </p>
                </div>
                
                <div className="flex flex-col md:items-end gap-3.5 min-w-[200px]">
                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-slate-700 uppercase tracking-wider font-mono font-bold">Funded Bounty</p>
                    <p className="font-bold text-on-surface text-2xl font-mono">
                      ${formatUnits(job.amount, 6)} <span className="text-xs text-slate-700 font-sans font-bold">USDC</span>
                    </p>
                  </div>
                  
                  <Button 
                    variant="primary"
                    onClick={() => handleAcceptJob(job.id, job.client)}
                    disabled={processingJobId === job.id}
                    className="w-full md:w-auto text-xs py-2 px-5 shadow-glow-accent group/btn flex items-center gap-1.5"
                  >
                    {processingJobId === job.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Locking assignment...
                      </span>
                    ) : (
                      <>
                        Accept Gig
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
