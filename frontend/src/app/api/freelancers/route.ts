import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// ─── File-backed freelancer registry ────────────────────────────────────
// Persists across hot reloads and serves all tabs/incognito windows.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "freelancers.json");

interface FreelancerProfile {
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
}

function readProfiles(): FreelancerProfile[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as FreelancerProfile[];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: FreelancerProfile[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), "utf-8");
}

export async function GET() {
  const profiles = readProfiles();
  return NextResponse.json(profiles);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FreelancerProfile;
    if (!body.address || !body.name || !body.title) {
      return NextResponse.json(
        { error: "address, name, and title are required" },
        { status: 400 }
      );
    }

    const normalized = {
      ...body,
      address: body.address.toLowerCase(),
    };

    const profiles = readProfiles();
    const idx = profiles.findIndex(
      (p) => p.address.toLowerCase() === normalized.address
    );

    if (idx >= 0) {
      profiles[idx] = normalized;
    } else {
      profiles.push(normalized);
    }

    writeProfiles(profiles);
    return NextResponse.json(normalized, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
