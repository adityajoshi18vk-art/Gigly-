"use client";

import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { escrowContract } from "@/lib/config";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock } from "lucide-react";

interface CredentialData {
  jobId: number;
  taskTitle: string;
  amount: bigint;
  releasedAmount: bigint;
  client: string;
  submittedAt: bigint;
}

function SkeletonCard() {
  return (
    <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 shadow-xl overflow-hidden h-full flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-white/10 rounded-md" />
        <div className="h-4 w-16 bg-white/5 rounded-md" />
      </div>
      <div className="mt-2 space-y-3">
        <div className="h-6 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-2/3 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
        <div className="h-16 bg-white/5 rounded-lg" />
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

export function Credentials() {
  const account = useActiveAccount();
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: jobCountData } = useReadContract({
    contract: escrowContract,
    method: "function jobCount() view returns (uint256)",
    params: [],
  });

  useEffect(() => {
    async function fetchCredentials() {
      if (!account?.address || jobCountData === undefined) {
        if (jobCountData === undefined) return; // still loading
        setCredentials([]);
        setLoading(false);
        return;
      }

      const count = Number(jobCountData);
      if (count === 0) {
        setCredentials([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userAddress = account.address.toLowerCase();
        const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));

        const allJobs = await Promise.all(
          jobIds.map(async (id) => {
            try {
              const data = await readContract({
                contract: escrowContract,
                method:
                  "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 releasedAmount, uint256 submittedAt, uint8 status, string taskTitle, string submissionLink)",
                params: [id],
              });
              return {
                jobId: Number(id),
                client: data[0],
                freelancer: data[1],
                amount: data[2],
                releasedAmount: data[3],
                submittedAt: data[4],
                status: data[5],
                taskTitle: data[6],
              };
            } catch {
              return null;
            }
          })
        );

        // Filter: freelancer's released jobs (status 4 = Released)
        const released = allJobs
          .filter(
            (j) =>
              j !== null &&
              j.freelancer.toLowerCase() === userAddress &&
              j.status === 4
          )
          .map((j) => ({
            jobId: j!.jobId,
            taskTitle: j!.taskTitle,
            amount: j!.amount,
            releasedAmount: j!.releasedAmount,
            client: j!.client,
            submittedAt: j!.submittedAt,
          }));

        setCredentials(released.sort((a, b) => b.jobId - a.jobId));
      } catch (error) {
        console.error("Failed to fetch credentials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCredentials();
  }, [account, jobCountData]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto text-center py-20 bg-[#0f172a]/50 p-12 border border-white/10 rounded-[1.5rem]"
      >
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white/40" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          No On-Chain Credentials Yet
        </h2>
        <p className="text-white/50 max-w-md mx-auto">
          Complete a gig and have the client release escrow to mint your first
          Soulbound Proof-of-Work NFT.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence>
        {credentials.map((cred, index) => {
          const completedDate = cred.submittedAt > 0n
            ? new Date(Number(cred.submittedAt) * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—";

          return (
            <motion.div
              key={cred.jobId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 shadow-xl hover:border-primary/30 transition-all duration-300 group overflow-hidden h-full flex flex-col gap-4">
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 pointer-events-none" />

                <div className="flex items-center justify-between z-10">
                  <span className="text-xs text-primary font-mono tracking-widest uppercase bg-primary/10 px-2 py-1 rounded-md border border-primary/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Soulbound 🔒
                  </span>
                  <span className="text-white/30 text-xs font-mono">
                    Job #{cred.jobId}
                  </span>
                </div>

                <div className="z-10 mt-2">
                  <h3 className="font-bold text-white text-xl mb-1">
                    {cred.taskTitle || `Completed Gig #${cred.jobId}`}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-4">
                    Verifiable Proof of Work — Escrow Released
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Amount
                      </p>
                      <p className="text-white font-mono text-sm">
                        ${formatUnits(cred.releasedAmount, 6)} USDC
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Completed
                      </p>
                      <p className="text-white font-mono text-sm">
                        {completedDate}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5 col-span-2">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Client
                      </p>
                      <p className="text-white font-mono text-sm break-all">
                        {cred.client}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
