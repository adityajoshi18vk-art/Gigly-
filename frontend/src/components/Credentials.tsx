"use client";

import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { credentialContract, CONTRACTS } from "@/lib/config";
import { client as thirdwebClient } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock } from "lucide-react";

interface CredentialMetadata {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

interface CredentialData {
  tokenId: number;
  uri: string;
  metadata: CredentialMetadata | null;
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

  useEffect(() => {
    async function fetchCredentials() {
      // Guard: no account or contract not deployed
      if (!account?.address || !isCredentialContractDeployed()) {
        setCredentials([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch token IDs for this freelancer directly from the SBT Contract
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

        // Fetch metadata for each token from IPFS
        const creds = await Promise.all(
          tokenIds.map(async (id) => {
            try {
              const uri = await readContract({
                contract: credentialContract,
                method: "function tokenURI(uint256) view returns (string)",
                params: [id],
              });

              let metadata: CredentialMetadata | null = null;
              if (uri) {
                try {
                  const gatewayUrl = resolveIpfs(uri);
                  const res = await fetch(gatewayUrl);
                  if (res.ok) {
                    metadata = (await res.json()) as CredentialMetadata;
                  }
                } catch (e) {
                  console.warn(`Failed to parse metadata for token ${id}`, e);
                }
              }

              return {
                tokenId: Number(id),
                uri,
                metadata,
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
        {credentials.map((cred, index) => (
          <motion.div
            key={cred.tokenId}
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
                <span className="text-white/30 text-xs font-mono">Token #{cred.tokenId}</span>
              </div>
              
              <div className="z-10 mt-2">
                <h3 className="font-bold text-white text-xl mb-1">{cred.metadata?.name || `Credential #${cred.tokenId}`}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-4">{cred.metadata?.description || "Verifiable Proof of Work"}</p>
                
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
        ))}
      </AnimatePresence>
    </div>
  );
}
