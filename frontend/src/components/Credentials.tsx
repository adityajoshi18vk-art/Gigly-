"use client";

import { useEffect, useState, useCallback } from "react";
import { readContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { credentialContract, CONTRACTS } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, ExternalLink, RefreshCw } from "lucide-react";

interface CredentialMetadata {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

interface CredentialData {
  tokenId: number;
  uri: string;
  metadata: CredentialMetadata | null;
  /** true when we fetched the URI but the IPFS fetch failed */
  metadataFailed: boolean;
}

/** Convert ipfs:// URIs to an HTTP gateway URL */
function resolveIpfs(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

/** Check if credential contract is actually deployed (not zero-address placeholder) */
function isCredentialContractDeployed(): boolean {
  const addr = CONTRACTS.GiglyCredential;
  return !!addr && addr !== "0x0000000000000000000000000000000000000000";
}

function SkeletonCard() {
  return (
    <div className="relative bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm overflow-hidden h-full flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-slate-200 rounded-md" />
        <div className="h-4 w-16 bg-slate-100 rounded-md" />
      </div>
      <div className="mt-2 space-y-3">
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
        <div className="h-16 bg-slate-100 rounded-lg" />
        <div className="h-16 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

async function fetchMetadataForToken(uri: string): Promise<CredentialMetadata | null> {
  if (!uri) return null;
  try {
    const gatewayUrl = resolveIpfs(uri);
    const res = await fetch(gatewayUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      return (await res.json()) as CredentialMetadata;
    }
  } catch (e) {
    console.warn("IPFS metadata fetch failed:", e);
  }
  return null;
}

export function Credentials() {
  const account = useActiveAccount();
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<Set<number>>(new Set());

  const fetchCredentials = useCallback(async () => {
    if (!account?.address || !isCredentialContractDeployed()) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let tokenIds: readonly bigint[];
      try {
        tokenIds = await readContract({
          contract: credentialContract,
          method: "function getTokensByFreelancer(address) view returns (uint256[])",
          params: [account.address],
        });
      } catch (err) {
        console.warn("Failed to fetch credential token IDs:", err);
        setCredentials([]);
        return;
      }

      if (!tokenIds || tokenIds.length === 0) {
        setCredentials([]);
        return;
      }

      const creds = await Promise.all(
        tokenIds.map(async (id) => {
          try {
            const uri = await readContract({
              contract: credentialContract,
              method: "function tokenURI(uint256) view returns (string)",
              params: [id],
            });

            const metadata = await fetchMetadataForToken(uri);
            return {
              tokenId: Number(id),
              uri,
              metadata,
              metadataFailed: !!uri && metadata === null,
            };
          } catch (err) {
            console.error(`Failed to fetch token ${id}`, err);
            return null;
          }
        })
      );

      setCredentials(creds.filter(Boolean) as CredentialData[]);
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  /** Retry fetching IPFS metadata for a single token */
  const retryMetadata = async (tokenId: number) => {
    setRetrying((prev) => new Set(prev).add(tokenId));
    try {
      const cred = credentials.find((c) => c.tokenId === tokenId);
      if (!cred?.uri) return;
      const metadata = await fetchMetadataForToken(cred.uri);
      setCredentials((prev) =>
        prev.map((c) =>
          c.tokenId === tokenId
            ? { ...c, metadata, metadataFailed: metadata === null }
            : c
        )
      );
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(tokenId);
        return next;
      });
    }
  };

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
        className="max-w-4xl mx-auto text-center py-20 bg-white p-12 border border-slate-200 rounded-[1.5rem] shadow-sm"
      >
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No On-Chain Credentials Yet</h2>
        <p className="text-slate-600 font-medium max-w-md mx-auto">
          Complete a gig and have the client release escrow to mint your first Soulbound Proof-of-Work NFT.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence>
        {credentials.map((cred, index) => (
          <motion.div
            key={cred.tokenId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="relative bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 group overflow-hidden h-full flex flex-col gap-4">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 pointer-events-none" />

              {/* Header row */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs text-primary font-mono font-bold tracking-widest uppercase bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Soulbound 🔒
                </span>
                <span className="text-slate-600 text-xs font-mono font-bold">Token #{cred.tokenId}</span>
              </div>

              {/* Network + Contract badges */}
              <div className="flex items-center gap-2 z-10">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                  Sepolia Testnet
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                  GiglyCredential
                </span>
              </div>

              {/* Token ID + Soulbound note */}
              <p className="text-[11px] text-slate-400 font-mono z-10 -mt-2">
                Token ID #{cred.tokenId} · Soulbound
              </p>

              <div className="z-10">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-xl">
                    {cred.metadata?.name || `Credential #${cred.tokenId}`}
                  </h3>
                  {cred.uri && (
                    <a
                      href={resolveIpfs(cred.uri)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold flex items-center gap-1 text-primary hover:text-primary-hover transition-colors border border-primary/20 hover:border-primary/50 rounded-full px-2.5 py-1 bg-primary/5 shrink-0"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      View IPFS Data
                    </a>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">
                  {cred.metadata?.description || "Verifiable Proof of Work"}
                </p>

                {/* Attributes grid or fallback states */}
                {cred.metadataFailed ? (
                  /* IPFS fetch failed — show fallback with retry */
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2">
                    <p className="text-xs text-amber-700 font-medium">
                      Metadata loading from IPFS timed out. Token ID #{cred.tokenId} is valid on-chain.
                    </p>
                    <button
                      onClick={() => retryMetadata(cred.tokenId)}
                      disabled={retrying.has(cred.tokenId)}
                      className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3 h-3 ${retrying.has(cred.tokenId) ? "animate-spin" : ""}`} />
                      {retrying.has(cred.tokenId) ? "Retrying..." : "Retry IPFS"}
                    </button>
                  </div>
                ) : cred.metadata?.attributes && cred.metadata.attributes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                    {cred.metadata.attributes.map((attr, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">{attr.trait_type}</p>
                        <p className="text-slate-900 font-mono text-sm font-semibold break-all">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                ) : cred.metadata ? (
                  /* Metadata loaded but attributes array empty */
                  <p className="text-xs text-slate-400 italic mt-3">Metadata loading from IPFS...</p>
                ) : null}
              </div>

              {/* Footer — View on Etherscan */}
              <div className="mt-auto pt-3 border-t border-slate-100 z-10">
                <a
                  href={`https://sepolia.etherscan.io/token/${CONTRACTS.GiglyCredential}?a=${cred.tokenId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Etherscan
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
