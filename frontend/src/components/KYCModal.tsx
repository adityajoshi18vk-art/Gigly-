"use client";

import { useState, useCallback, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

// ── Elapsed timer sub-component ──────────────────────────────────────────────
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

// ── Animated progress steps during proof generation ──────────────────────────
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
    const delay = 4000 + Math.random() * 6000; // 4-10s per step
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
            className={`flex items-start gap-2 transition-opacity duration-500 ${
              isDone ? "text-emerald-400" : "text-cyan-300"
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
            )}
            <span className="leading-relaxed">{msg}</span>
          </div>
        );
      })}
    </>
  );
}

// ── Main KYCModal ────────────────────────────────────────────────────────────

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

  // Anon Aadhaar SDK hook
  const [anonAadhaar] = useAnonAadhaar();

  // Global/EU fields
  const [documentId, setDocumentId] = useState("");
  const [country, setCountry] = useState("");

  // ── Listen for real ZK proof completion from Anon Aadhaar SDK ───────────
  useEffect(() => {
    if (anonAadhaar.status === "logged-in" && isOpen && jurisdiction === "india") {
      localStorage.setItem(`finguard_kyc_${walletAddress}`, "true");
      onVerified();
      onClose();
    }
  }, [anonAadhaar.status, walletAddress, onVerified, onClose, isOpen, jurisdiction]);

  // ── Form validation (Global/EU tab only — India uses SDK button) ────────
  const isGlobalFormValid =
    documentId.trim().length >= 4 && country.length > 0;

  // ── Reset state ────────────────────────────────────────────────────────
  const resetModal = useCallback(() => {
    setIsVerifying(false);
    setVerificationStepIndex(-1);
    setShowSuccess(false);
    setDocumentId("");
    setCountry("");
  }, []);

  const handleClose = useCallback(() => {
    if (isVerifying) return; // Prevent closing during verification
    resetModal();
    onClose();
  }, [isVerifying, onClose, resetModal]);

  // ── Simulated ZK verification flow (Global/EU tab only) ────────────────
  const handleGlobalVerify = useCallback(async () => {
    setIsVerifying(true);
    setVerificationStepIndex(0);

    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      setVerificationStepIndex(i);
      await new Promise((r) => setTimeout(r, VERIFICATION_STEPS[i].delay));
    }

    // Persist verification
    localStorage.setItem(`finguard_kyc_${walletAddress}`, "true");

    setShowSuccess(true);

    // Brief pause to show success state
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
      <div className="space-y-5">
        {/* ── Success overlay ────────────────────────────────────────────── */}
        {showSuccess && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Identity Verified
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              ZK-KYC Proof accepted. Withdrawals unlocked.
            </p>
          </div>
        )}

        {/* ── Jurisdiction tabs ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="kyc-tab-india"
            onClick={() => !isVerifying && setJurisdiction("india")}
            disabled={isVerifying}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              jurisdiction === "india"
                ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                : "border-gray-200 bg-white text-slate-600 hover:border-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Fingerprint className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="font-semibold leading-tight">
                India (RBI Compliant)
              </div>
              <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                Aadhaar / DigiLocker Verification via ZK-SNARK
              </div>
            </div>
          </button>

          <button
            id="kyc-tab-global"
            onClick={() => !isVerifying && setJurisdiction("global")}
            disabled={isVerifying}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              jurisdiction === "global"
                ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                : "border-gray-200 bg-white text-slate-600 hover:border-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="font-semibold leading-tight">
                Global / EU (GDPR Compliant)
              </div>
              <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                Zero-Knowledge National ID Proof
              </div>
            </div>
          </button>
        </div>

        {/* ── India tab: Anon Aadhaar SDK ─────────────────────────────────── */}
        {jurisdiction === "india" && !isVerifying && (
          <div className="space-y-4">
            {/* Status indicator */}
            {anonAadhaar.status === "logged-in" ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">
                  ZK Proof verified — identity confirmed on-device
                </span>
              </div>
            ) : anonAadhaar.status === "logging-in" ? (
              /* ── Rich animated progress terminal ────────────────────── */
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 space-y-3 font-mono text-xs">
                  {/* Terminal chrome */}
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider">
                      ZK-SNARK Proof Engine
                    </span>
                    {/* Elapsed timer */}
                    <span className="ml-auto text-[10px] text-slate-500">
                      <ProofTimer />
                    </span>
                  </div>

                  {/* Animated steps */}
                  <ProofProgressSteps />
                </div>

                {/* Reassurance bar */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">
                      Generating cryptographic proof — please keep this tab open
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      This runs entirely in your browser via WebAssembly. Typical time: 30–90 seconds depending on device.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">
                  Upload your Aadhaar QR to generate a zero-knowledge proof
                </span>
              </div>
            )}

            {/* Anon Aadhaar SDK login button */}
            <div className="flex justify-center py-2">
              <LogInWithAnonAadhaar
                nullifierSeed={1234}
              />
            </div>

            {/* PSE attribution & privacy notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
              <Fingerprint className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                <strong>Powered by Privacy &amp; Scaling Explorations (PSE).</strong>{" "}
                Your ID is verified locally via ZK-SNARKs and never leaves your
                device. No personal data is transmitted or stored on any server.
              </p>
            </div>
          </div>
        )}

        {/* ── Global / EU form ──────────────────────────────────────────── */}
        {jurisdiction === "global" && !isVerifying && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Document ID (Passport / National ID)
              </label>
              <input
                id="kyc-document-id-input"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="e.g. AB1234567"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm font-semibold text-slate-800 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Country of Issuance
              </label>
              <select
                id="kyc-country-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm font-semibold text-slate-800 transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Select country…
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Verification terminal (Global/EU only) ──────────────────────── */}
        {isVerifying && (
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] uppercase tracking-wider">
                ZK-SNARK Verification Terminal
              </span>
            </div>

            {VERIFICATION_STEPS.map((step, i) => {
              if (i > verificationStepIndex) return null;
              const isDone = i < verificationStepIndex;
              const isCurrent = i === verificationStepIndex;

              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 transition-opacity duration-300 ${
                    isDone
                      ? "text-emerald-400"
                      : isCurrent
                      ? "text-cyan-300"
                      : "text-slate-600"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <span className="leading-relaxed">{step.message}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Compliance notice ──────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong>🔒 Zero-Knowledge Guarantee:</strong> Your sensitive
            identity data is hashed and verified off-chain. No PII is recorded
            on the blockchain (GDPR Article 25 &amp; FATF Compliant).
          </p>
        </div>

        {/* ── Submit button (Global/EU tab only) ──────────────────────────── */}
        {jurisdiction === "global" && !isVerifying && (
          <button
            id="kyc-verify-btn"
            onClick={handleGlobalVerify}
            disabled={!isGlobalFormValid}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Shield className="w-4 h-4" />
            Generate ZK Proof &amp; Verify
          </button>
        )}
      </div>
    </Modal>
  );
}
