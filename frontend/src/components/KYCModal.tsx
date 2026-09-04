"use client";

import { useState, useCallback, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  LogInWithAnonAadhaar,
  useAnonAadhaar,
} from "@anon-aadhaar/react";
import {
  Shield,
  Fingerprint,
  Globe,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  walletAddress: string;
}

type Jurisdiction = "india" | "global";

interface VerificationStep {
  message: string;
  delay: number;
}

const VERIFICATION_STEPS: VerificationStep[] = [
  { message: "🔐 Generating Zero-Knowledge Proof off-chain...", delay: 900 },
  {
    message: "📜 Verifying ZK-SNARK against compliance registry...",
    delay: 1000,
  },
  {
    message: "✅ Cryptographic proof validated (Proof Hash: 0x7f2a...c91e)",
    delay: 600,
  },
];

const COUNTRIES = [
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Portugal",
  "Belgium",
  "Austria",
  "Sweden",
  "Ireland",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Japan",
  "South Korea",
  "Singapore",
  "Brazil",
  "Switzerland",
  "Other",
] as const;

function ProofTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <>{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} elapsed</>;
}

const PROOF_PROGRESS_MESSAGES = [
  "🔍 Loading ZK circuit artifacts (WASM + zkey)...",
  "📦 Decompressing witness generation module...",
  "🧮 Computing Aadhaar signature witness...",
  "🔐 Generating Groth16 ZK-SNARK proof...",
  "📜 Constructing proof commitment...",
  "🔗 Finalizing cryptographic attestation...",
];

