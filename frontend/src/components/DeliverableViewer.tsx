"use client";

import { Lock, Download, Eye, ShieldAlert } from "lucide-react";

interface DeliverableViewerProps {
  /** URL shown during review (watermarked, protected) */
  previewUrl: string;
  /** URL to final deliverable (unlocked after escrow release) */
  rawDeliverableUrl: string;
  /** On-chain job status number: 2 = Submitted/InReview, 4 = Released/Completed */
  jobStatus: number;
}

export function DeliverableViewer({
  previewUrl,
  rawDeliverableUrl,
  jobStatus,
}: DeliverableViewerProps) {
  const isLocked = jobStatus !== 4;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xs font-medium text-white/60">
          <Eye className="w-3.5 h-3.5" />
          Deliverable Preview
        </div>
        {isLocked ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
            <ShieldAlert className="w-3 h-3" />
            Escrow Locked
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <Download className="w-3 h-3" />
            Unlocked
          </span>
        )}
      </div>

      {/* Preview sandbox */}
      <div
        className="relative"
        {...(isLocked
          ? {
              onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
              onDragStart: (e: React.DragEvent) => e.preventDefault(),
            }
          : {})}
      >
        {/* Iframe preview */}
        <iframe
          src={previewUrl}
          title="Deliverable Preview"
          className={`w-full h-[420px] border-0 bg-white ${isLocked ? "select-none" : ""}`}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
        />

        {/* Watermark overlay (only when locked) */}
        {isLocked && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="watermark-pattern"
                  x="0"
                  y="0"
                  width="320"
                  height="160"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-30)"
                >
                  <text
                    x="10"
                    y="40"
                    fill="rgba(255,255,255,0.08)"
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="monospace"
                    letterSpacing="2"
                  >
                    PREVIEW ONLY • ESCROW LOCKED • GIGLY
                  </text>
                  <text
                    x="10"
                    y="120"
                    fill="rgba(255,255,255,0.05)"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                    letterSpacing="1"
                  >
                    RELEASE FUNDS TO UNLOCK
                  </text>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
            </svg>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
        {isLocked ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-sm font-medium cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Awaiting Escrow Release to Download
          </button>
        ) : (
          <a
            href={rawDeliverableUrl.startsWith("http") ? rawDeliverableUrl : `https://${rawDeliverableUrl}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 text-sm font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            Download Final Deliverable
          </a>
        )}
      </div>
    </div>
  );
}
