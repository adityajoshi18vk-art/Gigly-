"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { escrowContract, client as thirdwebClient } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import { JobData } from "./ActiveJobs";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export function BrowseGigs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess: () => void }) {
  const account = useActiveAccount();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

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

        // Filter for open jobs (zero address) and status Funded (1)
        const openJobs = allJobs.filter(
          (job) => job.freelancer === "0x0000000000000000000000000000000000000000" && job.status === 1
        );
        
        setJobs(openJobs.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Failed to fetch open jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [account, jobCountData, refreshCounter]);

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
                    <span className="text-xs text-on-surface-variant font-mono">#{job.id}</span>
                  </div>
                  <h3 className="font-display font-semibold text-on-surface text-xl mb-2 group-hover:text-accent-light transition-colors">
                    {job.taskTitle || `Job #${job.id}`}
                  </h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-mono">
                    Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}
                  </p>
                </div>
                
                <div className="flex flex-col md:items-end gap-3.5 min-w-[200px]">
                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider font-mono">Funded Bounty</p>
                    <p className="font-bold text-on-surface text-2xl font-mono">
                      ${formatUnits(job.amount, 6)} <span className="text-xs text-on-surface-variant font-sans">USDC</span>
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
