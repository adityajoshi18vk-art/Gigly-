"use client";

import { useMemo, useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useJobs } from "@/lib/useJobs";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/Badge";
import { STATUS_MAP, STATUS_COLORS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, RotateCcw } from "lucide-react";
import { getRegisteredFreelancers, type FreelancerProfile } from "@/lib/freelancerRegistry";

export function PastJobs({ role, refreshCounter }: { role: "client" | "freelancer"; refreshCounter: number }) {
  const account = useActiveAccount();
  const { jobs: allJobs, loading } = useJobs(refreshCounter);
  const [freelancerNames, setFreelancerNames] = useState<Map<string, string>>(new Map());

  const jobs = useMemo(() => {
    if (!account?.address) return [];
    return allJobs
      .filter((job) => {
        const isOwner =
          role === "client"
            ? job.client.toLowerCase() === account.address.toLowerCase()
            : job.freelancer.toLowerCase() === account.address.toLowerCase();
        return isOwner && (job.status === 4 || job.status === 5);
      })
      .sort((a, b) => b.id - a.id);
  }, [allJobs, account?.address, role]);

  // Resolve freelancer names for client view
  useEffect(() => {
    if (role !== "client" || jobs.length === 0) return;
    let cancelled = false;
    getRegisteredFreelancers().then((profiles) => {
      if (cancelled) return;
      const map = new Map<string, string>();
      profiles.forEach((p) => map.set(p.address.toLowerCase(), p.name));
      setFreelancerNames(map);
    });
    return () => { cancelled = true; };
  }, [jobs, role]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant text-sm font-medium tracking-wide">Loading past jobs...</p>
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
        <div className="w-16 h-16 bg-glass-light border border-glass-border rounded-2xl flex items-center justify-center mx-auto mb-6 text-on-surface-variant">
          {role === "client" ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <RotateCcw className="w-8 h-8" />
          )}
        </div>
        <h2 className="font-display text-xl font-semibold text-on-surface mb-2">No completed jobs yet</h2>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
          {role === "client"
            ? "Jobs will appear here once escrow funds are released or refunded."
            : "Completed and settled gigs will show up here."}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <AnimatePresence>
        {jobs.map((job, index) => {
          const counterpartyAddr = role === "client" ? job.freelancer : job.client;
          const counterpartyLabel = role === "client" ? "Freelancer" : "Client";
          const displayName =
            role === "client"
              ? freelancerNames.get(job.freelancer.toLowerCase()) ||
                `${job.freelancer.slice(0, 6)}...${job.freelancer.slice(-4)}`
              : `${job.client.slice(0, 6)}...${job.client.slice(-4)}`;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="relative surface-card-interactive rounded-2xl p-6 shadow-level-1 transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] text-on-surface-variant font-mono tracking-widest uppercase bg-glass-light px-2.5 py-0.5 rounded-full border border-glass-border">
                        Job #{job.id}
                      </span>
                      <Badge variant={STATUS_COLORS[job.status] || "neutral"}>
                        {STATUS_MAP[job.status] || "Unknown"}
                      </Badge>
                    </div>
                    <h3 className="font-display font-semibold text-on-surface text-xl mb-2">
                      {job.taskTitle || `Job #${job.id}`}
                    </h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-2">
                      <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {counterpartyLabel}:{" "}
                      <a
                        href={`https://sepolia.etherscan.io/address/${counterpartyAddr}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-on-surface hover:text-accent-light transition-colors inline-flex items-center gap-1"
                      >
                        {displayName}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </p>

                    {job.submissionLink && (
                      <a
                        href={job.submissionLink.startsWith("http") ? job.submissionLink : `https://${job.submissionLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-accent-light hover:text-white bg-accent/10 hover:bg-accent/20 px-3.5 py-1.5 rounded-xl border border-accent/25 transition-all"
                      >
                        View Submission
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-4 min-w-[180px] relative z-10">
                    <div className="text-left md:text-right">
                      <p className="font-bold text-on-surface text-3xl font-mono">
                        ${formatUnits(job.amount, 6)}{" "}
                        <span className="text-sm text-on-surface-variant font-sans font-medium">USDC</span>
                      </p>
                      <p className="text-[11px] text-on-surface-variant/60 mt-1">
                        {job.status === 4 ? "Released from Escrow" : "Refunded to Client"}
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
