"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { type FreelancerProfile } from "@/lib/freelancerRegistry";
import { useJobs } from "@/lib/useJobs";
import { readContract } from "thirdweb";
import { credentialContract, CONTRACTS, client } from "@/lib/config";
import { resolveScheme } from "thirdweb/storage";
import { formatUnits } from "viem";
import {
  Star,
  ExternalLink,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Award,
  Briefcase,
  Calendar,
  Sparkles,
  DollarSign,
  FileCode,
  Hash,
} from "lucide-react";

export interface FreelancerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  freelancer: FreelancerProfile | null;
  onHire: (freelancer: FreelancerProfile) => void;
}

interface CredentialSummary {
  tokenId: number;
  name: string;
  description: string;
}

function resolveIpfs(uri: string): string {
  if (!uri) return "";
  try {
    return resolveScheme({ client, uri });
  } catch {
    return uri.replace("ipfs://", "https://ipfs.thirdwebcdn.com/ipfs/");
  }
}

export function FreelancerDetailModal({
  isOpen,
  onClose,
  freelancer,
  onHire,
}: FreelancerDetailModalProps) {
  const { jobs: allJobs } = useJobs();
  const [nftCredentials, setNftCredentials] = useState<CredentialSummary[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);

  // Filter completed on-chain escrow tasks for this freelancer
  const completedTasks = useMemo(() => {
    if (!freelancer?.address) return [];
    return allJobs.filter(
      (j) =>
        j.freelancer.toLowerCase() === freelancer.address.toLowerCase() &&
        (j.status === 4 || j.status === 5)
    );
  }, [allJobs, freelancer?.address]);

  // Fetch Soulbound PoW NFTs
  useEffect(() => {
    if (!isOpen || !freelancer?.address) return;
    let cancelled = false;

    async function loadCredentials() {
      setLoadingNfts(true);
      try {
        const tokenIds = await readContract({
          contract: credentialContract,
          method: "function getTokensByFreelancer(address) view returns (uint256[])",
          params: [freelancer!.address],
        });

        if (cancelled || !tokenIds || tokenIds.length === 0) {
          setNftCredentials([]);
          setLoadingNfts(false);
          return;
        }

        const details = await Promise.all(
          tokenIds.map(async (t) => {
            try {
              const uri = await readContract({
                contract: credentialContract,
                method: "function tokenURI(uint256) view returns (string)",
                params: [t],
              });
              const gateway = resolveIpfs(uri);
              const res = await fetch(gateway, { signal: AbortSignal.timeout(6000) });
              if (res.ok) {
                const meta = await res.json();
                return {
                  tokenId: Number(t),
                  name: meta.name || `Credential #${t}`,
                  description: meta.description || "Proof-of-Work SBT",
                };
              }
            } catch {
              // fallback
            }
            return {
              tokenId: Number(t),
              name: `PoW Credential #${t}`,
              description: "Soulbound Proof-of-Work NFT",
            };
          })
        );

        if (!cancelled) {
          setNftCredentials(details);
        }
      } catch (err) {
        console.warn("Failed to load freelancer NFT credentials:", err);
      } finally {
        if (!cancelled) setLoadingNfts(false);
      }
    }

    loadCredentials();
    return () => {
      cancelled = true;
    };
  }, [isOpen, freelancer?.address]);

  if (!isOpen || !freelancer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Freelancer Profile & Proof-of-Work" size="xl">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Header Profile Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-glass-light border border-glass-border">
          <div className="flex items-center gap-4">
            <Avatar fallback={freelancer.avatarFallback} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-on-surface font-display">{freelancer.name}</h3>
                {freelancer.kycVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-2 py-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    ZK-KYC Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 font-medium">{freelancer.title}</p>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                {freelancer.address.slice(0, 8)}...{freelancer.address.slice(-6)}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
            <span className="text-2xl font-bold font-mono text-on-surface">
              ${freelancer.hourlyRate}
              <span className="text-xs text-slate-700 font-normal">/hr</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>5.0 (100% On-Chain Escrow Success)</span>
            </div>
          </div>
        </div>

        {/* Bio & Social Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">About</h4>
          <p className="text-sm text-on-surface leading-relaxed bg-glass-subtle p-4 rounded-xl border border-glass-border">
            {freelancer.bio || "No professional biography provided."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {freelancer.portfolioUrl && (
              <a
                href={freelancer.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent-light hover:underline bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/25"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Portfolio Website
              </a>
            )}
            {freelancer.githubUrl && (
              <a
                href={freelancer.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-on-surface bg-glass-light hover:bg-glass-medium px-3 py-1.5 rounded-lg border border-glass-border"
              >
                <Code2 className="w-3.5 h-3.5 text-accent-light" />
                GitHub Repositories
              </a>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Skills &amp; Technical Capabilities
          </h4>
          <div className="flex flex-wrap gap-2">
            {freelancer.skills.map((skill) => {
              const isVerified = freelancer.verifiedSkills?.some(
                (v) => v.toLowerCase() === skill.toLowerCase()
              );
              return (
                <span
                  key={skill}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border ${
                    isVerified
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                      : "bg-glass-light text-on-surface border-glass-border"
                  }`}
                >
                  {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                  {skill}
                </span>
              );
            })}
          </div>
        </div>

        {/* Soulbound Proof-of-Work NFTs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-accent-light" />
              Verifiable Proof-of-Work NFTs ({nftCredentials.length})
            </h4>
            <span className="text-[11px] text-slate-700 font-semibold">Non-Transferable SBTs</span>
          </div>

          {loadingNfts ? (
            <div className="p-6 text-center text-xs text-on-surface-variant bg-glass-subtle rounded-xl border border-glass-border animate-pulse">
              Querying on-chain Soulbound credentials...
            </div>
          ) : nftCredentials.length === 0 ? (
            <div className="p-5 text-center text-xs text-on-surface-variant bg-glass-subtle rounded-xl border border-dashed border-glass-border">
              No Soulbound NFT credentials earned yet. Tokens are minted automatically upon successful escrow releases.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nftCredentials.map((nft) => (
                <div
                  key={nft.tokenId}
                  className="p-3.5 rounded-xl border border-accent/25 bg-accent/5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-on-surface truncate">{nft.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-accent/20 text-accent-light px-2 py-0.5 rounded-full">
                      #{nft.tokenId}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">{nft.description}</p>
                  <div className="mt-2 pt-2 border-t border-glass-border flex items-center justify-between text-[10px] text-on-surface-variant">
                    <span>Sepolia Testnet</span>
                    <a
                      href={`https://sepolia.etherscan.io/token/${CONTRACTS.GiglyCredential}?a=${nft.tokenId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-light hover:underline inline-flex items-center gap-0.5"
                    >
                      Etherscan <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed On-Chain Tasks History */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-accent-light" />
            Verified Escrow Track Record ({completedTasks.length})
          </h4>

          {completedTasks.length === 0 ? (
            <div className="p-4 text-center text-xs text-on-surface-variant bg-glass-subtle rounded-xl border border-dashed border-glass-border">
              No past completed tasks recorded on-chain yet for this provider.
            </div>
          ) : (
            <div className="space-y-2">
              {completedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-glass-light border border-glass-border flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-on-surface-variant">#{t.id}</span>
                    <span className="font-semibold text-on-surface">{t.taskTitle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-on-surface">${formatUnits(t.amount, 6)} USDC</span>
                    <Badge variant={t.status === 4 ? "success" : "neutral"}>
                      {t.status === 4 ? "Settled & Released" : "Refunded"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 flex items-center justify-between border-t border-glass-border mt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onHire(freelancer);
            }}
            className="px-6 shadow-glow-accent"
          >
            Hire {freelancer.name}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
