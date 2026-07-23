"use client";

import { useEffect, useState } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { escrowContract, client as thirdwebClient } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatUnits } from "viem";
import { JobData } from "./ActiveJobs";

export function BrowseGigs({ refreshCounter, onInteractionSuccess }: { refreshCounter: number, onInteractionSuccess: () => void }) {
  const account = useActiveAccount();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingJobId, setProcessingJobId] = useState<number | null>(null);

  const { mutateAsync: sendTransaction } = useSendTransaction();

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
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Finding open gigs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No open gigs available right now</h2>
        <p className="text-slate-500 mb-6">Check back later for new opportunities.</p>
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
                <h3 className="font-semibold text-slate-900 text-lg mb-1">{job.taskTitle || `Job #${job.id}`}</h3>
                <p className="text-sm text-slate-500">
                  Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-lg">${formatUnits(job.amount, 6)} USDC</p>
                </div>
                
                <Button 
                  onClick={() => handleAcceptJob(job.id, job.client)}
                  disabled={processingJobId === job.id}
                >
                  {processingJobId === job.id ? "Accepting..." : "Accept Job"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
