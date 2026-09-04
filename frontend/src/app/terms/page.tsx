import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#071014] selection:bg-accent/30 selection:text-white">
      <LandingNavbar />

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-mono uppercase tracking-wider mb-4 font-semibold">
            [ LEGAL &bull; PROTOCOL TERMS ]
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#071014] mb-3">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Last Updated: September 2026 &bull; Version 1.0 (Decentralized Protocol)
          </p>
        </div>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Nature of the Protocol</h2>
            <p>
              Gigly is a non-custodial decentralized freelance escrow platform. Gigly operates via open-source smart contracts deployed on Ethereum blockchain networks (including Ethereum Sepolia). By connecting your wallet and interacting with the protocol, you acknowledge that transactions are irreversible, non-custodial, and executed autonomously by smart contract code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Escrow Mechanics &amp; Milestone Settlement</h2>
            <p>
              When a Client creates a job and locks USDC into the <code className="text-primary font-mono font-semibold">OptimisticEscrow</code> contract:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Funds are held by the autonomous smart contract and are not stored in any centralized bank or corporate custody.</li>
              <li>When a Freelancer submits work, a review countdown timer commences. If the Client takes no action before the countdown concludes, optimistic settlement allows automated release of funds to the Freelancer.</li>
              <li>A 2.5% protocol maintenance fee (capped at a maximum of 3.0%) is deducted exclusively from the freelancer's payout upon successful escrow completion.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Disputes &amp; Arbiter Authority</h2>
            <p>
              If a dispute is raised by either party prior to expiration of the review window, the job transitions to <code className="font-mono text-slate-800">Disputed</code> status. Disputes are resolved on-chain by the designated Protocol Arbiter, whose determination regarding fund split allocations is final and mathematically binding on-chain.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. User Representations &amp; Wallet Security</h2>
            <p>
              Users are solely responsible for safeguarding their cryptographic private keys and seed phrases. Gigly cannot recover lost private keys, reverse transactions, or undo signed smart contract calls. Users agree not to utilize the protocol for money laundering, illicit transactions, or sanctioned entities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability &amp; Disclaimers</h2>
            <p>
              The Gigly protocol is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. To the maximum extent permitted by applicable law, the Gigly contributors, developers, and protocol maintainers shall not be held liable for smart contract vulnerabilities, blockchain network congestion, gas price fluctuations, or third-party wallet failures.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
