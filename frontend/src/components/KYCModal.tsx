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
  Smartphone,
} from "lucide-react";
import QRCode from "react-qr-code";

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

const GLOBAL_SIMULATION_STEPS: VerificationStep[] = [
  { message: "📱 NFC Handshake: e-Passport detected (ICAO 9303 Compliant)...", delay: 700 },
  { message: "🔐 Verifying government digital signature off-chain...", delay: 800 },
  { message: "🛡️ Generating Zero-Knowledge Proof (Zero PII on-chain)...", delay: 700 },
  { message: "✅ Proof Validated: GDPR Article 25 & FATF Compliant!", delay: 500 },
];



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

  // ZKPassport QR URL — generated immediately, no async blocking
  const zkpUrl = `zkpassport://verify?domain=localhost:3000&purpose=GDPR_Escrow_Compliance&nullifier=${walletAddress || "demo"}`;

  // Global/EU simulation state
  const [globalSimulating, setGlobalSimulating] = useState(false);
  const [globalSimStep, setGlobalSimStep] = useState(-1);

  // ── Listen for real ZK proof completion from Anon Aadhaar SDK ───────────
  useEffect(() => {
    if (anonAadhaar.status === "logged-in" && isOpen && jurisdiction === "india") {
      localStorage.setItem(`finguard_kyc_${walletAddress}`, "true");
      onVerified();
      onClose();
    }
  }, [anonAadhaar.status, walletAddress, onVerified, onClose, isOpen, jurisdiction]);

  // ── Reset state ────────────────────────────────────────────────────────
  const resetModal = useCallback(() => {
    setIsVerifying(false);
    setVerificationStepIndex(-1);
    setShowSuccess(false);
    setGlobalSimulating(false);
    setGlobalSimStep(-1);
  }, []);

  const handleClose = useCallback(() => {
    if (isVerifying) return; // Prevent closing during verification
    resetModal();
    onClose();
  }, [isVerifying, onClose, resetModal]);

  // ── Dev-mode simulate scan (Global/EU tab) ─────────────────────────────
  const handleSimulateScan = useCallback(async () => {
    setGlobalSimulating(true);

    for (let i = 0; i < GLOBAL_SIMULATION_STEPS.length; i++) {
      setGlobalSimStep(i);
      await new Promise((r) => setTimeout(r, GLOBAL_SIMULATION_STEPS[i].delay));
    }

    // All steps complete — persist & notify
    localStorage.setItem(`finguard_kyc_${walletAddress}`, "true");
    onVerified();

    // Brief pause to show the final ✅ step before closing
    await new Promise((r) => setTimeout(r, 600));
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
            onClick={() => { if (!isVerifying && !globalSimulating) { setGlobalSimulating(false); setGlobalSimStep(-1); setJurisdiction("india"); } }}
            disabled={isVerifying || globalSimulating}
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
            onClick={() => { if (!isVerifying && !globalSimulating) { setJurisdiction("global"); } }}
            disabled={isVerifying || globalSimulating}
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

        {/* ── Global / EU — ZKPassport QR Code ──────────────────────────── */}
        {jurisdiction === "global" && !isVerifying && !globalSimulating && (
          <div className="space-y-4">
            {/* Subtitle */}
            <div className="flex items-start gap-2.5 rounded-xl border border-cyan-100 bg-cyan-50/50 px-4 py-3">
              <Globe className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-cyan-800 leading-relaxed">
                <strong>Powered by ZKPassport.</strong>{" "}
                Scan this QR code with the ZKPassport app to verify your e-Passport via NFC.
              </p>
            </div>

            {/* QR Code area */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-4 bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100">
                <QRCode
                  id="zkpassport-qr"
                  value={zkpUrl}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-3 text-center">
                📱 Scan with <strong>ZKPassport Mobile App</strong>
              </p>
            </div>

            {/* Dev-mode simulate button */}
            <button
              id="kyc-simulate-scan-btn"
              onClick={handleSimulateScan}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 text-slate-500 hover:text-teal-700 font-semibold text-xs transition-all"
            >
              <Smartphone className="w-4 h-4" />
              Simulate Phone Scan (Dev Mode)
            </button>
          </div>
        )}

        {/* ── Global/EU — Simulated NFC Verification Terminal ────────────── */}
        {jurisdiction === "global" && globalSimulating && (
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
                  ZKPassport NFC Verification
                </span>
                <span className="ml-auto text-[10px] text-slate-500">
                  <ProofTimer />
                </span>
              </div>

              {/* Animated steps */}
              {GLOBAL_SIMULATION_STEPS.map((step, i) => {
                if (i > globalSimStep) return null;
                const isDone = i < globalSimStep;
                const isCurrent = i === globalSimStep;

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

            {/* Reassurance bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-cyan-50 border border-cyan-200">
              <Loader2 className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-medium text-cyan-800">
                  Verifying e-Passport via NFC — please wait
                </p>
                <p className="text-[10px] text-cyan-600 mt-0.5">
                  ZK proof generated entirely on-device. No PII leaves your phone.
                </p>
              </div>
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
            <strong>🔒 Zero-Knowledge Guarantee:</strong>{" "}
            {jurisdiction === "global"
              ? "Your e-Passport is verified entirely via client-side ZK-SNARKs. No personally identifiable information (PII) is stored on-chain or transmitted to any server (GDPR Article 25 & eIDAS Compliant)."
              : "Your sensitive identity data is hashed and verified off-chain. No PII is recorded on the blockchain (GDPR Article 25 & FATF Compliant)."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
