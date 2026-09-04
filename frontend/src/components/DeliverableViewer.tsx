"use client";

import { useState } from "react";
import { Lock, Download, Eye, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";

type DeliverableStatus = "InReview" | "Completed" | "Disputed";

interface DeliverableViewerProps {
  previewUrl: string;
  rawDeliverableUrl?: string;
  jobStatus: DeliverableStatus;
  jobTitle: string;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"];

function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));
  }
}

/** Known embed-safe URL patterns */
const EMBEDDABLE_PATTERNS = [
  /youtube\.com\/embed/i,
  /youtube-nocookie\.com\/embed/i,
  /player\.vimeo\.com/i,
  /codepen\.io\/.*\/embed/i,
  /codesandbox\.io\/embed/i,
  /stackblitz\.com\/edit/i,
  /figma\.com\/embed/i,
  /canva\.com\/design\/.*\/.*embed/i,
  /docs\.google\.com\/(presentation|document|spreadsheets)\/.*\/embed/i,
  /loom\.com\/embed/i,
];

function isEmbeddableUrl(url: string): boolean {
  return EMBEDDABLE_PATTERNS.some((pattern) => pattern.test(url));
}

export function DeliverableViewer({
  previewUrl,
  rawDeliverableUrl,
  jobStatus,
  jobTitle,
}: DeliverableViewerProps) {
  const isLocked = jobStatus === "InReview";
  const isCompleted = jobStatus === "Completed";
  const isDisputed = jobStatus === "Disputed";

  const securityHandlers = isLocked
    ? {
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        onDragStart: (e: React.DragEvent) => e.preventDefault(),
      }
    : {};

  return (
    <div className="rounded-xl border border-white/10 bg-[#060b16] overflow-hidden">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xs font-medium text-white/60">
          <Eye className="w-3.5 h-3.5" />
          <span className="truncate max-w-[180px]">{jobTitle}</span>
        </div>
        {isLocked && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
            <ShieldAlert className="w-3 h-3" />
            Escrow Locked
          </span>
        )}
        {isCompleted && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Unlocked
          </span>
        )}
        {isDisputed && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Disputed
          </span>
        )}
      </div>

      {/* ── Preview sandbox ───────────────────────────── */}
      <div className="relative" {...securityHandlers}>
        {isImageUrl(previewUrl) ? (
          <img
            src={previewUrl}
            alt={`Preview: ${jobTitle}`}
            className={`w-full max-h-[420px] object-contain bg-black/40 ${isLocked ? "select-none" : ""}`}
            draggable={!isLocked}
          />
        ) : isEmbeddableUrl(previewUrl) ? (
          <iframe
            src={previewUrl}
            title={`Preview: ${jobTitle}`}
            className={`w-full h-96 border-0 bg-white rounded-none ${isLocked ? "select-none" : ""}`}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-96 flex flex-col items-center justify-center bg-[#080d18] border-0 relative overflow-hidden">
            <div className="flex flex-col items-center gap-4 relative z-20">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-white/40 text-sm text-center px-4">
                This deliverable is hosted externally and cannot be embedded.
              </p>
              <a
                href={previewUrl.startsWith("http") ? previewUrl : `https://${previewUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-lg text-sm font-medium transition-all relative z-20"
              >
                Open Preview in New Tab
              </a>
            </div>
          </div>
        )}

        {/* Watermark overlay (InReview only) */}
        {isLocked && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="deliverable-watermark"
                  x="0"
                  y="0"
                  width="360"
                  height="140"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-25)"
                >
                  <text
                    x="10"
                    y="35"
                    fill="rgba(255,255,255,0.09)"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="monospace"
                    letterSpacing="3"
                  >
                    PREVIEW ONLY • ESCROW LOCKED • GIGLY VERIFIED
                  </text>
                  <text
                    x="60"
                    y="100"
                    fill="rgba(255,255,255,0.05)"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                    letterSpacing="2"
                  >
                    APPROVE TO UNLOCK DELIVERABLE
                  </text>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#deliverable-watermark)" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Unlock bar ────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
        {isLocked && (
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-amber-300/80 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Final deliverable locked in escrow. Approve work to disburse payment and reveal source code.</span>
          </div>
        )}

        {isCompleted && rawDeliverableUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Escrow Settled. Final Deliverable Unlocked:
            </div>
            <a
              href={rawDeliverableUrl.startsWith("http") ? rawDeliverableUrl : `https://${rawDeliverableUrl}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 hover:text-emerald-200 text-sm font-semibold transition-all"
            >
              <Download className="w-4 h-4" />
              Download Final Deliverable
            </a>
          </div>
        )}

        {isCompleted && !rawDeliverableUrl && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium py-2">
            <ShieldCheck className="w-4 h-4" />
            Escrow Settled. No separate deliverable was attached.
          </div>
        )}

        {isDisputed && (
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/15 text-red-300/80 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Deliverable access is frozen while the dispute is under arbiter review.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helper: map on-chain status number to DeliverableStatus ── */
export function toDeliverableStatus(status: number): DeliverableStatus {
  if (status === 2) return "InReview";
  if (status === 4) return "Completed";
  if (status === 3) return "Disputed";
  return "InReview";
}
