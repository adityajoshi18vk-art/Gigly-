import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { getSupabaseServer } from "@/lib/supabaseServer";

// ─── Freelancer Profile Data Model ───────────────────────────────────────
// Mirrors the frontend's FreelancerProfile interface and maps to Supabase.

export interface FreelancerProfile {
  address: string;
  name: string;
  title: string;
  domain: string;
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

interface FreelancerRow {
  address: string;
  name: string;
  title: string;
  domain: string;
  hourly_rate: number;
  skills: string[];
  verified_skills?: string[] | null;
  skill_verification_hash?: string | null;
  bio?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  avatar_fallback?: string | null;
  kyc_verified?: boolean | null;
  created_at: number | string;
}

// ─── Column Translators (camelCase <-> snake_case) ──────────────────────

function rowToProfile(row: FreelancerRow): FreelancerProfile {
  return {
    address: row.address,
    name: row.name,
    title: row.title,
    domain: row.domain || "Other",
    hourlyRate: Number(row.hourly_rate) || 0,
    skills: Array.isArray(row.skills) ? row.skills : [],
    verifiedSkills: Array.isArray(row.verified_skills) && row.verified_skills.length > 0 ? row.verified_skills : undefined,
    skillVerificationHash: row.skill_verification_hash || undefined,
    bio: row.bio || "",
    portfolioUrl: row.portfolio_url || undefined,
    githubUrl: row.github_url || undefined,
    avatarFallback: row.avatar_fallback || (row.name ? row.name.slice(0, 2).toUpperCase() : "FL"),
    createdAt: Number(row.created_at) || Date.now(),
    kycVerified: Boolean(row.kyc_verified),
  };
}

function profileToRow(profile: FreelancerProfile): Record<string, any> {
  return {
    address: profile.address.toLowerCase(),
    name: profile.name,
    title: profile.title,
    domain: profile.domain || "Other",
    hourly_rate: profile.hourlyRate ?? 0,
    skills: profile.skills || [],
    verified_skills: profile.verifiedSkills || [],
    skill_verification_hash: profile.skillVerificationHash || null,
    bio: profile.bio || "",
    portfolio_url: profile.portfolioUrl || null,
    github_url: profile.githubUrl || null,
    avatar_fallback: profile.avatarFallback || (profile.name ? profile.name.slice(0, 2).toUpperCase() : "FL"),
    kyc_verified: Boolean(profile.kycVerified),
    created_at: profile.createdAt || Date.now(),
  };
}

// ─── Local File Fallback (Offline / Dev resilience) ──────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "freelancers.json");

function readProfilesFromFile(): FreelancerProfile[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FreelancerProfile[]) : [];
  } catch {
    return [];
  }
}

function writeProfileToFile(profile: FreelancerProfile): void {
  try {
    const profiles = readProfilesFromFile();
    const idx = profiles.findIndex(
      (p) => p.address.toLowerCase() === profile.address.toLowerCase()
    );

    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Freelancers API] Local file write failed:", err);
  }
}

// ─── HTTP Route Handlers ────────────────────────────────────────────────

/**
 * GET /api/freelancers
 * Optional query parameter: ?address=0x...
 * Returns an array of FreelancerProfile items.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetAddress = searchParams.get("address")?.toLowerCase();

  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      let query = supabase
        .from("freelancers")
        .select("*")
        .order("created_at", { ascending: false });

      if (targetAddress) {
        query = query.eq("address", targetAddress);
      }

      const { data, error } = await query;
      if (!error && data) {
        const profiles = (data as FreelancerRow[]).map(rowToProfile);
        return NextResponse.json(profiles);
      }

      if (error) {
        console.warn("[Freelancers API] Supabase query error, using local fallback:", error.message);
      }
    } catch (err) {
      console.warn("[Freelancers API] Supabase connection error:", err);
    }
  }

  // Graceful fallback to file
  const localProfiles = readProfilesFromFile();
  if (targetAddress) {
    return NextResponse.json(
      localProfiles.filter((p) => p.address.toLowerCase() === targetAddress)
    );
  }
  return NextResponse.json(localProfiles);
}

/**
 * POST /api/freelancers
 * Upserts a freelancer profile by wallet address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FreelancerProfile;
    if (!body.address || !body.name || !body.title) {
      return NextResponse.json(
        { error: "address, name, and title are required" },
        { status: 400 }
      );
    }

    const normalized: FreelancerProfile = {
      ...body,
      address: body.address.toLowerCase(),
      createdAt: body.createdAt || Date.now(),
    };

    const supabase = getSupabaseServer();
    if (supabase) {
      try {
        const row = profileToRow(normalized);
        const { error } = await supabase
          .from("freelancers")
          .upsert(row, { onConflict: "address" });

        if (error) {
          console.warn("[Freelancers API] Supabase upsert error, persisting to local fallback:", error.message);
          writeProfileToFile(normalized);
        }
      } catch (err) {
        console.warn("[Freelancers API] Supabase connection error:", err);
        writeProfileToFile(normalized);
      }
    } else {
      // Supabase credentials not set yet; save locally
      writeProfileToFile(normalized);
    }

    return NextResponse.json(normalized, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