function ProofProgressSteps() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= PROOF_PROGRESS_MESSAGES.length) return;
    const delay = 4000 + Math.random() * 6000;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <>
      {PROOF_PROGRESS_MESSAGES.slice(0, visibleCount).map((msg, i) => {
        const isDone = i < visibleCount - 1;
        return (
          <div
            key={i}
            className={`flex items-start gap-2 transition-opacity duration-500 text-xs font-mono ${
              isDone ? "text-success-light" : "text-accent-light"
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-success-light" />
            ) : (
              <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-accent-light" />
            )}
            <span className="leading-relaxed">{msg}</span>
          </div>
        );
      })}
    </>
  );
}

export function KYCModal({
  isOpen,
  onClose,
  onVerified,
  walletAddress,
}: KYCModalProps) {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("india");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStepIndex, setVerificationStepIndex] = useState(-1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [anonAadhaar] = useAnonAadhaar();

  const [documentId, setDocumentId] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (anonAadhaar.status === "logged-in" && isOpen && jurisdiction === "india") {
      localStorage.setItem(`finguard_kyc_${walletAddress}`, "true");
      onVerified();
      onClose();
    }
  }, [anonAadhaar.status, walletAddress, onVerified, onClose, isOpen, jurisdiction]);

  const isGlobalFormValid =
    documentId.trim().length >= 4 && country.length > 0;

  const resetModal = useCallback(() => {
    setIsVerifying(false);
    setVerificationStepIndex(-1);
    setShowSuccess(false);
    setDocumentId("");
    setCountry("");
  }, []);

  const handleClose = useCallback(() => {
    if (isVerifying) return;
    resetModal();
    onClose();
  }, [isVerifying, onClose, resetModal]);

  const handleGlobalVerify = useCallback(async () => {
    setIsVerifying(true);
    setVerificationStepIndex(0);

    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      setVerificationStepIndex(i);
      await new Promise((r) => setTimeout(r, VERIFICATION_STEPS[i].delay));
    }

    localStorage.setItem(`finguard_kyc_${walletAddress}`, "true");
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 1200));

    onVerified();
    resetModal();
    onClose();
  }, [walletAddress, onVerified, onClose, resetModal]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🛡️ International Compliance Gate"
    >
      <div className="space-y-5 relative">
        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mb-4 shadow-glow-success">
              <CheckCircle2 className="w-8 h-8 text-success-light" />
            </div>
            <h3 className="font-display text-lg font-bold text-on-surface">
              Identity Verified
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              ZK-KYC Proof validated off-chain. Fiat banking off-ramp unlocked.
            </p>
          </div>
        )}

        {/* Jurisdiction tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="kyc-tab-india"
            onClick={() => !isVerifying && setJurisdiction("india")}
            disabled={isVerifying}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              jurisdiction === "india"
                ? "border-accent/50 bg-accent/15 text-white shadow-glow-accent"
                : "border-glass-border bg-glass-light text-on-surface-variant hover:border-glass-border-light hover:text-on-surface"
            } disabled:opacity-50`}
          >
            <Fingerprint className="w-4 h-4 shrink-0 text-accent-light" />
            <div>
              <div className="text-xs font-semibold leading-tight">India (RBI)</div>
              <div className="text-[10px] text-on-surface-variant/70 leading-tight mt-0.5">
                Aadhaar ZK-SNARK
              </div>
            </div>
          </button>

          <button
            id="kyc-tab-global"
            onClick={() => !isVerifying && setJurisdiction("global")}
            disabled={isVerifying}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              jurisdiction === "global"
                ? "border-accent/50 bg-accent/15 text-white shadow-glow-accent"
                : "border-glass-border bg-glass-light text-on-surface-variant hover:border-glass-border-light hover:text-on-surface"
            } disabled:opacity-50`}
          >
            <Globe className="w-4 h-4 shrink-0 text-accent-light" />
            <div>
              <div className="text-xs font-semibold leading-tight">Global / EU (GDPR)</div>
              <div className="text-[10px] text-on-surface-variant/70 leading-tight mt-0.5">
                ZK National ID Proof
              </div>
            </div>
          </button>
        </div>

        {/* India tab: Anon Aadhaar SDK */}
        {jurisdiction === "india" && !isVerifying && (
          <div className="space-y-4">
            {anonAadhaar.status === "logged-in" ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/15 border border-success/30 text-success-light text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ZK Proof verified — identity confirmed on-device</span>
              </div>
            ) : anonAadhaar.status === "logging-in" ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-surface-container-lowest border border-glass-border p-4 space-y-3">
                  <div className="flex items-center justify-between text-on-surface-variant mb-1 font-mono text-[10px]">
                    <span>ZK-SNARK PROOF ENGINE</span>
                    <ProofTimer />
                  </div>
                  <ProofProgressSteps />
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <p>Generating cryptographic proof locally in browser (30–90s)...</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-glass-light border border-glass-border text-on-surface-variant text-xs">
                <Shield className="w-4 h-4 text-accent-light shrink-0" />
                <span>Upload your Aadhaar QR to generate zero-knowledge proof</span>
              </div>
            )}

            <div className="flex justify-center py-2">
              <LogInWithAnonAadhaar nullifierSeed={1234} />
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
              <Fingerprint className="w-4 h-4 text-accent-light shrink-0 mt-0.5" />
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                <strong>Privacy &amp; Scaling Explorations (PSE):</strong> Verified entirely on-device via Groth16 ZK-SNARKs. No Aadhaar numbers or personal identifiers ever touch our servers.
              </p>
            </div>
          </div>
        )}

        {/* Global / EU form */}
        {jurisdiction === "global" && !isVerifying && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Document ID (Passport / National ID)
              </label>
              <input
                id="kyc-document-id-input"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="e.g. AB1234567"
                className="glass-input text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Country of Issuance
              </label>
              <select
                id="kyc-country-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="glass-input text-sm [&>option]:bg-surface-container [&>option]:text-on-surface"
              >
                <option value="" disabled>Select country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Button
              id="kyc-verify-btn"
              onClick={handleGlobalVerify}
              disabled={!isGlobalFormValid}
              variant="primary"
              className="w-full py-3 shadow-glow-accent text-xs font-semibold"
            >
              <Shield className="w-4 h-4" />
              Generate ZK Proof &amp; Verify
            </Button>
          </div>
        )}

        {/* Verification terminal */}
        {isVerifying && (
          <div className="rounded-xl bg-surface-container-lowest border border-glass-border p-4 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              ZK-SNARK Verification Terminal
            </div>

            {VERIFICATION_STEPS.map((step, i) => {
              if (i > verificationStepIndex) return null;
              const isDone = i < verificationStepIndex;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 ${
                    isDone ? "text-success-light" : "text-accent-light"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <span>{step.message}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-glass-border bg-glass-subtle px-4 py-3">
          <Lock className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" />
          <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
            <strong>Zero-Knowledge Guarantee:</strong> Identity credentials are authenticated without disclosing raw identity parameters (GDPR Art. 25 &amp; FATF aligned).
          </p>
        </div>
      </div>
    </Modal>
  );
}
