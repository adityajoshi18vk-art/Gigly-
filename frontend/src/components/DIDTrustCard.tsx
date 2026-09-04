"use client";

import { useEffect, useState } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { readContract, getContractEvents, prepareEvent } from "thirdweb";
import { escrowContract, DEPLOYMENT_BLOCK } from "@/lib/config";
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

interface ReputationStats {
  verifiedGigs: number;
  disputes: number;
  trustScore: number;
  totalCompleted: number;
}

const fundsReleasedEvent = prepareEvent({
  signature:
    "event FundsReleased(uint256 indexed jobId, uint256 netAmount, uint256 fee)",
});

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

  const { data: jobCountData } = useReadContract({
    contract: escrowContract,
    method: "function jobCount() view returns (uint256)",
    params: [],
  });

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

        const myJobs = allJobs.filter(
          (j) => j.freelancer.toLowerCase() === userAddress
        );

        const verifiedGigs = myJobs.filter((j) => j.status === 4).length;
        const disputes = myJobs.filter((j) => j.status === 3 || j.status === 5).length;
        const totalCompleted = verifiedGigs + disputes;

        const trustScore =
          totalCompleted > 0
            ? Math.floor((verifiedGigs / totalCompleted) * 100)
            : 0;

        setStats({ verifiedGigs, disputes, trustScore, totalCompleted });

        try {
          const events = await getContractEvents({
            contract: escrowContract,
            events: [fundsReleasedEvent],
            fromBlock: DEPLOYMENT_BLOCK,
          });

          const myReleasedJobIds = new Set(
            myJobs.filter((j) => j.status === 4).map((j) => j.id)
          );

          const myEvents = events.filter((e) =>
            myReleasedJobIds.has(Number(e.args.jobId))
          );

          if (myEvents.length > 0) {
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

  const vcStats = [
    {
      label: "Verified Escrow Gigs",
      value: isLoading ? null : String(stats?.verifiedGigs ?? 0),
      icon: Award,
      color: "text-accent-light",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      label: "On-Chain Trust Score",
      value: isLoading
        ? null
        : stats && stats.totalCompleted > 0
          ? `${stats.trustScore}/100`
          : "0/100",
      icon: ShieldCheck,
      color: "text-success-light",
      bg: "bg-success/10 border-success/20",
    },
    {
      label: "Disputes Raised",
      value: isLoading ? null : String(stats?.disputes ?? 0),
      icon: Scale,
      color: "text-on-surface-variant",
      bg: "bg-glass-light border-glass-border",
    },
  ];

  return (
    <div className="surface-card rounded-2xl p-6 relative overflow-hidden shadow-level-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white shadow-glow-accent">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-on-surface">
              On-Chain Trust &amp; Reputation
            </h2>
            <p className="text-xs text-on-surface-variant">Cryptographically verifiable credentials</p>
          </div>
        </div>
        <Badge variant="default" className="flex items-center gap-1 px-3 py-1">
          <ShieldCheck className="w-3.5 h-3.5 text-success-light" />
          W3C Standard
        </Badge>
      </div>

      {/* DID Identifier */}
      <div className="flex items-center gap-2 rounded-xl border border-glass-border bg-glass-subtle px-3.5 py-2.5 mb-5">
        <span className="text-[10px] font-semibold text-accent-light uppercase tracking-wider shrink-0 font-mono">
          DID URI
        </span>
        <code className="flex-1 text-xs font-mono text-on-surface truncate select-all">
          {did}
        </code>
        <button
          id="did-copy-btn"
          onClick={handleCopyDID}
          disabled={!account?.address}
          className="shrink-0 p-1.5 rounded-lg hover:bg-glass-medium text-on-surface-variant hover:text-white transition-colors disabled:opacity-30"
          title="Copy DID to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success-light" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* VC Stats Grid */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {vcStats.map((stat) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-1.5 rounded-xl border py-4 px-3 ${stat.bg}`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className={`font-display text-xl font-bold ${stat.color}`}>
              {stat.value === null ? (
                <Loader2 className="w-5 h-5 animate-spin opacity-50" />
              ) : (
                stat.value
              )}
            </span>
            <span className="text-[11px] font-medium text-on-surface-variant text-center">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Proof Hash Terminal */}
      <div className="rounded-xl bg-surface-container-lowest border border-glass-border p-4 space-y-2">
        <div className="flex items-center gap-2 text-on-surface-variant mb-1">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-error/70" />
            <div className="w-2 h-2 rounded-full bg-warning/70" />
            <div className="w-2 h-2 rounded-full bg-success/70" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider">
            Latest FundsReleased On-Chain Event Proof
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-accent-light shrink-0" />
          <code className="text-xs font-mono text-accent-light tracking-wide break-all">
            {isLoading ? (
              <span className="flex items-center gap-2 text-on-surface-variant">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Querying deployment logs…
              </span>
            ) : latestProofHash ? (
              latestProofHash
            ) : (
              <span className="text-on-surface-variant/50 italic">
                No Escrow Releases Completed Yet
              </span>
            )}
          </code>
        </div>

        <p className="text-[10px] text-on-surface-variant/60 italic leading-relaxed mt-1">
          Fraud Prevention: Reputation is mathematically derived from on-chain escrow settlements and cannot be forged.
        </p>
      </div>
    </div>
  );
}
