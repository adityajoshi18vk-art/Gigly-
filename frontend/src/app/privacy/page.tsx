import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { ShieldCheck, Lock, EyeOff, ServerOff } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#071014] selection:bg-accent/30 selection:text-white">
      <LandingNavbar />

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-mono uppercase tracking-wider mb-4 font-semibold">
            [ DATA SOVEREIGNTY &bull; ZERO-KNOWLEDGE ]
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#071014] mb-3">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Zero Personally Identifiable Information (PII) Stored &bull; GDPR Art. 25 Aligned
          </p>
        </div>

        {/* 4 Core Privacy Guarantees */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
            <ServerOff className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">Zero Server Storage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">No passport scans, Aadhaar numbers, phone numbers, or government IDs touch or persist on our servers.</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
            <Lock className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">On-Device Cryptography</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Proofs are compiled in-browser via WebAssembly Groth16 ZK-SNARK circuits without network egress.</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
            <EyeOff className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">Blind Identity Proofs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Proofs affirm valid credential holding and age threshold while keeping underlying identity attributes hidden.</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
            <ShieldCheck className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">GDPR &amp; RBI Aligned</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Engineered in compliance with GDPR Article 25 (Privacy by Design) and FATF Travel Rule guidelines.</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Do NOT Collect</h2>
            <p>
              Unlike traditional freelance marketplaces, Gigly explicitly does NOT collect, harvest, store, or sell:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full names, home addresses, or physical locations</li>
              <li>National identification numbers (SSN, Aadhaar, Passport IDs)</li>
              <li>Government-issued ID documents or photo uploads</li>
              <li>Bank account numbers, credit card details, or fiat billing addresses</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. How Zero-Knowledge Proofs Work</h2>
            <p>
              When completing identity verification via <strong>Anon Aadhaar</strong> or <strong>ZKPassport</strong>, cryptographic operations execute locally on your personal machine or mobile device. A mathematical proof is generated asserting that your credential contains a valid government signature, but the signature and personal fields are mathematically blinded before any verification flag is recorded.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. On-Chain Information</h2>
            <p>
              Interactions with the Gigly smart contracts are public by the nature of the Ethereum blockchain. When you fund an escrow or submit a milestone, the public wallet address, transaction hash, and timestamp become part of the immutable public ledger. Do not include private or sensitive information in public job descriptions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Cookies and Local Storage</h2>
            <p>
              Gigly uses minimal local browser storage (<code className="text-primary font-mono font-semibold">localStorage</code>) solely to remember your chosen user role (Client vs Freelancer) and cached verification state on your own browser. We do not use cross-site tracking cookies or third-party advertising trackers.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
