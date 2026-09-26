/**
 * ipfs.ts — Multi-gateway IPFS resolver with race + fallback strategy.
 *
 * Strategy:
 *  1. Normalise any ipfs:// URI into a bare CID path.
 *  2. Race the top 3 gateways with Promise.any (first success wins).
 *  3. If Promise.any rejects (all 3 fail within timeout), try remaining
 *     gateways sequentially as a last-resort fallback.
 *  4. Cache successful JSON responses in sessionStorage keyed by CID so
 *     re-renders and tab switches are instant with zero network requests.
 */

import { client } from "@/lib/config";
import { resolveScheme } from "thirdweb/storage";

// ── Gateway list ────────────────────────────────────────────────────────────
// Ordered roughly by typical latency. Top 3 are raced; rest are sequential fallback.

export const IPFS_GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
] as const;

/** ms allowed per individual gateway request */
const GATEWAY_TIMEOUT_MS = 10_000;
/** Number of gateways raced simultaneously in round 1 */
const RACE_COUNT = 3;

// ── CID normalisation ───────────────────────────────────────────────────────

/**
 * Extract the bare CID (+ optional path) from any IPFS URI form:
 *   ipfs://CID
 *   ipfs://ipfs/CID
 *   https://ipfs.io/ipfs/CID
 */
export function extractCid(uri: string): string {
  if (!uri) return "";
  // Strip ipfs://ipfs/ double prefix
  const stripped = uri
    .replace(/^ipfs:\/\/ipfs\//, "")
    .replace(/^ipfs:\/\//, "");
  // Strip any existing gateway prefix
  const gatewayRe = /^https?:\/\/[^/]+\/ipfs\//;
  return stripped.replace(gatewayRe, "");
}

/** Build an HTTP URL for a given gateway base + CID path */
export function gatewayUrl(gatewayBase: string, cid: string): string {
  return `${gatewayBase}${cid}`;
}

/**
 * Resolve any IPFS URI to a plain HTTPS URL.
 * Falls back through Thirdweb CDN first, then cloudflare-ipfs.
 */
export function resolveIpfsUrl(uri: string): string {
  if (!uri) return "";
  try {
    return resolveScheme({ client, uri });
  } catch {
    const cid = extractCid(uri);
    return cid ? `${IPFS_GATEWAYS[0]}${cid}` : uri;
  }
}

// ── Per-CID sessionStorage cache ────────────────────────────────────────────

const CACHE_PREFIX = "gigly_ipfs_meta_";

function cacheGet<T>(cid: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${cid}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function cacheSet(cid: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${cid}`, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — silently skip caching.
  }
}

/** Evict a single CID from the cache (used by Retry button). */
export function cacheInvalidate(cid: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}${cid}`);
  } catch {}
}

// ── Core fetch helpers ──────────────────────────────────────────────────────

async function fetchFromGateway(
  gatewayBase: string,
  cid: string
): Promise<unknown> {
  const url = gatewayUrl(gatewayBase, cid);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface IpfsFetchResult<T> {
  data: T | null;
  /** The gateway that succeeded, if any */
  gateway: string | null;
  /** true if all gateways timed out or errored */
  failed: boolean;
}

/**
 * Fetch and parse JSON from IPFS using a race + sequential fallback strategy.
 *
 * - Checks sessionStorage cache first (instant on cache hit).
 * - Races the first `RACE_COUNT` gateways via `Promise.any`.
 * - Falls back sequentially through remaining gateways if round-1 fails.
 * - Caches successful responses by CID.
 *
 * @param uri  Any IPFS URI (ipfs://, https://ipfs.io/ipfs/, etc.)
 * @param skipCache  Pass `true` from Retry button to force fresh fetch.
 */
export async function fetchIpfsJson<T = unknown>(
  uri: string,
  skipCache = false
): Promise<IpfsFetchResult<T>> {
  const cid = extractCid(uri);
  if (!cid) return { data: null, gateway: null, failed: true };

  // ── Cache hit ────────────────────────────────────────────────────────────
  if (!skipCache) {
    const cached = cacheGet<T>(cid);
    if (cached) return { data: cached, gateway: "cache", failed: false };
  }

  // ── Round 1: race top RACE_COUNT gateways ───────────────────────────────
  const raceGateways = IPFS_GATEWAYS.slice(0, RACE_COUNT);
  const fallbackGateways = IPFS_GATEWAYS.slice(RACE_COUNT);

  try {
    const result = await (Promise as any).any(
      raceGateways.map(async (gw) => {
        const data = await fetchFromGateway(gw, cid);
        return { data, gateway: gw };
      })
    ) as { data: T; gateway: string };

    cacheSet(cid, result.data);
    return { data: result.data, gateway: result.gateway, failed: false };
  } catch {
    // All raced gateways failed — try sequential fallbacks.
  }

  // ── Round 2: sequential fallback ─────────────────────────────────────────
  for (const gw of fallbackGateways) {
    try {
      const data = (await fetchFromGateway(gw, cid)) as T;
      cacheSet(cid, data);
      return { data, gateway: gw, failed: false };
    } catch {
      // Try next gateway.
    }
  }

  // ── All gateways exhausted ────────────────────────────────────────────────
  return { data: null, gateway: null, failed: true };
}
