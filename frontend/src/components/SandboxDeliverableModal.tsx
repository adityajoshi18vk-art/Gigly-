"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldAlert,
  Lock,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export interface SandboxDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawUrl: string;
  jobTitle: string;
  jobId: number;
  isEscrowSettled: boolean; // true if status === 4 (Released)
  amountUsdc?: string;
  onApproveAndRelease?: () => void;
  isProcessing?: boolean;
}

export function SandboxDeliverableModal({
  isOpen,
  onClose,
  rawUrl,
  jobTitle,
  jobId,
  isEscrowSettled,
  amountUsdc,
  onApproveAndRelease,
  isProcessing = false,
}: SandboxDeliverableModalProps) {
  const [iframeError, setIframeError] = useState(false);

  if (!isOpen) return null;

  const sanitizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  // Masked display URL (e.g. https://github.com/••••••••••••)
  const getMaskedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}/•••••••••••• [ESCROW-PROTECTED]`;
    } catch {
      return "https://•••••••••••••••••••• [ESCROW-PROTECTED]";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEscrowSettled ? "Deliverable Details (Escrow Settled)" : "Sandbox Deliverable Preview"}
      size="xl"
    >
      <div className="space-y-4">
        {/* Anti-fraud / Protection Banner */}
        {!isEscrowSettled ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 flex items-start gap-3 text-xs leading-relaxed text-on-surface">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-amber-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Anti-Theft Watermarked Sandbox
                </span>
                <Badge variant="pending">Escrow Locked</Badge>
              </div>
              <p className="text-slate-700">
                To prevent fraud and intellectual property theft, raw destination links and downloads are restricted. The interactive view below is read-only. The full URL and repository access will be unlocked once escrow funds are released.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 flex items-start gap-3 text-xs leading-relaxed text-on-surface">
            <CheckCircle2 className="w-5 h-5 text-success-light shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <span className="font-semibold text-success-light uppercase tracking-wider text-[11px]">
                Escrow Settled — Full Deliverable Access Unlocked
              </span>
              <p className="text-on-surface-variant">
                Payment has been confirmed and released. You now have full direct access to the deliverable URL.
              </p>
            </div>
          </div>
        )}

        {/* URL Box */}
        <div className="rounded-xl border border-glass-border bg-glass-light p-3 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 truncate text-on-surface">
            <span className="text-[11px] uppercase tracking-wider text-slate-700 font-sans font-bold">
              URL:
            </span>
            <span className="truncate font-medium">
              {isEscrowSettled ? sanitizedUrl : getMaskedUrl(sanitizedUrl)}
            </span>
          </div>
          {isEscrowSettled ? (
            <a
              href={sanitizedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent-light hover:underline shrink-0 font-sans font-semibold text-xs"
            >
              Open Direct Link
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600 shrink-0 font-sans font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3" /> Hidden Until Release
            </span>
          )}
        </div>

        {/* Sandbox Preview Pane with Security Layer */}
        <div className="relative rounded-2xl border border-slate-300 bg-slate-900/90 overflow-hidden shadow-inner h-[380px] select-none">
          {!isEscrowSettled && (
            <>
              {/* Floating watermark protection overlay */}
              <div
                className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, transparent, transparent 120px, rgba(245, 158, 11, 0.05) 120px, rgba(245, 158, 11, 0.05) 240px)",
                }}
              >
                <div className="transform -rotate-12 select-none pointer-events-none text-slate-400/20 font-mono font-black text-3xl tracking-widest text-center uppercase p-4 border-2 border-dashed border-slate-500/20 rounded-3xl">
                  GIGLY ESCROW PROTECTED
                  <br />
                  <span className="text-xl font-normal">UNLICENSED PREVIEW ONLY</span>
                </div>
              </div>

              {/* Read-Only Pointer-Events shield to block copy / double clicks / investigations */}
              <div
                className="absolute inset-0 z-10"
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => e.preventDefault()}
                onMouseDown={(e) => {
                  // allow scrolling if needed, but disable text selections
                  if (e.detail > 1) e.preventDefault();
                }}
              />
            </>
          )}

          {/* Embedded Sandbox iframe */}
          {!iframeError ? (
            <iframe
              src={sanitizedUrl}
              title={`Deliverable for ${jobTitle}`}
              className="w-full h-full border-0 bg-white"
              sandbox={
                isEscrowSettled
                  ? "allow-scripts allow-same-origin allow-popups allow-forms"
                  : "allow-scripts allow-same-origin"
              }
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-white">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="font-semibold text-sm mb-1">Preview Blocked by Provider</p>
              <p className="text-xs text-slate-400 max-w-sm">
                This domain (e.g. GitHub or proprietary host) prevents direct iframe embedding via Content-Security-Policy.
              </p>
              {!isEscrowSettled ? (
                <p className="text-[11px] text-amber-400/80 mt-3 font-mono">
                  Full direct URL link will be displayed here immediately upon approving escrow release.
                </p>
              ) : (
                <a
                  href={sanitizedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-gradient-primary mt-4 text-xs font-semibold py-2 px-4 inline-flex items-center gap-1.5"
                >
                  Launch Live Deliverable
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-glass-border">
          <Button variant="ghost" onClick={onClose}>
            Close Preview
          </Button>

          {!isEscrowSettled && onApproveAndRelease && (
            <div className="flex items-center gap-3">
              {amountUsdc && (
                <span className="text-xs font-mono text-slate-700 font-semibold">
                  Release Amount: <strong className="text-on-surface">${amountUsdc} USDC</strong>
                </span>
              )}
              <Button
                variant="primary"
                onClick={onApproveAndRelease}
                disabled={isProcessing}
                className="text-xs py-2 px-4 shadow-glow-accent flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>Releasing Funds...</>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Approve &amp; Release Full Deliverable
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
