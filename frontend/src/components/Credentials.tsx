"use client";

import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { credentialContract, legacyCredentialContract } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Award } from "lucide-react";
import { ThirdwebContract } from "thirdweb";

interface CredentialMetadata {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

interface CredentialData {
  tokenId: number;
  uri: string;
  metadata: CredentialMetadata | null;
  isContributor: boolean;
  contractLabel: "new" | "legacy";
}

function resolveIpfs(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  return uri;
}

function isContributorNFT(uri: string, metadata: CredentialMetadata | null): boolean {
  if (uri?.toLowerCase().includes("contributor")) return true;
  if (metadata?.name?.toLowerCase().includes("contributor")) return true;
  return false;
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

async function fetchFromContract(
  contract: ThirdwebContract,
  address: string,
  label: "new" | "legacy"
): Promise<CredentialData[]> {
  try {
    const tokenIds = await readContract({
      contract,
      method: "function getTokensByFreelancer(address) view returns (uint256[])",
      params: [address],
    });
    if (!tokenIds || tokenIds.length === 0) return [];

    const creds = await Promise.all(
      tokenIds.map(async (id) => {
        try {
          const uri = await readContract({
            contract,
            method: "function tokenURI(uint256) view returns (string)",
            params: [id],
          });
          let metadata: CredentialMetadata | null = null;
          if (uri) {
            try {
              const res = await fetch(resolveIpfs(uri));
              if (res.ok) metadata = (await res.json()) as CredentialMetadata;
            } catch { /* metadata fetch failure is non-fatal */ }
          }
          return {
            tokenId: Number(id),
            uri,
            metadata,
            isContributor: isContributorNFT(uri, metadata),
            contractLabel: label,
          } as CredentialData;
        } catch { return null; }
      })
    );
    return creds.filter(Boolean) as CredentialData[];
  } catch { return []; }
}

export function Credentials() {
  const account = useActiveAccount();
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredentials() {
      if (!account?.address) { setCredentials([]); setLoading(false); return; }
      try {
        setLoading(true);
        const [fromNew, fromLegacy] = await Promise.all([
          fetchFromContract(credentialContract, account.address, "new"),
          fetchFromContract(legacyCredentialContract, account.address, "legacy"),
        ]);
        // Contributor NFTs first, then PoW SBTs
        const all = [...fromNew, ...fromLegacy].sort((a, b) =>
          a.isContributor === b.isContributor ? 0 : a.isContributor ? -1 : 1
        );
        setCredentials(all);
      } catch (error) {
        console.error("Failed to fetch credentials:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCredentials();
  }, [account]);

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
        <h2 className="text-xl font-semibold text-white mb-2">No On-Chain Credentials Yet</h2>
        <p className="text-white/50 max-w-md mx-auto">
          Complete a gig and have the client release escrow to mint your first Soulbound Proof-of-Work NFT.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence>
        {credentials.map((cred, index) => {
          const isContrib = cred.isContributor;
          return (
            <motion.div
              key={`${cred.contractLabel}-${cred.tokenId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className={`relative bg-[#0f172a]/80 backdrop-blur-xl border rounded-[1.5rem] p-6 shadow-xl transition-all duration-300 group overflow-hidden h-full flex flex-col gap-4 ${
                isContrib
                  ? "border-amber-400/25 hover:border-amber-400/50"
                  : "border-white/10 hover:border-primary/30"
              }`}>
                <div className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
                  isContrib ? "bg-amber-400/0 group-hover:bg-amber-400/5" : "bg-primary/0 group-hover:bg-primary/5"
                }`} />
                {isContrib && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                )}

                <div className="flex items-center justify-between z-10">
                  {isContrib ? (
                    <span className="text-xs text-amber-400 font-mono tracking-widest uppercase bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/25 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      +Contributor ⚖️
                    </span>
                  ) : (
                    <span className="text-xs text-primary font-mono tracking-widest uppercase bg-primary/10 px-2 py-1 rounded-md border border-primary/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Soulbound 🔒
                    </span>
                  )}
                  <span className="text-white/30 text-xs font-mono">Token #{cred.tokenId}</span>
                </div>

                <div className="z-10 mt-2">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-white text-xl">
                      {cred.metadata?.name || (isContrib ? "+Contributor" : `Credential #${cred.tokenId}`)}
                    </h3>
                    {cred.uri && (
                      <a
                        href={resolveIpfs(cred.uri)}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs flex items-center gap-1 transition-colors border rounded-full px-2 py-1 ${
                          isContrib
                            ? "text-amber-400 hover:text-amber-300 border-amber-400/20 hover:border-amber-400/50 bg-amber-400/5"
                            : "text-primary hover:text-primary/80 border-primary/20 hover:border-primary/50 bg-primary/5"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        View IPFS Data
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed mb-4">
                    {cred.metadata?.description || (isContrib
                      ? "Awarded for participating as a community jury member on Gigly"
                      : "Verifiable Proof of Work")}
                  </p>

                  {cred.metadata?.attributes && (
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                      {cred.metadata.attributes.map((attr, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                          <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1">{attr.trait_type}</p>
                          <p className="text-white font-mono text-sm break-all">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
