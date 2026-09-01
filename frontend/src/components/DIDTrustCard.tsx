"use client";

import { useEffect, useState } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { readContract, getContractEvents, prepareEvent } from "thirdweb";
import { escrowContract, DEPLOYMENT_BLOCK } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Fingerprint,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Scale,
  Hash,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReputationStats {
  verifiedGigs: number;
  disputes: number;
  trustScore: number;
  totalCompleted: number; // Released + Refunded (all terminal jobs)
}

// ─── Prepared event for fetching FundsReleased logs ──────────────────────────

const fundsReleasedEvent = prepareEvent({
  signature:
    "event FundsReleased(uint256 indexed jobId, uint256 netAmount, uint256 fee)",
});

// ─── Component ───────────────────────────────────────────────────────────────

export function DIDTrustCard() {
  const account = useActiveAccount();
  const did = account?.address
    ? `did:ethr:sepolia:${account.address}`
    : "Not Connected";

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [latestProofHash, setLatestProofHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleCopyDID = async () => {
    if (!account?.address) return;
    await navigator.clipboard.writeText(did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Read job count from contract ──────────────────────────────────────
  const { data: jobCountData } = useReadContract({
    contract: escrowContract,
    method: "function jobCount() view returns (uint256)",
    params: [],
  });

  // ── Derive reputation stats from on-chain jobs ────────────────────────
  useEffect(() => {
    async function fetchReputation() {
      if (!account?.address || jobCountData === undefined) {
        setIsLoading(false);
        return;
      }

      const count = Number(jobCountData);
      if (count === 0) {
        setStats({ verifiedGigs: 0, disputes: 0, trustScore: 0, totalCompleted: 0 });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));
        const userAddress = account.address.toLowerCase();

        // Fetch all jobs in parallel
        const allJobs = await Promise.all(
          jobIds.map(async (id) => {
            const data = await readContract({
              contract: escrowContract,
              method:
                "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 releasedAmount, uint256 submittedAt, uint8 status, string taskTitle, string submissionLink)",
              params: [id],
            });
            return {
              id: Number(id),
              freelancer: data[1],
              status: data[5],
            };
          })
        );

        // Filter: jobs where the connected wallet is the freelancer
        const myJobs = allJobs.filter(
          (j) => j.freelancer.toLowerCase() === userAddress
        );

        // Status enum: 0=None, 1=Funded, 2=Submitted, 3=Disputed, 4=Released, 5=Refunded
        const verifiedGigs = myJobs.filter((j) => j.status === 4).length; // Released
        const disputes = myJobs.filter((j) => j.status === 3 || j.status === 5).length; // Disputed or Refunded
        const totalCompleted = verifiedGigs + disputes;

        // Trust score: (verifiedGigs / totalCompleted) * 100, floored
        // If no completed jobs, default to 0
        const trustScore =
          totalCompleted > 0
            ? Math.floor((verifiedGigs / totalCompleted) * 100)
            : 0;

        setStats({ verifiedGigs, disputes, trustScore, totalCompleted });

        // ── Fetch latest FundsReleased event as proof hash ──────────────
        try {
          const events = await getContractEvents({
            contract: escrowContract,
            events: [fundsReleasedEvent],
            fromBlock: DEPLOYMENT_BLOCK,
          });

          // Filter events for jobs belonging to this freelancer
          const myReleasedJobIds = new Set(
            myJobs.filter((j) => j.status === 4).map((j) => j.id)
          );

          const myEvents = events.filter((e) =>
            myReleasedJobIds.has(Number(e.args.jobId))
          );

          if (myEvents.length > 0) {
            // Use the transaction hash of the most recent release event
            const latest = myEvents[myEvents.length - 1];
            setLatestProofHash(latest.transactionHash);
          } else {
            setLatestProofHash(null);
          }
        } catch (eventErr) {
          console.error("Failed to fetch FundsReleased events:", eventErr);
          setLatestProofHash(null);
        }
      } catch (err) {
        console.error("Failed to fetch reputation data:", err);
        setStats({ verifiedGigs: 0, disputes: 0, trustScore: 0, totalCompleted: 0 });
      } finally {
        setIsLoading(false);
      }
    }

    fetchReputation();
  }, [account?.address, jobCountData]);

  // ── Build dynamic VC stats array ──────────────────────────────────────
  const vcStats = [
    {
      label: "Verified Gigs",
      value: isLoading ? null : String(stats?.verifiedGigs ?? 0),
      icon: Award,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Trust Score",
      value: isLoading
        ? null
        : stats && stats.totalCompleted > 0
          ? `${stats.trustScore}/100`
          : "0/100",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Disputes",
      value: isLoading ? null : String(stats?.disputes ?? 0),
      icon: Scale,
      color: "text-slate-500",
      bg: "bg-slate-50",
    },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Fingerprint className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              On-Chain Trust &amp; Reputation
            </h2>
          </div>
          <Badge variant="default" className="flex items-center gap-1 px-2.5 py-1">
            <ShieldCheck className="w-3 h-3" />
            W3C Standard
          </Badge>
        </div>

        {/* ── DID Identifier ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            DID
          </span>
          <code className="flex-1 text-xs font-mono text-slate-700 truncate select-all">
            {did}
          </code>
          <button
            id="did-copy-btn"
            onClick={handleCopyDID}
            disabled={!account?.address}
            className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy DID to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <CardContent className="space-y-4">
        {/* ── VC Stats Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {vcStats.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-1.5 rounded-xl ${stat.bg} border border-slate-100 py-4 px-3`}
            >
              <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className={`text-xl font-bold ${stat.color}`}>
                {stat.value === null ? (
                  <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                ) : (
                  stat.value
                )}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Proof Hash Terminal ──────────────────────────────────────────── */}
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/80" />
              <div className="w-2 h-2 rounded-full bg-amber-500/80" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium">
              Latest VC Proof Hash (Escrow Released)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
            <code className="text-sm font-mono text-emerald-300 tracking-wide break-all">
              {isLoading ? (
                <span className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching on-chain data…
                </span>
              ) : latestProofHash ? (
                latestProofHash
              ) : (
                <span className="text-slate-500 italic">
                  No Escrows Completed Yet
                </span>
              )}
            </code>
          </div>

          <p className="text-[10px] text-slate-500 italic leading-relaxed mt-1">
            Fraud Reduction: Reputation is strictly tied to on-chain escrow
            settlements and cannot be faked.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
