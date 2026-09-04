// ─── Client Profile Registry ─────────────────────────────────────────────
// API-backed client profile store. Falls back to localStorage for offline dev.

export interface ClientProfile {
  address: string;
  name: string;
  companyName?: string;
  industry?: string;
  website?: string;
  bio?: string;
  avatarFallback: string;
  createdAt: number;
}

export const getClientInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "CL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Fetch a client profile by wallet address.
 */
export async function getClientProfile(address: string): Promise<ClientProfile | undefined> {
  try {
    const res = await fetch(`/api/clients?address=${encodeURIComponent(address)}`, {
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data && data.name ? (data as ClientProfile) : undefined;
  } catch {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = localStorage.getItem(`gigly_client_profile_${address.toLowerCase()}`);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * Save or update a client profile in Supabase via API.
 */
export async function saveClientProfile(profile: ClientProfile): Promise<void> {
  try {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `API responded with status ${res.status}`);
    }
  } finally {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `gigly_client_profile_${profile.address.toLowerCase()}`,
          JSON.stringify(profile)
        );
      } catch {}
    }
  }
}
