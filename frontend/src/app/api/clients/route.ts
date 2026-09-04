import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { getSupabaseServer } from "@/lib/supabaseServer";

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

interface ClientRow {
  address: string;
  name: string;
  company_name?: string | null;
  industry?: string | null;
  website?: string | null;
  bio?: string | null;
  avatar_fallback?: string | null;
  created_at: number | string;
}

function rowToProfile(row: ClientRow): ClientProfile {
  return {
    address: row.address,
    name: row.name,
    companyName: row.company_name || undefined,
    industry: row.industry || "Technology",
    website: row.website || undefined,
    bio: row.bio || "",
    avatarFallback: row.avatar_fallback || (row.name ? row.name.slice(0, 2).toUpperCase() : "CL"),
    createdAt: Number(row.created_at) || Date.now(),
  };
}

function profileToRow(profile: ClientProfile): Record<string, any> {
  return {
    address: profile.address.toLowerCase(),
    name: profile.name,
    company_name: profile.companyName || null,
    industry: profile.industry || "Technology",
    website: profile.website || null,
    bio: profile.bio || "",
    avatar_fallback: profile.avatarFallback || (profile.name ? profile.name.slice(0, 2).toUpperCase() : "CL"),
    created_at: profile.createdAt || Date.now(),
  };
}

// ─── Local File Fallback ──────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "clients.json");

function readProfilesFromFile(): ClientProfile[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClientProfile[]) : [];
  } catch {
    return [];
  }
}

function writeProfileToFile(profile: ClientProfile): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readProfilesFromFile();
    const idx = current.findIndex((c) => c.address.toLowerCase() === profile.address.toLowerCase());
    if (idx >= 0) {
      current[idx] = profile;
    } else {
      current.push(profile);
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write client profile to file:", err);
  }
}

// ─── API Routes ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  const supabase = getSupabaseServer();

  if (supabase) {
    try {
      if (address) {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .ilike("address", address.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
        }
        return NextResponse.json(rowToProfile(data as ClientRow));
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const profiles = (data as ClientRow[]).map(rowToProfile);
      return NextResponse.json(profiles);
    } catch (err) {
      console.warn("Supabase clients read failed, falling back to local file:", err);
    }
  }

  // Fallback
  const fileProfiles = readProfilesFromFile();
  if (address) {
    const found = fileProfiles.find((c) => c.address.toLowerCase() === address.toLowerCase());
    if (!found) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }
    return NextResponse.json(found);
  }
  return NextResponse.json(fileProfiles);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, name } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'address'" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'name'" }, { status: 400 });
    }

    const profile: ClientProfile = {
      address: address.toLowerCase(),
      name: name.trim(),
      companyName: body.companyName?.trim() || undefined,
      industry: body.industry?.trim() || "Technology",
      website: body.website?.trim() || undefined,
      bio: body.bio?.trim() || "",
      avatarFallback: body.avatarFallback || name.trim().slice(0, 2).toUpperCase(),
      createdAt: body.createdAt || Date.now(),
    };

    const supabase = getSupabaseServer();

    if (supabase) {
      try {
        const row = profileToRow(profile);
        const { error } = await supabase
          .from("clients")
          .upsert(row, { onConflict: "address" });

        if (error) throw error;
        writeProfileToFile(profile);
        return NextResponse.json({ success: true, profile, storage: "supabase" }, { status: 200 });
      } catch (err) {
        console.warn("Supabase client upsert failed, persisting to file fallback:", err);
      }
    }

    writeProfileToFile(profile);
    return NextResponse.json({ success: true, profile, storage: "file" }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/clients error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
