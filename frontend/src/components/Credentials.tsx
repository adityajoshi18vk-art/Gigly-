"use client";

import { useEffect, useState, useCallback } from "react";
import { readContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { client, credentialContract, CONTRACTS } from "@/lib/config";
import { fetchIpfsJson, resolveIpfsUrl, extractCid, cacheInvalidate } from "@/lib/ipfs";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface CredentialMetadata {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

type MetadataStatus = "loading" | "loaded" | "failed";

interface CredentialData {
  tokenId: number;
  uri: string;
  metadata: CredentialMetadata | null;
  status: MetadataStatus;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isCredentialContractDeployed(): boolean {
  const addr = CONTRACTS.GiglyCredential;
  return !!addr && addr !== "0x0000000000000000000000000000000000000000";
}

// ── Sub-components ───────────────────────────────────────────────────────────

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

/** Inline skeleton shown while a single card's metadata is still loading */
function MetadataLoadingSkeleton() {
  return (
    <div className="mt-3 space-y-2 animate-pulse">
      <div className="h-4 w-full bg-slate-100 rounded" />
      <div className="h-4 w-2/3 bg-slate-100 rounded" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="h-14 bg-slate-100 rounded-lg" />
        <div className="h-14 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

interface FailedMetadataBlockProps {
  tokenId: number;
  uri: string;
  isRetrying: boolean;
  onRetry: () => void;
}

/** Clean fallback card body — no broken warning, uses on-chain data only */
function FailedMetadataBlock({ tokenId, uri, isRetrying, onRetry }: FailedMetadataBlockProps) {
  const cid = extractCid(uri);
  const ipfsHttpUrl = uri ? resolveIpfsUrl(uri) : null;

  return (
    <div className="mt-3 space-y-3">
      {/* Status badge row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">
          Soulbound (Sepolia)
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
          Verified Work Milestone
        </span>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-slate-500 leading-relaxed">
        On-chain token is valid. IPFS metadata gateway unavailable — raw CID preserved below.
      </p>

      {/* Links */}
      <div className="flex flex-wrap gap-2 pt-1">
        {ipfsHttpUrl && (
          <a
            href={ipfsHttpUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Raw CID / IPFS
          </a>
        )}
        <a
          href={`https://sepolia.etherscan.io/token/${CONTRACTS.GiglyCredential}?a=${tokenId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View on Etherscan
        </a>
      </div>

      {/* Retry button — invalidates cache so gateway fallback reruns fresh */}
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
        {isRetrying ? "Retrying gateways…" : "Retry IPFS"}
      </button>

      {cid && (
        <p className="text-[10px] font-mono text-slate-400 break-all pt-1">
          CID: {cid}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Credentials() {
  const account = useActiveAccount();
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<Set<number>>(new Set());

  // ── Fetch metadata for a single token (uses multi-gateway fallback) ───────
  const loadMetadata = useCallback(
    async (
      tokenId: number,
      uri: string,
      skipCache = false
    ): Promise<{ metadata: CredentialMetadata | null; status: MetadataStatus }> => {
      if (!uri) return { metadata: null, status: "failed" };

      const result = await fetchIpfsJson<CredentialMetadata>(uri, skipCache);

      if (result.failed || !result.data) {
        return { metadata: null, status: "failed" };
      }
      return { metadata: result.data, status: "loaded" };
    },
    []
  );

  // ── Fetch all credential token IDs then stream metadata per token ─────────
  const fetchCredentials = useCallback(async () => {
    if (!account?.address || !isCredentialContractDeployed()) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let tokenIds: readonly bigint[];
    try {
      tokenIds = await readContract({
        contract: credentialContract,
        method: "function getTokensByFreelancer(address) view returns (uint256[])",
        params: [account.address],
      });
    } catch (err) {
      console.warn("[Credentials] Failed to fetch token IDs:", err);
      setCredentials([]);
      setLoading(false);
      return;
    }

    if (!tokenIds || tokenIds.length === 0) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    // Fetch on-chain token URIs (fast, single RPC call each).
    const uriResults = await Promise.all(
      tokenIds.map(async (id) => {
        try {
          const uri = await readContract({
            contract: credentialContract,
            method: "function tokenURI(uint256) view returns (string)",
            params: [id],
          });
          return { tokenId: Number(id), uri };
        } catch {
          return { tokenId: Number(id), uri: "" };
        }
      })
    );

    // Seed state immediately with "loading" skeletons so user sees cards at once.
    const seedState: CredentialData[] = uriResults.map(({ tokenId, uri }) => ({
      tokenId,
      uri,
      metadata: null,
      status: "loading" as MetadataStatus,
    }));
    setCredentials(seedState);
    setLoading(false);

    // Stream metadata fetches — each updates its own card independently.
    uriResults.forEach(async ({ tokenId, uri }) => {
      const { metadata, status } = await loadMetadata(tokenId, uri);
      setCredentials((prev) =>
        prev.map((c) => (c.tokenId === tokenId ? { ...c, metadata, status } : c))
      );
    });
  }, [account, loadMetadata]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // ── Per-token retry (invalidates cache, re-runs gateway fallback) ──────────
  const retryMetadata = useCallback(
    async (tokenId: number) => {
      const cred = credentials.find((c) => c.tokenId === tokenId);
      if (!cred?.uri) return;

      // Evict from sessionStorage cache so fresh gateway race runs.
      cacheInvalidate(extractCid(cred.uri));

      setRetrying((prev) => new Set(prev).add(tokenId));
      // Reset to loading skeleton while retry is in-flight.
      setCredentials((prev) =>
        prev.map((c) =>
          c.tokenId === tokenId ? { ...c, status: "loading", metadata: null } : c
        )
      );

      const { metadata, status } = await loadMetadata(tokenId, cred.uri, true);

      setCredentials((prev) =>
        prev.map((c) => (c.tokenId === tokenId ? { ...c, metadata, status } : c))
      );
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(tokenId);
        return next;
      });
    },
    [credentials, loadMetadata]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

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

              {/* Token ID note */}
              <p className="text-[11px] text-slate-400 font-mono z-10 -mt-2">
                Token ID #{cred.tokenId} · Soulbound
              </p>

              <div className="z-10">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-xl">
                    {/* Show name from metadata if loaded, else sensible default */}
                    {cred.status === "loaded"
                      ? cred.metadata?.name || `Credential #${cred.tokenId}`
                      : `Credential #${cred.tokenId}`}
                  </h3>
                  {cred.uri && cred.status === "loaded" && (
                    <a
                      href={resolveIpfsUrl(cred.uri)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold flex items-center gap-1 text-primary hover:text-primary-hover transition-colors border border-primary/20 hover:border-primary/50 rounded-full px-2.5 py-1 bg-primary/5 shrink-0"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      View IPFS Data
                    </a>
                  )}
                </div>

                {cred.status === "loaded" && (
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">
                    {cred.metadata?.description || "Verifiable Proof of Work"}
                  </p>
                )}

                {/* ── Per-status content ────────────────────────────────── */}

                {cred.status === "loading" && <MetadataLoadingSkeleton />}

                {cred.status === "failed" && (
                  <FailedMetadataBlock
                    tokenId={cred.tokenId}
                    uri={cred.uri}
                    isRetrying={retrying.has(cred.tokenId)}
                    onRetry={() => retryMetadata(cred.tokenId)}
                  />
                )}

                {cred.status === "loaded" &&
                  cred.metadata?.attributes &&
                  cred.metadata.attributes.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                      {cred.metadata.attributes.map((attr, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                            {attr.trait_type}
                          </p>
                          <p className="text-slate-900 font-mono text-sm font-semibold break-all">
                            {attr.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Footer — always visible */}
              <div className="mt-auto pt-3 border-t border-slate-100 z-10 flex items-center justify-between">
                <a
                  href={`https://sepolia.etherscan.io/token/${CONTRACTS.GiglyCredential}?a=${cred.tokenId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Etherscan
                </a>
                {/* Show subtle gateway info when metadata loaded from IPFS */}
                {cred.status === "loaded" && (
                  <span className="text-[10px] text-slate-400 font-mono">IPFS ✓</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
