import { NextRequest, NextResponse } from "next/server";

// ─── GitHub Skill Verification Oracle ───────────────────────────────────
// Analyzes public repos to verify freelancer skills via language detection.

interface GitHubRepo {
  language: string | null;
  fork: boolean;
}

interface VerificationResult {
  githubHandle: string;
  walletAddress: string;
  verifiedSkills: string[];
  repoCount: number;
  oracleSignature: string;
  verifiedAt: number;
}

// Map GitHub languages to display names
const LANGUAGE_MAP: Record<string, string> = {
  "Solidity": "Solidity",
  "TypeScript": "TypeScript",
  "JavaScript": "JavaScript",
  "Python": "Python",
  "Rust": "Rust",
  "Go": "Go",
  "Move": "Move",
  "Cairo": "Cairo",
  "C++": "C++",
  "Java": "Java",
  "Swift": "Swift",
  "Kotlin": "Kotlin",
  "Ruby": "Ruby",
  "PHP": "PHP",
  "Dart": "Dart",
  "HTML": "HTML/CSS",
  "CSS": "HTML/CSS",
  "SCSS": "HTML/CSS",
  "Vue": "Vue",
  "Svelte": "Svelte",
};

function generateMockSignature(handle: string, skills: string[]): string {
  // Simulate EAS attestation / W3C VC signature
  const payload = `${handle}:${skills.sort().join(",")}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubHandle, walletAddress } = body;

    if (!githubHandle || !walletAddress) {
      return NextResponse.json(
        { error: "githubHandle and walletAddress are required" },
        { status: 400 }
      );
    }

    // Clean handle (remove URL prefix if pasted)
    const handle = githubHandle
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "")
      .trim();

    // Fetch public repos from GitHub API
    const ghRes = await fetch(
      `https://api.github.com/users/${handle}/repos?per_page=100&sort=updated`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Gigly-Skill-Oracle",
        },
      }
    );

    if (!ghRes.ok) {
      if (ghRes.status === 404) {
        return NextResponse.json(
          { error: `GitHub user "${handle}" not found` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: ${ghRes.status}` },
        { status: 502 }
      );
    }

    const repos: GitHubRepo[] = await ghRes.json();

    // Aggregate languages from non-fork repos
    const langCount: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.fork || !repo.language) continue;
      const mapped = LANGUAGE_MAP[repo.language];
      if (mapped) {
        langCount[mapped] = (langCount[mapped] || 0) + 1;
      }
    }

    // Require at least 1 repo in a language to count as verified
    const verifiedSkills = Object.entries(langCount)
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    const result: VerificationResult = {
      githubHandle: handle,
      walletAddress: walletAddress.toLowerCase(),
      verifiedSkills,
      repoCount: repos.filter((r) => !r.fork).length,
      oracleSignature: generateMockSignature(handle, verifiedSkills),
      verifiedAt: Date.now(),
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("githubHandle");
  const wallet = searchParams.get("walletAddress");

  if (!handle || !wallet) {
    return NextResponse.json(
      { error: "githubHandle and walletAddress query params required" },
      { status: 400 }
    );
  }

  // Delegate to POST logic
  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ githubHandle: handle, walletAddress: wallet }),
    headers: { "Content-Type": "application/json" },
  });

  return POST(fakeRequest);
}
