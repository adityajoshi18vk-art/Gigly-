// ─── Freelancer Profile Registry ────────────────────────────────────────
// API-backed profile store. Falls back to localStorage for offline dev.

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
  /** KYC/ZK proof verified — persisted in API so clients can see it */
  kycVerified?: boolean;
}

// ─── Initials Helper ────────────────────────────────────────────────────

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── API-backed CRUD ────────────────────────────────────────────────────

/**
 * Fetch all registered freelancer profiles from the API.
 * Returns empty array if API unreachable or registry empty.
 */
export async function getRegisteredFreelancers(): Promise<FreelancerProfile[]> {
  try {
    const res = await fetch("/api/freelancers", { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    // Guard: API must return an array; if not, treat as empty
    return Array.isArray(data) ? (data as FreelancerProfile[]) : [];
  } catch {
    // Fallback to localStorage for offline dev
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("gigly_freelancer_registry");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FreelancerProfile[]) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Save/upsert a profile via API. Falls back to localStorage.
 */
export async function saveFreelancerProfile(
  profile: FreelancerProfile
): Promise<void> {
  const normalized = {
    ...profile,
    address: profile.address.toLowerCase(),
    avatarFallback: getInitials(profile.name),
  };

  try {
    const res = await fetch("/api/freelancers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });
    if (!res.ok) throw new Error("API error");
  } catch {
    // Fallback: save to localStorage
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("gigly_freelancer_registry");
      const profiles: FreelancerProfile[] = raw ? JSON.parse(raw) : [];
      const idx = profiles.findIndex(
        (p) => p.address.toLowerCase() === normalized.address
      );
      if (idx >= 0) {
        profiles[idx] = normalized;
      } else {
        profiles.push(normalized);
      }
      localStorage.setItem(
        "gigly_freelancer_registry",
        JSON.stringify(profiles)
      );
    } catch {
      // silent fail
    }
  }
}

/**
 * Single profile lookup by address (case-insensitive).
 */
export async function getFreelancerProfile(
  address: string
): Promise<FreelancerProfile | undefined> {
  if (!address) return undefined;
  const profiles = await getRegisteredFreelancers();
  return profiles.find(
    (p) => p.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * KYC verification check via localStorage key convention.
 */
export function isKycVerified(address: string): boolean {
  if (typeof window === "undefined" || !address) return false;
  return (
    localStorage.getItem(`finguard_kyc_${address.toLowerCase()}`) === "true"
  );
}
