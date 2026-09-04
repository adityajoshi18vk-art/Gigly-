// ─── Freelancer Profile Registry (On-Chain) ─────────────────────────────────
// Reads from FreelancerRegistry smart contract. Writes go through wallet tx.

import { readContract, prepareContractCall } from "thirdweb";
import { freelancerRegistryContract } from "@/lib/config";
import type { PreparedTransaction } from "thirdweb";

export type FreelancerDomain =
  | "Smart Contracts"
  | "Frontend"
  | "Backend"
  | "Auditing"
  | "UI/UX"
  | "Other";

export interface FreelancerProfile {
  address: string;
  name: string;
  title: string;
  domain: FreelancerDomain;
  hourlyRate: number;
  skills: string[];
  verifiedSkills?: string[];
  skillVerificationHash?: string;
  bio: string;
  portfolioUrl?: string;
  githubUrl?: string;
  avatarFallback: string;
  createdAt: number;
  kycVerified?: boolean;
}

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Convert on-chain Profile struct to FreelancerProfile
function toProfile(
  raw: readonly [string, string, string, string, bigint, string, string, string, string, boolean, bigint, boolean],
  addr: string
): FreelancerProfile {
  return {
    address: addr,
    name: raw[1],
    title: raw[2],
    domain: raw[3] as FreelancerDomain,
    hourlyRate: Number(raw[4]),
    bio: raw[5],
    portfolioUrl: raw[6] || undefined,
    githubUrl: raw[7] || undefined,
    skills: raw[8] ? raw[8].split(",").map((s) => s.trim()).filter(Boolean) : [],
    kycVerified: raw[9],
    createdAt: Number(raw[10]) * 1000, // convert seconds to ms
    avatarFallback: getInitials(raw[1]),
  };
}

export async function getRegisteredFreelancers(): Promise<FreelancerProfile[]> {
  try {
    const addresses = await readContract({
      contract: freelancerRegistryContract,
      method: "function getAllFreelancers() view returns (address[])",
      params: [],
    });
    if (!addresses || addresses.length === 0) return [];

    const profiles = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const raw = await readContract({
            contract: freelancerRegistryContract,
            method:
              "function getProfile(address) view returns ((address,string,string,string,uint256,string,string,string,string,bool,uint256,bool))",
            params: [addr],
          });
          if (!raw || !raw[11]) return null; // exists = false
          return toProfile(raw, addr);
        } catch {
          return null;
        }
      })
    );
    return profiles.filter(Boolean) as FreelancerProfile[];
  } catch (err) {
    console.error("Failed to fetch freelancers from contract:", err);
    return [];
  }
}

export async function getFreelancerProfile(
  address: string
): Promise<FreelancerProfile | undefined> {
  if (!address) return undefined;
  try {
    const raw = await readContract({
      contract: freelancerRegistryContract,
      method:
        "function getProfile(address) view returns ((address,string,string,string,uint256,string,string,string,string,bool,uint256,bool))",
      params: [address],
    });
    if (!raw || !raw[11]) return undefined;
    return toProfile(raw, address);
  } catch {
    return undefined;
  }
}

/**
 * Returns a prepared transaction that the caller must send via sendTransaction().
 * Usage in component:
 *   const tx = prepareRegisterFreelancer(profile);
 *   await sendTransaction(tx);
 */
export function prepareRegisterFreelancer(
  profile: FreelancerProfile
): PreparedTransaction {
  return prepareContractCall({
    contract: freelancerRegistryContract,
    method:
      "function registerOrUpdate(string name, string title, string domain, uint256 hourlyRate, string bio, string portfolioUrl, string githubUrl, string skills)",
    params: [
      profile.name,
      profile.title,
      profile.domain,
      BigInt(Math.round(profile.hourlyRate)),
      profile.bio || "",
      profile.portfolioUrl || "",
      profile.githubUrl || "",
      (profile.skills || []).join(","),
    ],
  }) as PreparedTransaction;
}

/** Legacy compat — still saves to API as backup for KYC fields not stored on-chain */
export async function saveFreelancerProfile(
  profile: FreelancerProfile
): Promise<void> {
  try {
    await fetch("/api/freelancers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        address: profile.address.toLowerCase(),
      }),
    });
  } catch {
    /* non-critical */
  }
}

export function isKycVerified(address: string): boolean {
  if (typeof window === "undefined" || !address) return false;
  return (
    localStorage.getItem(`finguard_kyc_${address.toLowerCase()}`) === "true"
  );
}
