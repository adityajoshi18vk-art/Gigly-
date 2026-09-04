"use client";

import { useMemo } from "react";
import { useJobs } from "@/lib/useJobs";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ExternalLink, Clock } from "lucide-react";

export function PublicGigs({ refreshCounter }: { refreshCounter: number }) {
  const { jobs: allJobs, loading } = useJobs(refreshCounter);

  const jobs = useMemo(() => {
    return allJobs
      .filter(
        (job) =>
          job.freelancer === "0x0000000000000000000000000000000000000000" &&
          job.status === 1
      )
      .sort((a, b) => b.id - a.id);
  }, [allJobs]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium tracking-wide text-sm">Scanning open bounties...</p>
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
        <h2 className="font-display text-xl font-semibold text-on-surface mb-2">No open public gigs right now</h2>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
          Clients post open bounties regularly. Check back soon or browse freelancers to hire directly.
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
                    Client:{" "}
                    <a
                      href={`https://sepolia.etherscan.io/address/${job.client}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-accent-light transition-colors inline-flex items-center gap-1"
                    >
                      {job.client.slice(0, 6)}...{job.client.slice(-4)}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-3.5 min-w-[200px]">
                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-slate-700 uppercase tracking-wider font-mono font-bold">Funded Bounty</p>
                    <p className="font-bold text-on-surface text-2xl font-mono">
                      ${formatUnits(job.amount, 6)}{" "}
                      <span className="text-xs text-slate-700 font-sans font-bold">USDC</span>
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant bg-glass-light border border-glass-border px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-accent-light" />
                    Awaiting Freelancer
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
