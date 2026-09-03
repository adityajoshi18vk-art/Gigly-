"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { escrowContract, client as thirdwebClient } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import { JobData } from "./ActiveJobs";
import { motion, AnimatePresence } from "framer-motion";

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
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full mb-6"
        />
        <p className="text-on-surface-variant font-medium tracking-wide text-sm">Scanning for open gigs...</p>
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
        <h2 className="text-xl font-semibold text-on-surface mb-2">No open gigs right now</h2>
        <p className="text-on-surface-variant">Check back later. New opportunities arise constantly.</p>
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
            <Card className="hover:border-primary/50 group transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-surface-container border border-outline-variant text-on-surface-variant">Open Gig</span>
                      <span className="text-xs text-on-surface-variant font-mono">#{job.id}</span>
                    </div>
                    <h3 className="font-semibold text-on-surface text-xl mb-2 group-hover:text-primary transition-colors">{job.taskTitle || `Job #${job.id}`}</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-2">
                      <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Client: <span className="font-mono text-on-surface">{job.client.slice(0, 6)}...{job.client.slice(-4)}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1">Bounty</p>
                      <p className="font-bold text-on-surface text-2xl font-mono">${formatUnits(job.amount, 6)} <span className="text-sm text-on-surface-variant font-sans">USDC</span></p>
                    </div>
                    
                    <Button 
                      variant="primary"
                      onClick={() => handleAcceptJob(job.id, job.client)}
                      disabled={processingJobId === job.id}
                      className="w-full md:w-auto"
                    >
                      {processingJobId === job.id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                          Accepting...
                        </span>
                      ) : "Accept Job"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
